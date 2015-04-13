module.exports = function(grunt, config)
{
	var global_config 	= config.global_config;
	var settings 		= config.settings;
	return {
		exec:
		{
			upload_custdata:
			{
				cmd: function(file_to_upload, list_id)
				{
					var regex = /custdata-split\/([\w\.-]+).tsv/;
					var arr = regex.exec(file_to_upload);

					var c = 'echo FILENAME=' + arr[1] + '\n';
					c += 'echo LIST-ID=' + list_id + '\n';
					c += 'curl -i -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/uploads.xml" -F data=@' + file_to_upload;
					return c;
				},
				callback: function (error, stdout, stderr)
				{
					var regex = /FILENAME=([\w\.-]+)/;
					var arr = regex.exec(stdout);
					var filename = arr[1];
					
					var regex = /LIST-ID=(\d+)/;
					var arr = regex.exec(stdout);
					var list_id = arr[1];
					
					var regex = /Location: http:\/\/app.streamsend.com\/uploads\/(\d+)/;
					var arr = regex.exec(stdout);
					var upload_id = arr[1];
					
					console.log('Upload ID is ' + upload_id);
					imps[filename] = {upload_id: upload_id, list_id: list_id};
					grunt.file.write('imps.json', JSON.stringify(imps, null, 2)); // Save the TSV IDs so we can import them later
					grunt.task.run('exec:import_custdata:' + filename);
				}
			},
			import_custdata:
			{
				cmd: function(filename)
				{
					var impxml = grunt.file.read('xml/import.template.xml');
					impxml = impxml.replace('{{LIST-ID}}', imps[filename].list_id);
					impxml = impxml.replace('{{UPLOAD-ID}}', imps[filename].upload_id);
					
					var c = 'echo FILENAME=' + filename + '\n';
					c += 'curl -i -H "Content-Type: application/xml" -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/audiences/2/imports.xml" -d "' + impxml + '"';
					return c;
				},
				callback: function (error, stdout, stderr)
				{
					var regex = /FILENAME=([\w\.-]+)/;
					var arr = regex.exec(stdout);
					var filename = arr[1];
					
					var regex = /Location: http:\/\/app.streamsend.com\/audiences\/2\/imports\/(\d+)/;
					var arr = regex.exec(stdout);
					var import_id = arr[1];
					
					console.log('Importing upload ' + filename + ' - Import ID is ' + import_id);
					
					imps[filename].import_id = import_id;
					imps[filename].status = 'waiting';
					
					grunt.file.write('imps.json', JSON.stringify(imps, null, 2)); // Save the Import state
				}
			}
		}
	}
}
