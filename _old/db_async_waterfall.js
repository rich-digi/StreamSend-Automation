// ---------------------------------------------------------------------------------------------------------------------
// Load the details of the people who clicked into the 'dmnews_reports' database
// ---------------------------------------------------------------------------------------------------------------------

// Database credentials
var db_host = 'localhost';
var db_daba = 'dmnews_reports';
var db_user = 'root';
var db_pass = 'root88';

var fs 		= require('fs');
var mysql 	= require('mysql');
var async 	= require('async');

// ---------------------------------------------------------------------------------------------------------------------

var step = {};

step._1_add_emails = function(db)
{
	fs.readFile(__dirname + '/views.json', 'utf8', function (err, data) {
		if (err) {
			console.log('Error: ' + err);
			return;
		}
		views = JSON.parse(data);

		var sql;
		async.forEach(views, function(viewer, localcallback) {
			em = db.escape(viewer.email);
			sql = 'INSERT IGNORE INTO Emails (Email) VALUES (' + em + ')';
			console.log('e', viewer.email);
			db.query(sql, function(err, res) {
				localcallback();
			});
		},
		function() {
			console.log('DONE Emails');
			callback();
			//step.add_views(db);
		});
	});
}

// ---------------------------------------------------------------------------------------------------------------------

step._2_add_views = function(db)
{
	fs.readFile(__dirname + '/views.json', 'utf8', function (err, data) {
		if (err) {
			console.log('Error: ' + err);
			return;
		}
		views = JSON.parse(data);

		var sql;
		async.forEach(views, function(viewer, localcallback) {
			em = db.escape(viewer.email);
			ti = db.escape(viewer.time);
			ip = db.escape(viewer.ip_address);
			ua = db.escape(viewer.user_agent);
			sql = 'INSERT INTO Viewers (Email, Time, IPAddress, UserAgent) VALUES (' + em + ', STR_TO_DATE(' + ti + ', "%Y-%m-%dT%H:%i:%sZ"), ' + ip + ', ' + ua + ')';
			console.log('v', viewer.email);
			db.query(sql, function(err, res) {
				localcallback();
			});
		},
		function() {
			console.log('DONE Viewers');
			//step.add_clicks(db);
			callback();
		});
	});
}

// ---------------------------------------------------------------------------------------------------------------------

step._3_add_clicks = function(db)
{
	fs.readFile(__dirname + '/clicks.json', 'utf8', function (err, data) {
		if (err) {
			console.log('Error: ' + err);
			return;
		}
		clicks = JSON.parse(data);
	
		var sql;
		async.forEach(clicks, function(link, localcallback) {
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
					localcallback();
				});
			});
		},
		function() {
			console.log('DONE Links & Clickers');
			callback();
		});
	});
}

// ---------------------------------------------------------------------------------------------------------------------

step._4_reconcile_EmailIDs = function(db)
{
	var sql = 'UPDATE Clickers JOIN Emails ON Clickers.Email = Emails.Email SET Clickers.EmailID = Emails.EmailID';
	db.query(sql);
	var sql = 'UPDATE Viewers JOIN Emails ON Viewers.Email = Emails.Email SET Viewers.EmailID = Emails.EmailID';
	db.query(sql);
	// callback();
}

// ---------------------------------------------------------------------------------------------------------------------

var db = mysql.createConnection({
	user     : db_user,
	password : db_pass,
	database : db_daba, 
	socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock'
});
db.connect(function(err) { if (err != null) console.log('Error connecting to mysql:' + err+'\n'); });

function execute()
{
	async.waterfall(
		[
			step._1_add_emails(db),
			step._2_add_views(db),
			step._3_add_clicks(db),
			step._4_reconcile_EmailIDs(db)
		],
		function (err) {
			console.log('DONE Waterfall');
			db.end();
		}
	);
}

// ---------------------------------------------------------------------------------------------------------------------

execute();