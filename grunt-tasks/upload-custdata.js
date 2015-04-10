module.exports = function(grunt)
{
	var variants = grunt.config.data.settings.variants;

	grunt.registerTask('upload-custdata', 'Uploading the Customer Data TSVs to Streamsend', function()
	{
		grunt.log.writeln('Uploading the Customer Data TSVs to Streamsend and Initiating Import');
		imps = {}; // Reset this for each import cycle
		
		
		if (settings.variants.length > 1)
		{
			var files = grunt.file.expand('custdata/'+ settings.split +'-split-*.tsv');
		}
		else
		{
			var files = grunt.file.expand('custdata/processed*.tsv');
		}
		console.dir(files);
		files.forEach(function(f) { 
			grunt.task.run('exec:upload_custdata:' + f);
		});
	});
};

