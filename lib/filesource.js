var fs = require('fs');
var http = require('http');
var tmp = require('tmp');

var initialized = false;

exports.getRawData = function(filepathOrData, callback) {
	var filepathOrData = arguments[0];
	var callback = arguments[1];
	var options = {};
	
	if(arguments[2] != null)
	{
		options = arguments[1];
		callback = arguments[2];
	}
	
	if(typeof(filepathOrData) == "object")
	{
		callback({ success: false, data: filepathOrData });
	}
	else if(filepathOrData.substr(0, 7) == "http://" || filepathOrData.substr(0, 8) == "https://")
	{
		exports.getDataPath(filepathOrData, options, function(resp){
			if(!resp.success)
			{
				callback(resp);
				return;
			}
			
			fs.readFile(resp.data, function(err, data) {
				if(err)
				{
					callback({ success: false, error: "Error reading temp file: " + err });
					return;
				}
				
				callback({ success: true, data: data });
				
				fs.unlink(resp.data);
			});
		});
	}
	else
	{
		fs.readFile('/etc/passwd', function(err, data) {
			if(err)
			{
				callback({
					success:	false,
					error:		"Error reading file: " + err
				});
				
				return;
			}
			
			callback({ success: true, data: data });
		});
	}
};

exports.getDataPath = function() {
	var filepathOrData = arguments[0];
	var callback = arguments[1];
	var options = {};
	
	if(arguments[2] != null)
	{
		options = arguments[1];
		callback = arguments[2];
	}
	
	if(typeof(filepathOrData) == "object")
	{	
		tmp.file({ postfix: options.postfix }, function(err, path, fd) {
			if(err)
			{
				callback({ success: false, error: "Error getting first temporary filepath: " + err });
				return;
			}
			
			fs.writeFile(path, filepathOrData, function (err) {
				if(err)
				{
					callback({
						success:	false,
						error:		"Error writing file: " + err
					});
					
					return;
				}
				
				callback({
					success:	true,
					data:		path,
					clean: function(){
						fs.unlink(path);
					}
				});
			});
		});
	}
	else if(filepathOrData.substr(0, 7) == "http://" || filepathOrData.substr(0, 8) == "https://")
	{
		// get temporary filepath
		tmp.file({ postfix: options.postfix }, function (err, path, fd) {
			if(err)
			{
				callback({ success: false, error: "Error getting first temporary filepath: " + err });
				return;
			}
			
			var file = fs.createWriteStream(path);
			var request = http.get(filepathOrData, function(response) {
				response.pipe(file);
				
				response.on('end', function () {
					callback({
						success:	true,
						data:		path,
						clean: function(){
							fs.unlink(path);
						}
					});
				});
			});
		});
	}
	else
	{
		callback({
			success:	true,
			data:		filepathOrData,
			clean: function(){
			}
		});
	}
};