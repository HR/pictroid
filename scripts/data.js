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
 * @param {string} [src.contentType="image/gif"] The content type if it is a file.
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
			imgSrc.set("width", src[i].resolution.width);
			imgSrc.set("height", src[i].resolution.height);
			imgSrc.set("size", src[i].resolution.size);
			imgSrc.setACL(imageACL);

			if(src[i].isFile) {
				if(typeof src[i].src === "string") {
					src[i].src = {base64: src[i].src};
				} else if(!Array.isArray(src[i].src)) {
					// Convert data to array
					src[i].src = Array.prototype.map.call(src[i].src, function (val){
						return val;
					});
				}
				
				var file = new Parse.File(name, src[i].src, src[i].contentType || "image/gif");

				srcReady = file.save();
			} else {
				srcReady = Parse.Promise.as(src[i].src);
			}

			finished.push(srcReady.then(function(file) {
				if(typeof file === "string") {
					imgSrc.set("src", file);
				} else {
					imgSrc.set("file", file);
					imgSrc.set("src", file.url());
				}

				return imgSrc.save()
			}).then(function(imgSrc) {
				image.relation("src").add(imgSrc);
			}));
		}
		return Parse.Promise.when(finished).then(function(result) {
			image.set("owner", Parse.User.current());
			return image.save();
		}).then(function (result) {
			Parse.User.current().relation("uploads").add(image);
			return Parse.User.current().save();
		}).then(function(user) {
			return image;
		});
	});
}

asteroids.query = {}
asteroids.query.getPic = function(id){
	var imgQuery = new Parse.Query(Image).include("owner");
	var image = {};
	return imgQuery.get(id).then(function(result){
		// Add image table
		image.image = result;
		var owner = result.get("owner");
		if (owner) {
			image.username = owner.get('username');
		} else {
			image.username = 'pictroid';
		}
		// Get src
		return result.relation("src").query().first();
	}).then(function(src){
		image.src = src;
		return image;
	});
}
asteroids.query.getUser = function(username){
	var userQuery = new Parse.Query(Parse.User);
	return userQuer.get(username).then(function(result){
		console.log(result);
	});
}
asteroids.query.getLatest = function(width) {
	var imgQuery = new Parse.Query(Image).include("owner");
	imgQuery.descending("createdAt");
	return imgQuery.find().then(function(results){
		var fileQuery;
		var images = [];
		for (var i = 0; i < results.length; i++) {
			(function() {
				var owner = results[i].get("owner");
				var imgOwner;
				if (owner) {
					imgOwner = owner.get('username');
				} else {
					imgOwner = 'pictroid';
				}
				fileQuery = results[i].relation("src").query();
				fileQuery.lessThanOrEqualTo("width", width);
				fileQuery.descending("width");
				(function(image) {
					images.push(fileQuery.first().then(function(result){
						if(!result) {
							var fileQuery = image.relation("src").query();
							fileQuery.ascending("width");
							return fileQuery.first();
						}
						return result;
					}).then(function(result) {
						return {
							image: image,
							src: result,
							username: imgOwner
						}
					}));
				})(results[i]);
			})(results[i]);
		};
		return Parse.Promise.when(images);
	});
}

exports.user = {};
exports.asteroids = asteroids;
