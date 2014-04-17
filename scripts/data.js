var Parse = require('parse').Parse;
var Image = Parse.Object.extend("Image");
var ImageSrc = Parse.Object.extend("ImageSrc");

Parse.initialize(process.env.parseID, process.env.parseJavascriptKey, process.env.parseMasterKey);

/**
 * asteroid image data manipulation
 * @namespace asteroids
*/
var asteroids = {};

/**
 * upload an image
 * @memberof asteroids
 * @param {String} name The title of the image.
 * @param {Object[]} src Array of src image files.
 * @param {Boolean} [src.isFile=false] Whether the file is file or url.
 * @param {String|Array} src.src The source of the file, can be url, base64, or byte array
 * @param {Object} src.resolution Resolution information of the image
 * @param {Number} src.resolution.x The width of the image in pixels
 * @param {Number} src.resolution.y The height of the image in pixels
 * @param {Number} src.resolution.size The size of the image in kilobytes
 * @param {String} desc A description of the image
*/
asteroids.upload = function(name, src, desc) {
	var imgQuery = new Parse.Query(Image);
	imgQuery.equalTo("name", name);
	return imgQuery.find().then(function(results) {
		if(results.length) {
			return Parse.Promise.error("Image already exists");
		}

		// create new image
		var image = new Image();

		image.set("name", name);
		image.set("description", desc);
		
		// set permissions
		var imageACL = new Parse.ACL(Parse.User.current());
		imageACL.setPublicReadAccess(true);
		image.setACL(imageACL);

		var finished = [];
		for(var i = 0; i < src.length; i++) {
			var srcReady;
			var imgSrc = new ImageSrc();
			imgSrc.set("resolution", JSON.stringify(src[i].resolution));
			imgSrc.setACL(imageACL);

			if(src[i].isFile) {
				var file = new Parse.File(name + ".gif", typeof src[i].src === "string" ? {base64: src[i].src} : src[i].src);

				srcReady = file.save();
			} else {
				srcReady = Parse.Promise.as(src[i].src);
			}

			finished.push(srcReady.then(function(file) {
				if(typeof file === "string") {
					imgSrc.set("src", file);
				} else {
					imgSrc.set("file", file);
					imgSrc.set("src", flile.url());
				}

				return imgSrc.save().then(function(imgSrc) {
					image.relation("src").add(imgSrc);
				});
			}));
		}
		return Parse.Promise.when(finished).then(function(result) {
			return image.save();
		});
	});
}

asteroids.query = {}
asteroids.query.getLatest = function() {
	var imgQuery = new Parse.Query(Image);
	imgQuery.ascending("createdAt");
	return imgQuery.find();
}

exports.user = {};
exports.asteroids = asteroids;
