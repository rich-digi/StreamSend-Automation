module.exports = function(grunt, config)
{
	var global_config 	= config.global_config;
	var settings 		= config.settings;
	var get_http_status = config.get_http_status;
	return {
		'string-replace': {
			// Dynamically constructed at runtime
		},
		exec:
		{
			blast:
			{
				cmd: function(i)
				{
					var pre = settings.variants[i].variant;
					var c = 'echo INDEX=' + i + '\n';
					c += 'curl -i -H "Content-Type: application/xml" -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/audiences/2/blasts.xml" -d @output/blast-' + pre + '.send.xml';
					return c;
				},
				callback: function (error, stdout, stderr)
				{
					var regex = /INDEX=(\d+)/;
					var arr = regex.exec(stdout);
					var i = arr[1];

					var response_code = get_http_status(stdout);
					switch(response_code)
					{
						case '201':
							// Get the Blast ID
							var regex = /Location: http:\/\/app.streamsend.com\/blasts\/(\d+)/;
							var arr = regex.exec(stdout);
							var blast_id = arr[1];
							settings.variants[i].blast_id = blast_id;
							grunt.log.write('Blast ID for variant ' + settings.variants[i].variant + ' is: ' + blast_id);
							grunt.log.write();
							grunt.file.write('settings.json', JSON.stringify(settings, null, 2)); // Save the blast ID
							break;
						default:
							console.log('ERROR - Blast could not be scheduled - HTTP Response Code: ' + response_code);
							break;
					}
				}
			}
		}
	}
}
