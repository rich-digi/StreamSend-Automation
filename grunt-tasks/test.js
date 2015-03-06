module.exports = function(grunt) {
	grunt.registerTask('test', ['string-replace:test', 'exec:blast']);
}; 

