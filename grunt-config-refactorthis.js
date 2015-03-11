module.exports = {
	exec:
	{
		create_broadcast_list:
		{
			cmd: function()
			{
				var listxml = grunt.file.read('xml/list.create.template.xml');
				listxml = listxml.replace('{{LIST-NAME}}', settings.streamsend_name + '-Broadcast');
								
				return 'curl -i -H "Content-Type: application/xml" -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/audiences/2/lists.xml" -d "' + listxml + '"';
			},
			callback: function (error, stdout, stderr)
			{
				var regex = /Location: http:\/\/app.streamsend.com\/audiences\/2\/lists\/(\d+)/;
				var arr = regex.exec(stdout);
				settings.list_id = arr[1];
				grunt.log.write('List ID is: ' + settings.list_id);
				grunt.log.write();
				grunt.file.write('settings.json', JSON.stringify(settings, null, 2)); // Save the list ID
			}
		},
		upload_custdata:
		{
			cmd: function(file_to_upload)
			{
				var regex = /custdata\/(\w+).tsv/;
				var arr = regex.exec(file_to_upload);
				session.current_file = arr[1];
				console.log(session.current_file);
				return 'curl -i -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/uploads.xml" -F data=@' + file_to_upload;
			},
			callback: function (error, stdout, stderr)
			{
				var regex = /Location: http:\/\/app.streamsend.com\/uploads\/(\d+)/;
				var arr = regex.exec(stdout);
				var id = arr[1];
				console.log('Upload ID is ' + id);
				imps[session.current_file] = {upload_id: id};
				grunt.file.write('imps.json', JSON.stringify(imps, null, 2)); // Save the TSV IDs so we can import them later
				grunt.task.run('exec:import_custdata:' + session.current_file);
			}
		},
		import_custdata:
		{
			cmd: function(i)
			{
				session.current_file = i;
				var impxml = grunt.file.read('xml/import.template.xml');
				impxml = impxml.replace('{{LIST-ID}}', settings.list_id);
				impxml = impxml.replace('{{UPLOAD-ID}}', imps[i].upload_id);
				return 'curl -i -H "Content-Type: application/xml" -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/audiences/2/imports.xml" -d "' + impxml + '"';
			},
			callback: function (error, stdout, stderr)
			{
				var regex = /Location: http:\/\/app.streamsend.com\/audiences\/2\/imports\/(\d+)/;
				var arr = regex.exec(stdout);
				var id = arr[1];
				console.log('Importing upload ' + session.current_file + ' - Import ID is ' + id);
				imps[session.current_file].import_id = id;
				imps[session.current_file].status = 'waiting';
				grunt.file.write('imps.json', JSON.stringify(imps, null, 2)); // Save the Import state
			}
		},
		check_import_status:
		{
			cmd: function(i)
			{
				session.current_file = i;
				var import_id = imps[i].import_id;
				return 'curl -i -H Accept: application/xml -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/audiences/2/imports/' + import_id + '.xml"';
			},
			callback: function (error, stdout, stderr)
			{
				var response_code = get_http_status(stdout);
				switch(response_code)
				{
					case '200':
					case '202':
						// Get body XML
						var parseString = require('xml2js').parseString;
						arr = stdout.split(/\r?\n\r?\n/, 2);
						parseString(arr[1], function (err, result) {
							var status = result.import.status[0];
							switch(status)
							{
								case 'waiting':
									var msg = status;
									break;
								case 'in progress':
									var pcc = result.import['percent-complete'][0]._
									var msg = status + ' - ' + pcc + '% complete';
									break;
								case 'completed':
									var attempted 	= result.import['attempted-rows'][0]._;
									var invalid 	= result.import['invalid-rows'][0]._
									var msg = status + ' - attempted ' + attempted + ' rows / ' + invalid + ' invalid';
									break;
							}
							console.log(msg);
							imps[session.current_file].status = msg;
						});					
						break;
					case '404':
						imps[session.current_file].status = 'file to import not fount';
						break;
					default:
						imps[session.current_file].status = 'unexpected response - check manually';
						break;
				}
				grunt.file.write('imps.json', JSON.stringify(imps, null, 2)); // Save the Import state
			}
		},	
		blast:
		{
			cmd: 'curl -i -H "Content-Type: application/xml" -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/audiences/2/blasts.xml" -d @output/blast.xml',
			callback: function (error, stdout, stderr)
			{
				var response_code = get_http_status(stdout);
				switch(response_code)
				{
					case '201':
						// Get the Blast ID
						var regex = /Location: http:\/\/app.streamsend.com\/blasts\/(\d+)/;
						var arr = regex.exec(stdout);
						var id = arr[1];
						settings.blast_id = arr[1];
						grunt.log.write('Blast ID is: ' + settings.blast_id);
						grunt.log.write();
						grunt.file.write('settings.json', JSON.stringify(settings, null, 2)); // Save the blast ID
						break;
					default:
						console.log('ERROR - Blast could not be scheduled - HTTP Response Code: ' + response_code);
						break;
				}
			}
		},
		get_links:
		{
			cmd: 'curl -i -H Accept: application/xml -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/blasts/' + settings.blast_id + '/links.xml"',
			callback: function (error, stdout, stderr)
			{
				var response_code = get_http_status(stdout);
				switch(response_code)
				{
					case '200':
						// Get body XML
						var parseString = require('xml2js').parseString;
						arr = stdout.split(/\r?\n\r?\n/, 2);
						parseString(arr[1], function (err, result) {
							var links = [];
							result.links.link.forEach(function(l) {
								var link_id = l.id[0]._;
								var url 	= l.url[0];
								if (typeof links[url] == 'undefined') links[url] = [];
								links[url].push(link_id);
							});
							console.log();
							console.log('Links and corresponding Link IDs')
							console.log('--------------------------------');
							console.log();
							var links2 = [];
							for (link in links) {
								console.log(link + ' - ' + links[link].join(', '));
								links2.push({url: link, link_ids: links[link]});
							}
							grunt.file.write('reports/links.json', JSON.stringify(links2, null, 2)); // Save the links & link ids
						});					
						break;
					default:
						console.log('ERROR - Links could not be retrieved - HTTP Response Code: ' + response_code);
						break;
				}
			}
		},
		count_clicks_or_views:
		{
			cmd: function(what)
			{
				session.what = what;
				return 'curl -i -H Accept: application/xml -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/blasts/' + settings.blast_id + '/' +  what + '/count.xml"';
			},
			callback: function (error, stdout, stderr)
			{
				var response_code = get_http_status(stdout);
				switch(response_code)
				{
					case '200':
						// Get body XML
						var parseString = require('xml2js').parseString;
						arr = stdout.split(/\r?\n\r?\n/, 2);
						parseString(arr[1], function (err, result) {
							session[session.what] = result.count._;
							console.log(session.what + ' count is ' + result.count._);
						});
						break;
					default:
						console.log('ERROR - ' + session.what + ' could not be counted - HTTP Response Code: ' + response_code);
						break;
				}
			}
		},
		get_clicks:
		{
			cmd: function(i)
			{
				return 'curl -i -H Accept: application/xml -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/blasts/' + settings.blast_id + '/clicks.xml?page=' + i + '"';
			},
			callback: function (error, stdout, stderr)
			{
				var response_code = get_http_status(stdout);
				switch(response_code)
				{
					case '200':
						// Get body XML
						var parseString = require('xml2js').parseString;
						arr = stdout.split(/\r?\n\r?\n/, 2);
						parseString(arr[1], function (err, result) {
							var links 	= session.links;
							var clicks 	= session.clicks;
							var people 	= session.people;
							result.clicks.click.forEach(function(c) {
								var email 		= c['email-address'][0];
								var link		= links[c['link-id'][0]._];
								var time		= c['created-at'][0]._
								var ip_address 	= c['ip-address'][0];
								var user_agent 	= c['user-agent'][0];
								if (typeof clicks[link] == 'undefined') clicks[link] = [];
								clicks[link].push({email: email, time: time, ip_address: ip_address, user_agent: user_agent});
								if (typeof people[email] == 'undefined') people[email] = [];
								people[email].push(link);
							});
							session.clicks = clicks;
							session.people = people;
						});
						break;
					default:
						console.log('ERROR - clicks could not be retrieved - HTTP Response Code: ' + response_code);
						break;
				}
			}
		},
		get_views:
		{
			cmd: function(i)
			{
				return 'curl -i -H Accept: application/xml -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/blasts/' + settings.blast_id + '/views.xml?page=' + i + '"';
			},
			callback: function (error, stdout, stderr)
			{
				var response_code = get_http_status(stdout);
				switch(response_code)
				{
					case '200':
						// Get body XML
						var parseString = require('xml2js').parseString;
						arr = stdout.split(/\r?\n\r?\n/, 2);
						parseString(arr[1], function (err, result) {
							var views 	= session.views;
							result.views.view.forEach(function(c) {
								var email 		= c['email-address'][0];
								var time		= c['created-at'][0]._
								var ip_address 	= c['ip-address'][0];
								var user_agent 	= c['user-agent'][0];
								views.push({email: email, time: time, ip_address: ip_address, user_agent: user_agent});
							});
							session.views  = views;
						});
						break;
					default:
						console.log('ERROR - views could not be retrieved - HTTP Response Code: ' + response_code);
						break;
				}
			}
		},
		'compile_primary_dmids':
		{
			cmd: 'python compile_primary_dmids.py',
			callback: function (error, stdout, stderr)
			{
				console.log();
				console.log('PRIMARY DMID COMPILATION DONE');
				console.log();
			}
		},
		'db_create':
		{
			cmd: function()
			{
				var sql = [];
				session.db_name = 'dmnews_' + settings.streamsend_name.replace(/-/g, '_');
				sql.push('DROP DATABASE IF EXISTS ' + session.db_name);
				sql.push('CREATE DATABASE ' + session.db_name);
				sql.push('USE ' + session.db_name);
				sql.push('');
				sql = sql.join(';\n');
				grunt.file.write('sql/create_database.sql', sql);
				var credentials = ' -u' + global_config.db_user + ' -p' + global_config.db_pass
				return 'cat sql/create_database.sql sql/define_tables.sql | ' + global_config.db_cli + credentials;
			},
			callback: function (error, stdout, stderr)
			{
				if (stderr)
				{
					console.log(stderr);
				}
				else
				{
					console.log();
					console.log('DATABASE CREATION DONE - created ', session.db_name);
					console.log();
				}
			}
		},
		'db_import':
		{
			cmd: function()
			{
				session.db_name = 'dmnews_' + settings.streamsend_name.replace(/-/g, '_');
				return 'node db_import.js ' + [global_config.db_user, global_config.db_pass, session.db_name].join(' ');
			},
			callback: function (error, stdout, stderr)
			{
				if (stderr)
				{
					console.log(stderr);
				}
				else
				{
					console.log();
					console.log('DATABASE IMPORT DONE');
					console.log();
				}
			}
		}
	},
	// Prepare Blast XML
	'string-replace': {
		test: {
			files: {
				'output/blast.xml': 'xml/blast.test.template.xml'
			},
			options: {
				replacements: [
					{
						pattern: '{{FROM-NAME}}',
						replacement: settings.from_name
					},
					{
						pattern: '{{FROM-EMAIL}}',
						replacement: settings.from_email
					},
					{
						pattern: '{{SUBJECT}}',
						replacement: settings.subject
					},
					{
						pattern: '{{ID}}',
						replacement: settings.id
					},
					{
						pattern: '{{BLAST-TIME}}',
						replacement: global_config.schedule
					}
				]
			}
		},
		send: {
			files: {
				'output/blast.xml': 'xml/blast.send.template.xml'
			},
			options: {
				replacements: [
					{
						pattern: '{{FROM-NAME}}',
						replacement: settings.from_name
					},
					{
						pattern: '{{FROM-EMAIL}}',
						replacement: settings.from_email
					},
					{
						pattern: '{{SUBJECT}}',
						replacement: settings.subject
					},
					{
						pattern: '{{ID}}',
						replacement: settings.id
					},
					{
						pattern: '{{LIST-ID}}',
						replacement: settings.list_id
					},
					{
						pattern: '{{BLAST-TIME}}',
						replacement: global_config.schedule
					}
				]
			}
		},
	}
}
