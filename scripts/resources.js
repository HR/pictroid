var db = require('./data');
var http = require("http");
var Flickr = require("flickrapi");

function updateDB(results) {
    for(var i = 0; i < results.length; i++) {
        db.asteroids.upload(results[i].title, results[i].src, results[i].desc)
    }
}

// flickr
function flickrOAuth(callback) {
    Flickr.authenticate({
        api_key: process.env.flickrKey,
        secret: process.env.flickrSecret,
        user_id: process.env.FLICKR_USER_ID,
        access_token: process.env.FLICKR_ACCESS_TOKEN,
        access_token_secret: process.env.FLICKR_ACCESS_TOKEN_SECRET
    }, function(err, flickr){
        if(err) {
            console.log(err);
            callback(err);
        } else {
            callback(flickr);
        }
    });
}

flickrOAuth(function(flickr) {
    flickr.people.getPublicPhotos({
        user_id: flickr.options.user_id
    }, function(err, result) {
        if(err) {
            console.log(err);
        }
        photos = result.photos.photo;
        var finalResults = [];
        for(var i = 0; i < photos.length; i++) {
            finalResults.push({
                title: photos[i].title,
                src: "http://farm"+ photos[i].farm +".staticflickr.com/" + photos[i].server + "/" + photos[i].id + "_" + photos[i].secret + ".jpg",
                desc: ""
            });
        }
        updateDB(finalResults);
    });
})

// kimono
var req = http.request({
	host: "www.kimonolabs.com",
	port: 80,
	path: "/api/753j59mk?apikey="+process.env.kimonoKey,
	method: "GET",
	headers: {
		"Content-Type": "application/json"
	}
}, function(res)
{
    var output = '';
    res.setEncoding('utf8');

    res.on('data', function (chunk) {
        output += chunk;
    });

    res.on('end', function() {
        var obj = JSON.parse(output);
        if(res.statusCode === 200) {
            var results = obj.results.collection1
            var finalResults = [];
            for(var i = 0; i < results.length; i++) {
                finalResults.push({
                    title: results[i].Title.text,
                    src: results[i].Thumbnail.src,
                    desc: results[i].Description.text
                });
            }
            updateDB(finalResults);
        }
    });
});

req.on('error', function(err) {
    //res.send('error: ' + err.message);
});

req.end();