var Flickr = require("flickrapi");
var http = require("http");
var https = require("https");
var FormData = require("form-data");
var db = require("./data");
var flickrUtils = require("./flickrUtils");
var request = require("request");

exports.quickTest = function() {
	Flickr.authenticate({
        api_key: process.env.flickrKey,
        secret: process.env.flickrSecret,
        user_id: process.env.FLICKR_USER_ID,
        access_token: process.env.FLICKR_ACCESS_TOKEN,
        access_token_secret: process.env.FLICKR_ACCESS_TOKEN_SECRET
    }, function(err, flickr) {
		exports.uploadFromDb("bh17LSc6Ai", flickr);
	});
}
exports.uploadFromDb = function(id, flickr) {
	return db.asteroids.query.getPic(id).then(function (result){
		flickr.options = flickrUtils.setAuthVals(flickr.options);
		var params = {
			title: result.image.id,
			description: result.image.get("description"),
			is_public: 0,
			api_key: flickr.options.api_key,
			user_id: flickr.options.user_id,
			oauth_consumer_key: flickr.options.api_key,
			oauth_nonce: flickr.options.oauth_nonce,
			oauth_timestamp: flickr.options.oauth_timestamp,
			oauth_signature_method: "HMAC-SHA1",
			oauth_token: flickr.options.access_token
		};
		var queryString = flickrUtils.formQueryString(params);
		var data = flickrUtils.formBaseString("https://up.flickr.com/services/upload", queryString).replace("GET", "POST");
		var signature = flickrUtils.sign(data, flickr.options.secret, flickr.options.access_token_secret);
		params.oauth_signature = decodeURIComponent(signature);

		var data = new FormData();
		Object.keys(params).sort().forEach(function (key) {
			data.append(key, params[key]);
		});
		data.append("photo", request(result.src.get("src")), {filename: "file.jpg",contentType: "image/jpeg"});

		var req = data.submit("https://up.flickr.com/services/upload", function(error, res) {
			var output = '';
			res.setEncoding('utf8');

			res.on('data', function (chunk) {
				output += chunk;
			});

			res.on('end', function() {
				//var obj = JSON.parse(output);
				if(res.statusCode === 200) {
					/*exports.updateKimono(obj).then(function() {
						console.log("success:");
						console.log(arguments);
					}, function() {
						console.log("error:");
						console.log(arguments);
					});*/
				}
				console.log(output)
			});
		});
	});
}