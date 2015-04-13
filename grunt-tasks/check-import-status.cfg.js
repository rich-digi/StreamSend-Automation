module.exports = function(grunt, config)
{
	var global_config 	= config.global_config;
	var get_http_status = config.get_http_status;
	return {
		exec:
		{
			check_import_status:
			{
				cmd: function(filename)
				{
					var import_id = imps[filename].import_id;
					var c = 'echo FILENAME=' + filename + '\n';
					c += 'curl -i -H Accept: application/xml -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/audiences/2/imports/' + import_id + '.xml"';
					return c;
				},
				callback: function (error, stdout, stderr)
				{
					var regex = /FILENAME=([\w\.-]+)/;
					var arr = regex.exec(stdout);
					var filename = arr[1];
					
					var response_code = get_http_status(stdout);
					switch(response_code)
					{
						case '200':
						case '202':
							// Get body XML
							var parseString = require('xml2js').parseString;
							arr = stdout.split(/\r?\n\r?\n/, 2);
							parseString(arr[1], function (err, result) {
								var status = result.import.status[0];
								switch(status)
								{
									case 'waiting':
										var msg = status;
										break;
									case 'in progress':
										var pcc = result.import['percent-complete'][0]._
										var msg = status + ' - ' + pcc + '% complete';
										break;
									case 'completed':
										var attempted 	= result.import['attempted-rows'][0]._;
										var invalid 	= result.import['invalid-rows'][0]._
										var msg = status + ' - attempted ' + attempted + ' rows / ' + invalid + ' invalid';
										break;
								}
								console.log(msg);
								imps[filename].status = msg;
							});					
							break;
						case '404':
							imps[filename].status = 'file to import not fount';
							break;
						default:
							imps[filename].status = 'unexpected response - check manually';
							break;
					}
					grunt.file.write('imps.json', JSON.stringify(imps, null, 2)); // Save the Import state
				}
			}
		}
	}
}
