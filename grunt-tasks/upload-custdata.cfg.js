module.exports = function(grunt, config)
{
	var global_config 	= config.global_config;
	var settings 		= config.settings;
	var session 		= config.session;
	return {
		exec:
		{
			upload_custdata:
			{
				cmd: function(file_to_upload)
				{
					var regex = /custdata\/(\w+).tsv/;
					var arr = regex.exec(file_to_upload);
					session.current_file = arr[1];
					console.log(session.current_file);
					return 'curl -i -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/uploads.xml" -F data=@' + file_to_upload;
				},
				callback: function (error, stdout, stderr)
				{
					var regex = /Location: http:\/\/app.streamsend.com\/uploads\/(\d+)/;
					var arr = regex.exec(stdout);
					var id = arr[1];
					console.log('Upload ID is ' + id);
					imps[session.current_file] = {upload_id: id};
					grunt.file.write('imps.json', JSON.stringify(imps, null, 2)); // Save the TSV IDs so we can import them later
					grunt.task.run('exec:import_custdata:' + session.current_file);
				}
			},
			import_custdata:
			{
				cmd: function(i)
				{
					session.current_file = i;
					var impxml = grunt.file.read('xml/import.template.xml');
					impxml = impxml.replace('{{LIST-ID}}', settings.list_id);
					impxml = impxml.replace('{{UPLOAD-ID}}', imps[i].upload_id);
					return 'curl -i -H "Content-Type: application/xml" -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/audiences/2/imports.xml" -d "' + impxml + '"';
				},
				callback: function (error, stdout, stderr)
				{
					var regex = /Location: http:\/\/app.streamsend.com\/audiences\/2\/imports\/(\d+)/;
					var arr = regex.exec(stdout);
					var id = arr[1];
					console.log('Importing upload ' + session.current_file + ' - Import ID is ' + id);
					imps[session.current_file].import_id = id;
					imps[session.current_file].status = 'waiting';
					grunt.file.write('imps.json', JSON.stringify(imps, null, 2)); // Save the Import state
				}
			}
		}
	}
}
