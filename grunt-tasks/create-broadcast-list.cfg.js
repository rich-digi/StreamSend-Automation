module.exports = function(grunt, config)
{
	var global_config 	= config.global_config;
	var settings 		= config.settings;
	return {
		exec:
		{
			create_broadcast_list:
			{
				cmd: function(list_name, i)
				{
					var listxml = grunt.file.read('xml/list.create.template.xml');
					listxml = listxml.replace('{{LIST-NAME}}', list_name);
								
					return 'echo INDEX=' + i + '\n' + 'curl -i -H "Content-Type: application/xml" -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/audiences/2/lists.xml" -d "' + listxml + '"';
				},
				callback: function (error, stdout, stderr)
				{
					var regex = /INDEX=(\d+)/;
					var arr = regex.exec(stdout);
					var i = arr[1];
					var regex = /Location: http:\/\/app.streamsend.com\/audiences\/2\/lists\/(\d+)/;
					var arr = regex.exec(stdout);
					var list_id = arr[1];
					settings.variants[i].list_id = list_id;
					grunt.log.write('List ID is: ' + list_id);
					grunt.log.write();
					grunt.file.write('settings.json', JSON.stringify(settings, null, 2)); // Save the list ID
				}
			}
		}
	}
}
