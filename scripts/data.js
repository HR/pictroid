var Parse = require('parse').Parse;
var Image = Parse.Object.extend("Image");

Parse.initialize(process.env.parseID, process.env.parseJavascriptKey, process.env.parseMasterKey);

var asteroids = {};
asteroids.upload = function(name, src, desc, type) {
	var saveImage = function(file) {
		var imgQuery = new Parse.Query(Image);
		imgQuery.equalTo("src", "http://www.spitzer.caltech.edu/uploaded_files/graphics/square_graphics/0009/6850/sig13-010b_Tn_three.jpg?1378848106");
		return imgQuery.find().then(function(results){
			if(results.length) {
				return "Image already exists"
			}
			// create new image
			var image = new Image();
			if(file) {
				image.set("file", file);
			} else {
				image.set("src", src);
			}
			image.set("name", name);
			image.set("description", desc);

			// set permissions
			var imageACL = new Parse.ACL(Parse.User.current());
			imageACL.setPublicReadAccess(true);
			image.setACL(imageACL);

			return image.save();
		});
	}
	if(type === "file") {
		var file = new Parse.File(name + ".gif", src);
		
		return file.save().then(function(file) {
			// set properties
			return saveImage(file);
		})
	} else {
		return saveImage();
	}
}

asteroids.query = {}
asteroids.query.getLatest = function() {
	var imgQuery = new Parse.Query(Image);
	imgQuery.ascending("createdAt");
	return imgQuery.find();
}

exports.user = {};
exports.asteroids = asteroids;
