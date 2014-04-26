var Flickr = require("flickrapi");
var http = require("http");
var https = require("https");
var FormData = require("form-data");
var db = require("./data");
var flickrUtils = require("./flickrUtils")

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
		http.request(result.src.get("src"), function (file) {
			flickr.options = flickrUtils.setAuthVals(flickr.options);
			var params = {
				title: result.image.id,
				description: result.image.get("description"),
				format: "json",
				nojscallback: 1,
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
			params.oauth_signature = signature;
			console.log(params);
			console.log("------------------------");
			console.log(signature);

			var data = new FormData();
			Object.keys(params).sort().forEach(function (key) {
				data.append(key, params[key]);
			});
			data.append("photo", file);

			var req = https.request({
				host: "up.flickr.com",
				port: 443,
				path: "/services/upload",
				method: "POST",
				headers: data.getHeaders()
			}, function(res) {
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
					console.log("----------------------------------------------");
					console.log(output);
					console.log("----------------------------------------------");
					console.log(flickrUtils.sign(output.match(/oauth_problem=signature_invalid&debug_sbs=(.*)/)[1], flickr.options.secret, flickr.options.access_token_secret));
					console.log("----------------------------------------------");
					console.log(output.match(/oauth_problem=signature_invalid&debug_sbs=(.*)/)[1]);
				});
			});
			data.pipe(req);
			req.end();
		}).end();
	});
}