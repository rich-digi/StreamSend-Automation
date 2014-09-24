module.exports = function(grunt)
{
 	// -----------------------------------------------------------------------------------------------------------------
 	// CONFIG

	//var b = new Buffer('QPXvsDjJ8gon:dC6mALoKoklAJAVa'); 	// dmBiz  credentials
	var c = new Buffer('JOGjx2HeVSXy:VsfPjI4vsBUUAXls');	// dmNews credentials
	
	// Image hosting server's FTP credentials
	var ftp_host = 'linjun12c.dmclub.net';
	var ftp_user = 'emma';
	var ftp_pass = 'ommatron';
	
	// Database CLI and credentials
	var db_cli  = '/Applications/MAMP/Library/bin/mysql';
	var db_user = 'root';
	var db_pass = 'root88';

 	// -----------------------------------------------------------------------------------------------------------------
 	// VARIABLE PREPARATION

	var n = c.toString();
	var b = c.toString('base64'); // Not currently used
	
	var now = new Date(); 
	var utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
	utc.setMinutes(utc.getMinutes() + 1);
	var blast_time = utc.toISOString().slice(0, -5) + 'Z';

	var this_email 	= grunt.file.readJSON('settings.json');

	// We should move this code into the concat task
	var header_template = grunt.file.read('xml/header.template.xml');
	header_template = header_template.replace('{{EMAIL-NAME}}', this_email.streamsend_name);
	grunt.file.write('xml/header.xml', header_template);
	
	var global_config = {
		streamsend_api_credentials	: n,
		streamsend_api_base_64		: b,
		db_cli   : db_cli,
		db_user  : db_user,
		db_pass  : db_pass,
		ftp_host : ftp_host,
		ftp_host : ftp_host,
		ftp_user : ftp_user,
		ftp_pass : ftp_pass,
		schedule : blast_time
	};
	var imps 	= {};
  	var session = {};

 	// -----------------------------------------------------------------------------------------------------------------
 	// UTILITY FUNCTIONS
 	
 	var get_http_status = function(response)
  	{
		var regex = /Status: (\d+)/;
		var arr = regex.exec(response);
		var status = arr[1];
		return status;
  	}
  	
  	var inspect = function(obj)
  	{
		var util = require('util');
		console.log(util.inspect(obj, {showHidden: false, depth: null}));
	}
  	
 	// -----------------------------------------------------------------------------------------------------------------
 	// TASK SETUP

  	grunt.initConfig({
		global_config: global_config,
		this_email: this_email,
		imps: imps,
		session: session,
		get_http_status: get_http_status,
		inspect: inspect,
		copy: {
			dist: {
				cwd: 'src/',
				expand: true,
				src: '**',
				dest: 'output/'
			}
		},
		// Remove unused CSS across multiple files, compressing the final output
		uncss: {
			dist: {
				files: [{
					src: 'src/*.html',
					dest: 'output/compiled.min.css'
				}]
			},
			options: {
				compress: true
			}
		},
		// Rewrite URLs in CSS files for production
		cssUrlRewrite: {
			dist: {
				src: 'output/compiled.min.css',
				dest: 'output/compiled.min.rewritten.css',
				options: {
					skipExternal: true,
					rewriteUrl: function(url, options, dataURI) {
						var path = url.replace('output/images', '');
						return 'http://email-assets.dmclub.net/output/images' + path;
					}
				}
			}		
		},
		// Rewrite Image src's for production
		processhtml: {
			dist: {
				files: {
					'output/index.html': ['src/index.html']
				}
			}
		},
		// Inline CSS styles & produce text only version
		premailer: {
			main: {
				options: {
					verbose: true
				},
				files: {
					'output/email-inline.html': ['output/index.html']
				}
			},
			text: {
				options: {
					verbose: true,
					mode: 'txt'
				},
				files: {
					'output/email-inline.txt': ['output/index.html']
				}
			}
		},
		// Build XML for Streamsend's REST API
		concat: {
			options: {
				separator: ''
			},
			dist: {
				src: ['xml/header.xml', 'output/email-inline.html', 'xml/middle.xml', 'output/email-inline.txt', 'xml/footer.xml'],
				dest: 'output/email-inline-4upload.xml',
			}
		},
		exec:
		{
			upload_to_streamsend:
			{
				cmd: 'curl -i -H "Content-Type: application/xml" -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/emails.xml" -d @output/email-inline-4upload.xml',
				callback: function (error, stdout, stderr)
				{
					var regex = /Location: http:\/\/app.streamsend.com\/emails\/(\d+)/;
					var arr = regex.exec(stdout);
					this_email.id = arr[1];
					grunt.log.write('Email ID is: ' + this_email.id);
					grunt.log.write();
					grunt.file.write('settings.json', JSON.stringify(this_email, null, 2)); // Save the email ID, so we can update it next time
				}
			},
			update_on_streamsend:
			{
				cmd: 'curl -i -H "Content-Type: application/xml" -X PUT -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/emails/' + this_email.id + '.xml" -d @output/email-inline-4upload.xml'
			},
			list_fields:
			{
				cmd: 'curl -i -H Accept: application/xml -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/audiences/2/fields.xml"',
				callback: function (error, stdout, stderr)
				{
					console.log();
					var response_code = get_http_status(stdout);
					if (response_code == '200')
					{
						// Get body XML
						var parseString = require('xml2js').parseString;
						arr = stdout.split(/\r?\n\r?\n/, 2);
						parseString(arr[1], function (err, result) {
							result.fields.field.forEach(function(f) {
								console.log(f.id[0] + ' - ' + f.name[0]);
							});
						});
					}
					else
					{
						console.log('An error occurred - fields not returned');					
					}
				}
			},
			create_broadcast_list:
			{
				cmd: function()
				{
					var listxml = grunt.file.read('xml/list.create..template.xml');
					listxml = listxml.replace('{{LIST-NAME}}', this_email.streamsend_name.'-Broadcast');					
					return 'curl -i -H "Content-Type: application/xml" -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/audiences/2/lists.xml" -d ' + listxml;
				},
				callback: function (error, stdout, stderr)
				{
					var regex = /Location: http:\/\/app.streamsend.com\/audiences\/2\/(\d+)/;
					var arr = regex.exec(stdout);
					this_email.list_id = arr[1];
					grunt.log.write('List ID is: ' + this_email.list_id);
					grunt.log.write();
					grunt.file.write('settings.json', JSON.stringify(this_email, null, 2)); // Save the list ID
				}
			},
			upload_custdata:
			{
				cmd: function(file_to_upload)
				{
					var regex = /custdata\/(\w+).txt/;
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
							var regex = /Location: http:\/\/app.streamsend.com\/audiences\/2\/blasts\/(\d+)/;
							var arr = regex.exec(stdout);
							var id = arr[1];
							this_email.blast_id = arr[1];
							grunt.log.write('Blast ID is: ' + this_email.blast_id);
							grunt.log.write();
							grunt.file.write('settings.json', JSON.stringify(this_email, null, 2)); // Save the blast ID
							break;
						default:
							console.log('ERROR - Blast could not be scheduled - HTTP Response Code: ' + response_code);
							break;
					}
				}
			},
			get_links:
			{
				cmd: 'curl -i -H Accept: application/xml -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/blasts/22097791/links.xml"',
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
					return 'curl -i -H Accept: application/xml -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/blasts/22097791/' +  what + '/count.xml"';
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
					return 'curl -i -H Accept: application/xml -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/blasts/22097791/clicks.xml?page=' + i + '"';
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
					return 'curl -i -H Accept: application/xml -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/blasts/22097791/views.xml?page=' + i + '"';
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
					session.db_name = 'dmnews_' + this_email.streamsend_name.replace(/-/g, '_');
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
					session.db_name = 'dmnews_' + this_email.streamsend_name.replace(/-/g, '_');
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
		// Upload images
		ftp_push: {
			your_target: {
				options: {
					host: global_config.ftp_host,
					dest: '/www/',
					port: 21,
					username: global_config.ftp_user,
					password: global_config.ftp_pass,
				},
				files: [
					{
						expand: true,
						cwd: '.',
						src: [
							'output/**'
						]
					}
				]
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
							replacement: this_email.from_name
						},
						{
							pattern: '{{FROM-EMAIL}}',
							replacement: this_email.from_email
						},
						{
							pattern: '{{SUBJECT}}',
							replacement: this_email.subject
						},
						{
							pattern: '{{ID}}',
							replacement: this_email.id
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
							replacement: this_email.from_name
						},
						{
							pattern: '{{FROM-EMAIL}}',
							replacement: this_email.from_email
						},
						{
							pattern: '{{SUBJECT}}',
							replacement: this_email.subject
						},
						{
							pattern: '{{ID}}',
							replacement: this_email.id
						},
						{
							pattern: '{{LIST-ID}}',
							replacement: this_email.list_id
						},
						{
							pattern: '{{BLAST-TIME}}',
							replacement: global_config.schedule
						}
					]
				}
			},
		},
  	});
	
	// -----------------------------------------------------------------------------------------------------------------
	
	// Print the header
	var task = grunt.cli.tasks[0];
	var title;
	var etask = '';
	switch(task)
	{
		case 'upload-email':
			title = 'PREPARE EMAIL AND UPLOAD TO STREAMSEND';
			if (this_email.id)
			{
				title += '\nUpdating email ' + this_email.id;
				var etask = 'exec:update_on_streamsend';
			}
			else
			{
				title += '\nInitial Upload';
				var etask = 'exec:upload_to_streamsend';
			}
			break;
		case 'list-fields':
			title = 'LIST MERGE FIELDS ( numerical ID - name )';
			break;
		case 'create-broadcast-list':
			title = 'CREATE BRAODCAST LIST';
			break;
		case 'upload-custdata':
			title = 'UPLOAD AND IMPORT CUSTOMER DATA';
			break;
		case 'check-import-status':
			title = 'CHECK IMPORT STATUS OF CUSTOMER DATA';
			break;
		case 'test':
			title = 'SEND EMAIL TO TEST LIST';
			break;
		case 'send':
			title = 'SEND EMAIL TO ENTIRE BROADCAST LIST';
			break;
		case 'report':
			title = 'GENERATE ENGAGEMENT REPORTS (VIEWS & CLICKS)';
			break;
		case 'get-links':
			title = 'GET LINKS IN EMAIL';
			break;
		case 'get-clicks':
			title = 'GET THE CLICKERS';
			break;
		case 'get-views':
			title = 'GET THE VIEWERS';
			break;
		default:
			title = 'LIST AVAILABLE TASKS';
			break;
	}

	console.log();
	console.log('--------------------------------------------------');
	console.log(title);
	console.log('--------------------------------------------------');
	console.log();
	
	// Load the plugins
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-uncss');
	grunt.loadNpmTasks('grunt-processhtml');
	grunt.loadNpmTasks('grunt-css-url-rewrite');
	grunt.loadNpmTasks('grunt-premailer');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-exec');
	grunt.loadNpmTasks('grunt-ftp-push');
	grunt.loadNpmTasks('grunt-string-replace');
	
	// Tasks
	grunt.registerTask('default', 'List available tasks', function() {
		console.log();
		console.log('The following tasks are available...');
		console.log();
		console.log('grunt upload-email');
		console.log('grunt list-fields');
		console.log('grunt create-broadcast-list');
		console.log('grunt upload-custdata');
		console.log('grunt check-import-status');
		console.log('grunt test');
		console.log('grunt send');
		console.log('grunt get-links');
		console.log('grunt get-clicks');
		console.log('grunt get-views');
		console.log();
	});
	grunt.registerTask('upload-email', ['copy', 'uncss', 'cssUrlRewrite', 'processhtml', 'premailer', 'concat', etask, 'ftp_push']);
	grunt.registerTask('create-broadcast-list', ['exec:create_broadcast_list']);
	grunt.registerTask('list-fields', ['exec:list_fields']);
	grunt.registerTask('upload-custdata', 'Uploading the Customer Data TSVs to Streamsend', function() {
		grunt.log.writeln('Uploading the Customer Data TSVs to Streamsend and Initiating Import');
		imps = {}; // Reset this for each import cycle
		var files = grunt.file.expand('custdata/report*.txt');
		console.dir(files);
		files.forEach(function(f) { 
			grunt.task.run('exec:upload_custdata:' + f);
		});
	});
	grunt.registerTask('check-import-status', 'Check Status of Streamsend TSV imports', function() {
		imps = grunt.file.readJSON('imps.json');
		console.log();
		for (i in imps) {
			if (imps[i].status.slice(0, 9) != 'completed')
			{
				grunt.task.run('exec:check_import_status:' + i);
			}
			else
			{
				console.log(i + '.txt : ' + imps[i].status);
			}
		}
	});
	grunt.registerTask('test', ['string-replace:test', 'exec:blast']);
	grunt.registerTask('send', ['string-replace:send', 'exec:blast']);
	grunt.registerTask('report', ['get-links', 'get-clicks', 'get-views', 'exec:compile_primary_dmids', 'exec:db_create', 'exec:db_import']);
	
	grunt.registerTask('get-links', ['exec:get_links']);
	grunt.registerTask('get-clicks', ['exec:count_clicks_or_views:clicks', 'get-c-or-v-looper']);
	grunt.registerTask('get-views',  ['exec:count_clicks_or_views:views',  'get-c-or-v-looper']);
	grunt.registerTask('get-c-or-v-looper', 'Loop through the pages of clicks/views, downloading each in turn', function() {
  		// This task is called by get-clicks or get-views to loop through the paginated XML, downloading each page in turn
  		var what = session.what; // 'clicks' or 'views'
  		var pages = Math.ceil(session[what] / 100);
		console.log('There are ' + pages + ' pages of ' + what + ' (max 100 per page)');
		if (what == 'clicks')
		{
			var links = grunt.file.readJSON('reports/links.json');
			var links2 = {};
			links.forEach(function(link) {
				link.link_ids.forEach(function(link_id) {
					links2[link_id] = link.url;
				});
			});
			session.links = links2;
			session.clicks = [];
		}
		else
		{
			session.views  = [];
		}
		session.people = [];
		for (var i = 1; i <= pages; i++)
		{
			grunt.task.run('exec:get_' + what + ':' + i);
		}
		grunt.task.run('get-' + what + '-report');
	});
	grunt.registerTask('get-clicks-report', 'Report of the result of compiling all the clicks', function() {
		var _ = require('underscore')._;

		var clicks  = session.clicks;
		var people  = session.people;

		var unclks  = []; // Unique clicks (emails by link)
		var unclks2 = [];
		for (link in clicks) unclks[link] = _.sortBy(_.uniq(_.pluck(clicks[link], 'email')), function(email) { return email; }); // Remove duplicates, and put emails in alphabetical order
		for (link in unclks) unclks2.push({url: link, emails: unclks[link]});

		var clicks2 = [];
		for (link in clicks) clicks2.push({url: link, clickers: clicks[link]});

		var people2 = [];
		for (email in people) people[email] = _.uniq(people[email]);
		for (email in people) people2.push({email: email, links: people[email]});

		grunt.file.write('reports/unclks.json', JSON.stringify(unclks2, null, 2)); // Unique clicks by link
		grunt.file.write('reports/clicks.json', JSON.stringify(clicks2, null, 2)); // All clicks, including duplicates
		grunt.file.write('reports/people.json', JSON.stringify(people2, null, 2)); // Links clicked by email
		
		console.log();
		console.log('Clicker\'s email by link');
		console.log('------------------------');
		console.log();
		for (link in unclks)
		{
			console.log();
			console.log('LINK: ' + link);
			unclks[link].forEach(function(email) { console.log('      ' + email); } );
		}
		console.log();
		console.log('Links clicked by email');
		console.log('----------------------');
		console.log();
		for (email in people)
		{
			console.log();
			console.log('EMAIL: ' + email);
			people[email].forEach(function(link) { console.log('      ' + link); } );
		}
	});
	grunt.registerTask('get-views-report', 'Report of the result of compiling all the views', function() {
		// var _ = require('underscore')._;
		var views   = session.views;
		grunt.file.write('reports/views.json',  JSON.stringify(views, null, 2));
		console.log();
		console.log('Viewers');
		console.log('-------');
		console.log();
		views.forEach(function(view)
		{
			console.log(view.time + ' - ' + view.email);
		});
		console.log();
	});
};