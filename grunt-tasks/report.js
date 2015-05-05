module.exports = function(grunt)
{
	var global_config 	= grunt.config.data.global_config;
	var settings 		= grunt.config.data.settings;
	var variants 		= settings.variants;
	var temp 			= grunt.config.data.temp;

	// ---------------------
	// Overall 'report' task
	
	grunt.registerTask('report', [	'get-links',
									'get-clicks',
									'get-views',
									'exec:compile_primary_dmids',
									'create-report-databases',
									'import-db-data']
						);
	
	// -------------------
	// Reporting sub-tasks

	grunt.registerTask('get-links', function()
	{
		variants.map(function(variant, i)
		{
			grunt.task.run('exec:get_links:' + i);
		});
	});
	
	grunt.registerTask('get-clicks', function()
	{
		variants.map(function(variant, i)
		{
			grunt.task.run('exec:count_clicks_or_views:' + i +':clicks');
			grunt.task.run('get-c-or-v-looper:' + i +':clicks');
		});
	});

	grunt.registerTask('get-views', function()
	{
		variants.map(function(variant, i)
		{
			grunt.task.run('exec:count_clicks_or_views:' + i +':views');
			grunt.task.run('get-c-or-v-looper:' + i +':views');
		});
	});

	grunt.registerTask('get-c-or-v-looper', 'Loop through the pages of clicks/views, downloading each in turn', function(variant_index, what)
	{
		// This task is called by get-clicks or get-views to loop through the paginated XML, downloading each page in turn
		var pages = Math.ceil(temp[what] / 100);
		console.log('There are ' + pages + ' pages of ' + what + ' (max 100 per page)');
		var variant = settings.variants[variant_index].variant;
		if (what == 'clicks')
		{
			var links = grunt.file.readJSON('reports/' + variant + '-links.json');
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
			grunt.task.run('exec:get_' + what + ':' + variant_index + ':' + i);
		}
		grunt.task.run('get-' + what + '-report' +':' + variant);
	});
	
	grunt.registerTask('get-clicks-report', 'Report of the result of compiling all the clicks', function(variant) {
		var _ = require('underscore')._;

		var clicks  = temp.clicks;
		var people  = temp.people;

		var unclks  = []; // Unique clicks (emails by link)
		var unclks2 = [];
		
		// Remove duplicates, and put emails in alphabetical order
		for (link in clicks) unclks[link] = _.sortBy(_.uniq(_.pluck(clicks[link], 'email')), function(email) { return email; });
		for (link in unclks) unclks2.push({url: link, emails: unclks[link]});

		var clicks2 = [];
		for (link in clicks) clicks2.push({url: link, clickers: clicks[link]});

		var people2 = [];
		for (email in people) people[email] = _.uniq(people[email]);
		for (email in people) people2.push({email: email, links: people[email]});

		grunt.file.write('reports/' + variant + '-unclks.json', JSON.stringify(unclks2, null, 2)); // Unique clicks by link
		grunt.file.write('reports/' + variant + '-clicks.json', JSON.stringify(clicks2, null, 2)); // All clicks, including duplicates
		grunt.file.write('reports/' + variant + '-people.json', JSON.stringify(people2, null, 2)); // Links clicked by email
	
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
	
	grunt.registerTask('get-views-report', 'Report of the result of compiling all the views', function(variant) {
		// var _ = require('underscore')._;
		var views = temp.views;
		grunt.file.write('reports/' + variant + '-views.json',  JSON.stringify(views, null, 2));
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

	grunt.registerTask('create-report-databases', function()
	{
		variants.map(function(variant, i)
		{
			grunt.task.run('exec:db_create:' + i);
		});
	});

	grunt.registerTask('import-db-data', function()
	{
		variants.map(function(variant, i)
		{
			grunt.task.run('exec:db_import:' + i);
		});
	});

}; 
