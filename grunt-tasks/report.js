module.exports = function(grunt)
{
	var global_config 	= grunt.config.data.global_config;
	var settings 		= grunt.config.data.settings;
	var variants 		= settings.variants;
	var temp 			= grunt.config.data.temp;

	// ---------------------
	// Overall 'report' task
	
	// grunt.registerTask('report', ['get-links', 'get-clicks', 'get-views', 'exec:compile_primary_dmids', 'exec:db_create', 'exec:db_import']);
	grunt.registerTask('report', ['get-links']);
	
	// -------------------
	// Reporting sub-tasks

	grunt.registerTask('get-links', function()
	{
		variants.map(function(variant, i)
		{
			grunt.task.run('exec:get_links:' + i);
		});
	});
	
	grunt.registerTask('get-clicks', ['exec:count_clicks_or_views:clicks', 'get-c-or-v-looper']);
	
	grunt.registerTask('get-views',  ['exec:count_clicks_or_views:views',  'get-c-or-v-looper']);

	grunt.registerTask('get-c-or-v-looper', 'Loop through the pages of clicks/views, downloading each in turn', function() {
		// This task is called by get-clicks or get-views to loop through the paginated XML, downloading each page in turn
		var what = temp.what; // 'clicks' or 'views'
		var pages = Math.ceil(temp[what] / 100);
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
			temp.links = links2;
			temp.clicks = [];
		}
		else
		{
			temp.views  = [];
		}
		temp.people = [];
		for (var i = 1; i <= pages; i++)
		{
			grunt.task.run('exec:get_' + what + ':' + i);
		}
		grunt.task.run('get-' + what + '-report');
	});
	
	grunt.registerTask('get-clicks-report', 'Report of the result of compiling all the clicks', function() {
		var _ = require('underscore')._;

		var clicks  = temp.clicks;
		var people  = temp.people;

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
		var views = temp.views;
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
