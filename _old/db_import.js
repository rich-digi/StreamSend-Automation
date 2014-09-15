// ---------------------------------------------------------------------------------------------------------------------
// Load the details of the people who clicked into the 'dmnews_reports' database
// ---------------------------------------------------------------------------------------------------------------------


var args = process.argv.slice(2);

// Database credentials
var dbcred = {};
dbcred.host = 'localhost';
dbcred.user = args[0];
dbcred.pass = args[1];
dbcred.daba = args[2];

var fs 		= require('fs');
var mysql 	= require('mysql');
var async 	= require('async');

// ---------------------------------------------------------------------------------------------------------------------

var step = {};

step._1_add_emails = function(db)
{
	fs.readFile(__dirname + '/reports/views.json', 'utf8', function (err, data) {
		if (err) {
			console.log('Error: ' + err);
			db.end();
			return;
		}
		views = JSON.parse(data);
		
		var _ = require('underscore')._;
		emails = _.uniq(_.pluck(views, 'email'));
		
		var sql;
		async.forEach(emails, function(email, callback) {
			em = db.escape(email);
			sql = 'INSERT IGNORE INTO Emails (Email) VALUES (' + em + ')';
			console.log('e', email);
			db.query(sql, function(err, res) {
				callback();
			});
		},
		function() {
			console.log('DONE Emails');
			step._2_add_views(db);
		});
	});
}

// ---------------------------------------------------------------------------------------------------------------------

step._2_add_views = function(db)
{
	fs.readFile(__dirname + '/reports/views.json', 'utf8', function (err, data) {
		if (err) {
			console.log('Error: ' + err);
			db.end();
			return;
		}
		views = JSON.parse(data);

		var sql;
		async.forEach(views, function(viewer, callback) {
			em = db.escape(viewer.email);
			ti = db.escape(viewer.time);
			ip = db.escape(viewer.ip_address);
			ua = db.escape(viewer.user_agent);
			sql = 'INSERT INTO Viewers (Email, Time, IPAddress, UserAgent) VALUES (' + em + ', STR_TO_DATE(' + ti + ', "%Y-%m-%dT%H:%i:%sZ"), ' + ip + ', ' + ua + ')';
			console.log('v', viewer.email);
			db.query(sql, function(err, res) {
				callback();
			});
		},
		function() {
			console.log('DONE Viewers');
			step._3_add_clicks(db);
		});
	});
}

// ---------------------------------------------------------------------------------------------------------------------

step._3_add_clicks = function(db)
{
	fs.readFile(__dirname + '/reports/clicks.json', 'utf8', function (err, data) {
		if (err) {
			console.log('Error: ' + err);
			db.end();
			return;
		}
		clicks = JSON.parse(data);
	
		var sql;
		async.forEach(clicks, function(link, callback) {
			sql = 'INSERT IGNORE INTO Links (URL) VALUES ("' + link.url + '")';
			db.query(sql, function(err, res) {
				sql = 'SELECT LinkID FROM Links WHERE URL = "' + link.url + '"';
				db.query(sql, function(err, results) {
					var LinkID = results[0].LinkID;
					console.log('LinkID', LinkID);
					var em, ti, ip, ua;
					link.clickers.forEach(function(clicker) {
						em = db.escape(clicker.email);
						ti = db.escape(clicker.time);
						ip = db.escape(clicker.ip_address);
						ua = db.escape(clicker.user_agent);
						sql = 'INSERT INTO Clickers (LinkID, Email, Time, IPAddress, UserAgent) VALUES (' + LinkID + ', ' + em + ', STR_TO_DATE(' + ti + ', "%Y-%m-%dT%H:%i:%sZ"), ' + ip + ', ' + ua + ')';
						console.log('c', clicker.email);
						db.query(sql);
					});
					callback();
				});
			});
		},
		function() {
			console.log('DONE Links & Clickers');
			step._4_import_primary_dmids(db);
		});
	});
}

// ---------------------------------------------------------------------------------------------------------------------

step._4_import_primary_dmids = function(db)
{
	var sql;
	var tsv = __dirname + '/reports/primary_dmid_link.tsv';
	sql = "LOAD DATA LOCAL INFILE '" + tsv + "' INTO TABLE PDMIDLink " +
				"FIELDS TERMINATED BY '\\t' OPTIONALLY ENCLOSED BY '\"' ESCAPED BY '\\\\' " +
				"LINES TERMINATED BY '\\r' IGNORE 1 LINES (Email, PrimaryDMID)";
	console.log('Importing', tsv);
	db.query(sql, function(err, res) {
		console.log('DONE Import Primary DMIDS');
		step._5_reconcile_EmailIDs(db);
	});
}

// ---------------------------------------------------------------------------------------------------------------------

step._5_reconcile_EmailIDs = function(db)
{
	var sql = 'UPDATE Clickers JOIN Emails ON Clickers.Email = Emails.Email SET Clickers.EmailID = Emails.EmailID';
	db.query(sql);
	var sql = 'UPDATE Viewers JOIN Emails ON Viewers.Email = Emails.Email SET Viewers.EmailID = Emails.EmailID';
	db.query(sql);
	console.log('DONE Reconcile Email IDs');
	db.end();
}

// ---------------------------------------------------------------------------------------------------------------------

function execute()
{
	var db = mysql.createConnection({
		user     : dbcred.user,
		password : dbcred.pass,
		database : dbcred.daba, 
		socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock'
	});
	db.connect(function(err) { if (err != null) console.log('Error connecting to mysql:' + err+'\n'); });

	// step._1_add_emails(db);
	step._4_import_primary_dmids(db);
}

// ---------------------------------------------------------------------------------------------------------------------

execute();