var fs = require("fs");
var blockStorage = require("pkgcloud").storage.createClient({
	provider: "rackspace",
	username: process.env.rackspaceUsername,
	apiKey: process.env.rackspaceApiKey,
	region: "IAD"
});

function findByRegExName(obj, regex) {
	var i = 0;
	while(!obj[i].name.match(regex)) {
		i++;
	}
	return obj[i]
}

exports.upload = function (file, name, callback) {
	blockStorage.getContainers(function (err, containers) {
		blockStorage.getCdnContainers(function (err, cdns) {
			var container = findByRegExName(containers, /^Images-\d{5}$/);
			var cdn = findByRegExName(cdns, container.name);
			console.log(cdn);
			file.pipe(blockStorage.upload({
				container: container,
				remote: name
			}, function (err, result) {
				callback(err, result, cdn.cdnSslUri + "/" + name);
			}));
		});
	});
}