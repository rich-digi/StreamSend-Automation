module.exports = function(grunt)
{
	var variants = grunt.config.data.settings.variants;

	grunt.registerTask('upload-custdata', 'Uploading the Customer Data TSVs to Streamsend', function()
	{
		grunt.log.writeln('Uploading the Customer Data TSVs to Streamsend and Initiating Import');
		imps = {}; // Reset this for each import cycle
		variants.map(function(variant)
		{
			var pre = variant.variant;
			var files = grunt.file.expand('custdata-split/' + pre + '-split-*.tsv');
			console.dir(files);
			// Upload each file f and initiate import to correct list
			files.forEach(function(f) { grunt.task.run('exec:upload_custdata:' + f + ':' + variant.list_id); });
		});
	});
};

