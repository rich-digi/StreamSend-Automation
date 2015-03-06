module.exports = function(grunt) {
	grunt.registerTask('send', ['string-replace:send', 'exec:blast']);
}; 
