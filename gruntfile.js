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

	var settings = grunt.file.readJSON('settings.json');

 	// -----------------------------------------------------------------------------------------------------------------
 	// VARIABLE PREPARATION

	var n = c.toString();
	var b = c.toString('base64'); // Not currently used
	
	var now = new Date(); 
	var utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
	utc.setMinutes(utc.getMinutes() + 1);
	var blast_time = utc.toISOString().slice(0, -5) + 'Z';

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
 	
	var load_config = function(file)
	{
		object = require(file)(grunt, config);
		return object;
	}
	
	var load_config_by_glob = function(path)
	{
		var glob = require('glob');
		var object = {};
		var key;
		glob.sync('*', {cwd: path}).forEach(function(option)
		{
			key = option.replace(/\.js$/, '');
			object[key] = require(path + option);
		});
		return object;
	} 

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

  	var config = {
		global_config: global_config,
		settings: settings,
		imps: imps,
		get_http_status: get_http_status,
		inspect: inspect
  	};

	// -----------------------------------------------------------------------------------------------------------------
	
	// Print the header
	var task = grunt.cli.tasks[0];
	var title;
	switch(task)
	{
		case 'upload-email':
			title = 'PREPARE EMAIL AND UPLOAD TO STREAMSEND';
			break;
		case 'list-fields':
			title = 'LIST MERGE FIELDS ( numerical ID - name )';
			break;
		case 'create-broadcast-list':
			title = 'CREATE BROADCAST LIST';
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
			task = 'default';
			title = 'LIST AVAILABLE TASKS';
			break;
	}

	// Load additional config
	//grunt.util._.extend(config, load_config_by_glob('./grunt-tasks/'));
	grunt.util._.extend(config, load_config('./grunt-tasks/'+task+'.cfg.js'));
	grunt.initConfig(config);

	// Load the plugins and tasks, JIT-style
	require('jit-grunt')(grunt)({ customTasksDir: './grunt-tasks' });
};