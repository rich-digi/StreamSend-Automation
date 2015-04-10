module.exports = function(grunt, config)
{
	var global_config 	= config.global_config;
	var get_http_status = config.get_http_status;
	return {
		exec:
		{
			list_fields:
			{
				cmd: 'curl -i -H Accept: application/xml -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/audiences/2/fields.xml"',
				callback: function (error, stdout, stderr)
				{
					console.log();
					var response_code = get_http_status(stdout);
					if (response_code == '200')
					{
						// Get body XML
						var parseString = require('xml2js').parseString;
						arr = stdout.split(/\r?\n\r?\n/, 2);
						parseString(arr[1], function (err, result) {
							result.fields.field.forEach(function(f) {
								console.log(f.id[0]._ + ' - ' + f.name[0]);
							});
						});
					}
					else
					{
						console.log('An error occurred - fields not returned');					
					}
				}
			}
		}
	}
}
