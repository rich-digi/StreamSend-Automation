module.exports = {
	copy: {
		dist: {
			cwd: 'src/',
			expand: true,
			src: '**',
			dest: 'output/'
		}
	},
	// Remove unused CSS across multiple files, compressing the final output
	uncss: {
		dist: {
			files: [{
				src: 'src/*.html',
				dest: 'output/compiled.min.css'
			}]
		},
		options: {
			compress: true
		}
	},
	// Rewrite URLs in CSS files for production
	cssUrlRewrite: {
		dist: {
			src: 'output/compiled.min.css',
			dest: 'output/compiled.min.rewritten.css',
			options: {
				skipExternal: true,
				rewriteUrl: function(url, options, dataURI) {
					var path = url.replace('output/images', '');
					return 'http://email-assets.dmclub.net/output/images' + path;
				}
			}
		}		
	},
	// Rewrite Image src's for production
	processhtml: {
		dist: {
			files: {
				'output/index.html': ['src/index.html']
			}
		}
	},
	// Inline CSS styles & produce text only version
	premailer: {
		main: {
			options: {
				verbose: true
			},
			files: {
				'output/email-inline.html': ['output/index.html']
			}
		},
		text: {
			options: {
				verbose: true,
				mode: 'txt'
			},
			files: {
				'output/email-inline.txt': ['output/index.html']
			}
		}
	},
	// Build XML for Streamsend's REST API
	concat: {
		options: {
			separator: ''
		},
		dist: {
			src: ['xml/header.xml', 'output/email-inline.html', 'xml/middle.xml', 'output/email-inline.txt', 'xml/footer.xml'],
			dest: 'output/email-inline-4upload.xml',
		}
	},
	exec:
	{
		upload_to_streamsend:
		{
			cmd: 'curl -i -H "Content-Type: application/xml" -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/emails.xml" -d @output/email-inline-4upload.xml',
			callback: function (error, stdout, stderr)
			{
				var regex = /Location: http:\/\/app.streamsend.com\/emails\/(\d+)/;
				var arr = regex.exec(stdout);
				settings.id = arr[1];
				grunt.log.write('Email ID is: ' + settings.id);
				grunt.log.write();
				grunt.file.write('settings.json', JSON.stringify(settings, null, 2)); // Save the email ID, so we can update it next time
			}
		},
		update_on_streamsend:
		{
			cmd: 'curl -i -H "Content-Type: application/xml" -X PUT -u ' + global_config.streamsend_api_credentials + ' "https://app.streamsend.com/emails/' + settings.id + '.xml" -d @output/email-inline-4upload.xml'
		}
	},
	// Upload images
	ftp_push: {
		your_target: {
			options: {
				host: global_config.ftp_host,
				dest: '/www/',
				port: 21,
				username: global_config.ftp_user,
				password: global_config.ftp_pass,
			},
			files: [
				{
					expand: true,
					cwd: '.',
					src: [
						'output/**'
					]
				}
			]
		}
	}
}