module.exports = function(grunt)
{
	var settings = grunt.config.data.settings;
	var root_name = settings.streamsend_root_name;
	var variants = settings.variants;
	
	concat_partial = function(variants)
	{
		// Partial application
		return function()
		{
			var header_template = grunt.file.read('xml/header.template.xml');
			variants.map(function(variant, i)
			{
				var pre = variant.variant;
				var email_name = root_name '-' + pre;
				var header = header_template.replace('{{EMAIL-NAME}}', email_name);
				grunt.file.write('xml/header-' + pre + '.xml', header);
				var cc = function()
				{
					// Partila again
					grunt.config.data.pre = pre;
					grunt.task.run('concat');
				}
				
			});
		}
	}
	var concat = concat_partial(variants);

	upload_partial = function(variants)
	{
		// Partial application
		return function()
		{
			variants.map(function(variant, i)
			{
				subtitle = variant.id ? 'Updating email ' + variant.id : 'Initial Upload';
				console.log();
				console.log(subtitle);
				if (variant.id)
				{
					grunt.task.run('exec:update_on_streamsend:' + variant.variant);
					var etask = 'exec:update_on_streamsend';
				}
				else
				{
					grunt.task.run('exec:upload_to_streamsend:' + variant.variant + ':' + i);
				}
			});
		}
	}
	var upload = upload_partial(variants);
	
	grunt.registerTask('upload-email', function()
	{
		grunt.task.run('copy');
		grunt.task.run('uncss');
		grunt.task.run('cssUrlRewrite');
		grunt.task.run('processhtml');
		grunt.task.run('premailer');
		concat();
		//grunt.task.run('ftp_push');
		//upload();
	});
};
