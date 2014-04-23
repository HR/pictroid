
/**
 * Module dependencies.
 */

//var db =  monk('localhost:27017/test');
var express = require('express'),
    http = require('http'),
    mongo = require('mongodb'),
    monk = require('monk'),
    path = require('path'),
    routes = require('./routes'),
    app = express(),
    auth = require('./scripts/auth'),
    db = require('./scripts/data'),
    resources = require('./scripts/resources'),
    newrelic = require('newrelic'),
    helmet = require('helmet');

// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'jade');
app.use(app.router);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
// app.use(helmet.xframe());
// app.use(helmet.iexss());
// app.use(helmet.contentTypeOptions());
// app.use(helmet.cacheControl());
// app.use(express.cookieParser(process.env.cpsKey));
// app.use(express.session({
//   secret: process.env.sKey,
//   key: 'sid',
//     cookie: {httpOnly: true, secure: true}
// }));

// app.use(express.csrf());
// app.use(function (req, res, next) {
//   res.locals.csrftoken = req.csrfToken();
//   next();
// });
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Get
app.get('/', routes.index);
app.get('/about', function(req, res) {
    res.render('about');
});
app.get('/explore/:filter?', function(req, res) {
    res.render('explore', { filter: req.params.filter });
});
app.get('/pic/:id', function(req, res) {
    res.render('details', { picID: req.params.id });
});
app.get('/signin', function(req, res) {
    res.render('signin');
});
app.get('/signup', function(req, res) {
    res.render('signup');
});
app.get('/upload', function(req, res) {
    res.render('user/upload');
});
app.get('/user/:name', function(req, res) {
    res.render('user/profile', { username: req.params.name });
});
app.get('/user/:name/settings', function(req, res) {
	// Code to authorize
    res.render('user/settings', { });
});
app.get('/*', function(req, res) {
    res.render('error', { error: '404' });
});

// Post
app.post('/kimono_spitzer', function(req, res) {
	resources.updateKimono(req.body).then(function(){
		res.send(arguments);
	}, function() {
		console.error(arguments);
		res.send(500, arguments);
	});
});

app.post('/signup', function(req, res) {
	// var SignUp = new auth.signup(req.body.username, req.body.password, req.body.email, res);
	var Parse = require('parse').Parse;
	Parse.initialize(process.env.parseID, process.env.parseJavascriptKey, process.env.parseMasterKey);

	var user = new Parse.User();

	user.set("username", req.body.username);
	user.set("password", req.body.password);
	user.set("email", req.body.email);

	user.signUp(null, {
		success: function(user) {
			// Redirect to email confirmation page
			res.render('email_confirmation', { email: req.body.email});
		},
		error: function(user, error) {
			// Show the error message somewhere and let the user try again.
			console.log("Error: " + error.code + " " + error.message);
			if(error == 202) {
				window.document.getElementById('emsg').innerHTML=error.message;
			}
		}
	});
});


app.get('/email_confirmed', function(req, res) {
    if(req.headers['referer'].substr(0, document.referrer.indexOf("com")+3)==="https//wwww.parse.com"){
	    res.render('email_confirmed', { username : req.query.username });
        setTimeout(res.redirect('/get-started'), 5000);
    } else {
        res.redirect('/get-started');
    }
});

app.post('/upload', function(req, res) {
    // Code to handle upload
    res.writeHead(200,{"content-type":"text/plain;charset=UTF8;"});
    res.end("POST");
    console.log(request.body); 
});

db.asteroids.query.getLatest(600).then(function() {
	global.results = arguments;
	http.createServer(app).listen(app.get('port'), function(){
	  console.log('Express server listening on port ' + app.get('port'));
	});
});
