module.exports = function(grunt) {
	grunt.registerTask('check-import-status', 'Check Status of Streamsend TSV imports', function() {
		imps = grunt.file.readJSON('imps.json');
		console.log();
		for (i in imps) {
			if (imps[i].status.slice(0, 9) != 'completed')
			{
				grunt.task.run('exec:check_import_status:' + i);
			}
			else
			{
				console.log(i + '.txt : ' + imps[i].status);
			}
		}
	});
}; 
