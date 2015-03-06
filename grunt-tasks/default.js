module.exports = function(grunt) {
	grunt.registerTask('default', 'List available tasks', function() {
		console.log();
		console.log('The following primary tasks are available...');
		console.log();
		console.log('grunt upload-email');
		console.log('grunt list-fields');
		console.log('grunt create-broadcast-list');
		console.log('grunt upload-custdata');
		console.log('grunt check-import-status');
		console.log('grunt test');
		console.log('grunt send');
		console.log('grunt report');
		console.log();
	});
}; 
