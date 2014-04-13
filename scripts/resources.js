var db = require('./data');
var http = require("http");

function updateDB(data) {
	var results = data.results.Article;
	for(var i = 0; i < results.length; i++) {
		db.asteroids.upload(results[i].Title.text, results[i].Thumbnail.src, results[i].Description.text);
	}
}

var req = http.request({
	host: "www.kimonolabs.com",
	port: 80,
	path: "/api/bgocgl00?apikey="+process.env.kimonoKey,
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
        	updateDB(obj);
        }
    });
});

req.on('error', function(err) {
    //res.send('error: ' + err.message);
});

req.end();