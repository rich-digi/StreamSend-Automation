module.exports = function(grunt) {
	grunt.registerTask('upload-email', ['copy', 'uncss', 'cssUrlRewrite', 'processhtml', 'premailer', 'concat', etask, 'ftp_push']);
};



