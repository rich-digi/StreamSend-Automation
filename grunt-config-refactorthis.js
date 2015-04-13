module.exports = {
	exec:
	{
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
}
