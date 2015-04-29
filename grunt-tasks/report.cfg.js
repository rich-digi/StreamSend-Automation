module.exports = function(grunt, config)
{
	var global_config 	= config.global_config;
	var settings 		= config.settings;
	var get_http_status = config.get_http_status;
	var temp			= config.temp;
	
	return {
		exec:
		{
			get_links:
			{
				cmd: function(i)
				{
					var blast_id = settings.variants[i].blast_id;
					var c = 'echo INDEX=' + i + '\n';
					c += 'curl -i -H Accept: application/xml -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/blasts/' + blast_id + '/links.xml"';
					return c;
				},
				callback: function (error, stdout, stderr)
				{
					var regex = /INDEX=(\d+)/;
					var arr = regex.exec(stdout);
					var i = arr[1];
					var pre = settings.variants[i].variant;

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
								// Save the links & link ids
								grunt.file.write('reports/links-' + pre + '.json', JSON.stringify(links2, null, 2));
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
				cmd: function(i, what)
				{
					console.dir(settings.variants[i]);
					var blast_id = settings.variants[i].blast_id;
					var c = 'echo INDEX=' + i + '\n';
					c += 'echo CLICKSORVIEWS=' + what + '\n';
					c += 'curl -i -H Accept: application/xml -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/blasts/' + blast_id + '/' +  what + '/count.xml"';
					return c;
				},
				callback: function (error, stdout, stderr)
				{
					var regex = /INDEX=(\d+)/;
					var arr = regex.exec(stdout);
					var i = arr[1];

					var regex = /CLICKSORVIEWS=(\w+)/;
					var arr = regex.exec(stdout);
					var what = arr[1];

					var response_code = get_http_status(stdout);
					switch(response_code)
					{
						case '200':
							// Get body XML
							var parseString = require('xml2js').parseString;
							arr = stdout.split(/\r?\n\r?\n/, 2);
							parseString(arr[1], function (err, result) {
								temp[what] = result.count._;
								console.log(what + ' count is ' + result.count._);
							});
							break;
						default:
							console.log('ERROR - ' + what + ' could not be counted - HTTP Response Code: ' + response_code);
							break;
					}
				}
			},
			get_clicks:
			{
				cmd: function(i, page)
				{
					var blast_id = settings.variants[i].blast_id;
					var c = 'echo INDEX=' + i + '\n';
					c += 'curl -i -H Accept: application/xml -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/blasts/' + blast_id + '/clicks.xml?page=' + page + '"';
					return c;
				},
				callback: function (error, stdout, stderr)
				{
					var regex = /INDEX=(\d+)/;
					var arr = regex.exec(stdout);
					var i = arr[1];

					var response_code = get_http_status(stdout);
					switch(response_code)
					{
						case '200':
							// Get body XML
							var parseString = require('xml2js').parseString;
							arr = stdout.split(/\r?\n\r?\n/, 2);
							parseString(arr[1], function (err, result) {
								var links 	= temp.links;
								var clicks 	= temp.clicks;
								var people 	= temp.people;
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
								temp.clicks = clicks;
								temp.people = people;
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
				cmd: function(i, page)
				{
					var blast_id = settings.variants[i].blast_id;
					var c = 'echo INDEX=' + i + '\n';
					c += 'curl -i -H Accept: application/xml -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/blasts/' + blast_id + '/views.xml?page=' + page + '"';
					return c;
				},
				callback: function (error, stdout, stderr)
				{
					var regex = /INDEX=(\d+)/;
					var arr = regex.exec(stdout);
					var i = arr[1];

					var response_code = get_http_status(stdout);
					switch(response_code)
					{
						case '200':
							// Get body XML
							var parseString = require('xml2js').parseString;
							arr = stdout.split(/\r?\n\r?\n/, 2);
							parseString(arr[1], function (err, result) {
								var views = temp.views;
								result.views.view.forEach(function(c) {
									var email 		= c['email-address'][0];
									var time		= c['created-at'][0]._
									var ip_address 	= c['ip-address'][0];
									var user_agent 	= c['user-agent'][0];
									views.push({email: email, time: time, ip_address: ip_address, user_agent: user_agent});
								});
								temp.views  = views;
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
				cmd: function(i)
				{
					var pre = settings.variants[i].variant;
					var sql = [];
					temp.db_name = 'dmnews_' + settings.streamsend_root_name.replace(/-/g, '_') + '_' + pre;
					sql.push('DROP DATABASE IF EXISTS ' + temp.db_name);
					sql.push('CREATE DATABASE ' + temp.db_name);
					sql.push('USE ' + temp.db_name);
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
						console.log('DATABASE CREATION DONE - created ', temp.db_name);
						console.log();
					}
				}
			},
			'db_import':
			{
				cmd: function(i)
				{
					var pre = settings.variants[i].variant;
					var db_name = 'dmnews_' + settings.streamsend_root_name.replace(/-/g, '_') + '_' + pre;
					return 'node db_import.js ' + [global_config.db_user, global_config.db_pass, db_name].join(' ');
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
		}
	}
}
