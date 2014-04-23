
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
    helmet = require('helmet'),
    moment = require('moment');

// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.bodyParser());
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
app.get('/email_confirmed', function(req, res) {
    if(req.query.username){
	    res.render('email_confirmed', { username : req.query.username });
    } else {
    	res.redirect('/');
    }
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
	var Parse = require('parse').Parse;
	Parse.initialize(process.env.parseID, process.env.parseJavascriptKey, process.env.parseMasterKey);
	var currentUser = Parse.User.current();
	// Code to authorize
	if (currentUser) {
		res.render('user/settings', { username:currentUser.attributes.username, email:currentUser.attributes.email});
	} else {
		res.redirect('/signin');
	};
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

app.post('/signin', function(req, res) {
	var util = require('util');
	var Parse = require('parse').Parse;
	Parse.initialize(process.env.parseID, process.env.parseJavascriptKey, process.env.parseMasterKey);
	Parse.User.logIn(req.body.username, req.body.password, {
	  success: function(user) {
	    // Do stuff after successful login.
	    if (user.attributes.lastSignIn == undefined) {
	    	// TO DO 
			// set date for last login  using moment with format "yyyy'-'MM'-'dd'T'HH':'mm':'ss.SSS'Z'"
	    	// user.set("lastSignIn", moment().format('MMMM Do YYYY, h:mm:ss a'));
	    	res.redirect('/user/'+user.attributes.username+'/settings');
	    };
	  },
	  error: function(user, error) {
	    // The login failed. Check error to see why.
	    console.log("Error: " + error.code + " " + error.message);
	    if (error.code == 101) {

	    };
	  }
	});
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
