var fs = require("fs");
var blockStorage = require("pkgcloud").storage.createClient({
	provider: "rackspace",
	username: process.env.rackspaceUsername,
	apiKey: process.env.rackspaceApiKey,
	region: "IAD"
});

exports.upload = function (file, name, callback) {
	blockStorage.getContainers(function(err, containers) {
		var i = 0;
		while(!containers[i].name.match(/^Images-\d{5}$/)) {
			i++;
		}

		var container = containers[i];
		file.pipe(blockStorage.upload({
			container: container,
			remote: name
		}, callback));
	});
}