var fs = require("fs");
var blockStorage = require("pkgcloud").storage.createClient({
	provider: "rackspace",
	username: process.env.rackspaceUsername,
	apiKey: process.env.rackspaceApiKey,
	region: "IAD"
});


blockStorage.getContainers(function(err, containers) {
	var myFile = fs.createReadStream("C:/Users/Jack/Documents/GitHub/pictroid/logs.txt");
	myFile.pipe(blockStorage.upload({
		container: containers[0],
		remote: "logs.txt"
	}, function(err, result) {
		console.log(result);
	}));
});