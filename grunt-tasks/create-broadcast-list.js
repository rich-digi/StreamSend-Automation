module.exports = function(grunt)
{
	var settings = grunt.config.data.settings;
	var root_name = settings.streamsend_root_name;
	var variants = settings.variants;

	grunt.registerTask('create-broadcast-list', function()
	{
		variants.map(function(variant, i)
		{
			var pre = variant.variant;
			var list_name = root_name + '-' + pre + '-Broadcast';
			grunt.task.run('exec:create_broadcast_list' + ':' + list_name + ':' + i)
		});
	});
}; 
