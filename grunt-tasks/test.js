module.exports = function(grunt)
{
	var global_config 	= grunt.config.data.global_config;
	var settings 		= grunt.config.data.settings;
	var variants 		= settings.variants;

	var generate_substitution_instruction = function(variant)
	{
		var pre = variant.variant;
		var opx = 'output/blast-' + pre + '.test.xml';
		var obj = { files: {} };
		obj.files[opx] = 'xml/blast.test.rich.template.xml'; // Send tests to 'rich@apewave.com'only
		// obj.files[opx] = 'xml/blast.test.template.xml';	 // Send tests to test list
		obj.options = {
							replacements: [
								{
									pattern: '{{FROM-NAME}}',
									replacement: variant.from_name
								},
								{
									pattern: '{{FROM-EMAIL}}',
									replacement: variant.from_email
								},
								{
									pattern: '{{SUBJECT}}',
									replacement: variant.subject
								},
								{
									pattern: '{{ID}}',
									replacement: variant.id
								},
								{
									pattern: '{{BLAST-TIME}}',
									replacement: global_config.schedule
								}
							]
						};
		return obj;
	}

	grunt.registerTask('test', function()
	{
		variants.map(function(variant)
		{
			var pre = variant.variant;
			grunt.config.data['string-replace'][pre] = generate_substitution_instruction(variant);
		});
		grunt.task.run('string-replace');
		
		variants.map(function(variant, i)
		{
			var pre = variant.variant;
			grunt.task.run('exec:blast:' + i);
		});
	});
}; 
