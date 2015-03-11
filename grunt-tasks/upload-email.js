module.exports = function(grunt) {
	grunt.registerTask('upload-email', ['copy', 'uncss', 'cssUrlRewrite', 'processhtml', 'premailer', 'concat', etask, 'ftp_push']);
};



/*
if (settings.id)
{
	title += '\nUpdating email ' + settings.id;
	var etask = 'exec:update_on_streamsend';
}
else
{
	title += '\nInitial Upload';
	var etask = 'exec:upload_to_streamsend';
}
*/