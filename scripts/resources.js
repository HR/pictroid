var db = require('./data');
var http = require("http");
var Flickr = require("flickrapi");
var Parse = require("parse").Parse;
var moment = require("moment");

function updateDB(results, api) {
    var finished = [];
    var burstFinished;
    var prevFunc;
    // Deal with request limit
    for(var i = results.length; i > 0; i -= 10) {
        burstFinished = new Parse.Promise();
        (function(burstFinished, nextFunc, i) {
            var currentFunc = function() {
                if(nextFunc) {
                    setTimeout(nextFunc, 1000);
                }
                console.log("uploading burst " + Math.ceil(i/10) + "/" + Math.ceil(results.length/10));
                var uploaded = [];
                var start = 0 > i - 10 ? 0 : i - 10;
                for(var y = start; y < i; y++) {
                    uploaded.push(db.asteroids.upload(results[y].title, results[y].src, results[y].desc, results[y].date, api).fail(function(err) {
                        if(err === "Image already exists") {
                            return Parse.Promise.as("Image already exists");
                        } else {
                            return err;
                        }
                    }));
                }
                Parse.Promise.when(uploaded).then(function () {
                    burstFinished.resolve.apply(burstFinished, arguments);
                }, function () {
                    burstFinished.reject.apply(burstFinished, arguments);
                });
            };
            if(i - 10 < 0) {
                currentFunc();
            }
            prevFunc = currentFunc;
        })(burstFinished, prevFunc, i);
        finished.push(burstFinished);
    }
    return Parse.Promise.when(finished)
}

exports.updateSpitzer = function(obj) {
    var results = obj.results
    var finalResults = [];
    var counter = 0;
    for(var i = 0; i < results.collection1.length; i++) {
        var files = [];
        var resolution;
        var urlRegex = /^.+?(_[a-zA-Z]+)?\.jpg$/
        var next = false;
        do {
            resolution = results.collection2[counter].resolution;
            var size = resolution.text.match(/^(\d+) x (\d+) • (\d+(?:\.\d+)?) ([KM])B$/);
            size[3] = size[4] === "M" ? 1024 * size[3] : size[3]
            files.push({
                src: resolution.href,
                resolution: {
                    width: parseFloat(size[1]),
                    height: parseFloat(size[2]),
                    size: parseFloat(size[3])
                }
            });
            counter++;
        } while(resolution.href.match(urlRegex)[1]);
        finalResults.push({
            title: results["collection" + (4 + i)][0].Title.text,
            src: files,
            desc: results.collection3[i].text
        });
    }
    return updateDB(finalResults, "spitzer");
}

exports.updateAPOD = function (obj) {
    var results = obj.results.Apod_Detail;
    var finalResults = [];
    for(var i = 0; i < results.length; i++) {
        if (results[i].Title !== undefined && results[i].Date !== undefined && results[i].Image.href !== undefined) {
            finalResults.push({
                title: results[i].Title,
                src: [{
                    src: results[i].Image.href,
                    resolution: {}
                }],
                desc: results[i].Description.text,
                date: moment(results[i].Date, "YYYY MMM DD").toDate()
            });
        }
    }
    return updateDB(finalResults, "APOD");
}

// flickr
/*function flickrOAuth(callback) {
    Flickr.authenticate({
        api_key: process.env.flickrKey,
        secret: process.env.flickrSecret,
        user_id: process.env.FLICKR_USER_ID,
        access_token: process.env.FLICKR_ACCESS_TOKEN,
        access_token_secret: process.env.FLICKR_ACCESS_TOKEN_SECRET
    }, callback);
}

flickrOAuth(function(err, flickr) {
    if(err) {
        console.log("Flickr authentication error: " + err);
        return;
    }
    flickr.people.getPublicPhotos({
        user_id: flickr.options.user_id
    }, function(err, result) {
        if(err) {
            console.log("Error getting photos from user: " + err);
            return;
        }
        photos = result.photos.photo;
        var finalResults = [];
        sizes = [
            {
                name: "t",
                size: 100
            },
            {
                name: "n",
                size: 320
            },
            {
                name: "z",
                size: 640
            },
            {
                name: "b",
                size: 1024
            }
        ];
        for(var i = 0; i < photos.length; i++) {
            var files = [];
            for(var y = 0; y < sizes.length; y++) {
                files.push({
                    src: "http://farm"+ photos[i].farm +".staticflickr.com/" + photos[i].server + "/" + photos[i].id + "_" + photos[i].secret + "_" + sizes[y].name + ".jpg",
                    resolution: {
                        width: sizes[y].size
                    }
                });
            }
            finalResults.push({
                title: photos[i].title,
                src: files,
                desc: ""
            });
        }
        updateDB(finalResults, "flickr");
    });
});*/

// kimono
var req = http.request({
	host: "www.kimonolabs.com",
	port: 80,
	path: "/api/51mcm5qm?apikey="+process.env.kimonoKey,
	method: "GET",
	headers: {
		"Content-Type": "application/json"
	}
}, function(res) {
    var output = '';
    res.setEncoding('utf8');

    res.on('data', function (chunk) {
        output += chunk;
    });

    res.on('end', function() {
        var obj = JSON.parse(output);
        if(res.statusCode === 200) {
            /*exports.updateKimono(obj).then(function() {
                console.log("success:");
                console.log(arguments);
            }, function() {
                console.log("error:");
                console.log(arguments);
            });*/
        }
    });
});
req.on('error', function(err) {
    //res.send('error: ' + err.message);
});
req.end();
