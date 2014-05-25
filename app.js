
/**
 * Module dependencies.
 */

//var db =  monk('localhost:27017/test');
var express = require('express'),
	http = require('http'),
	mongo = require('mongodb'),
	MongoClient = require('mongodb').MongoClient,
	// mongoose = require('mongoose'),
	MongoStore = require('connect-mongo')(express);
	monk = require('monk'),
	path = require('path'),
	routes = require('./routes'),
	app = express(),
	auth = require('./scripts/auth'),
	db = require('./scripts/data'),
	resources = require('./scripts/resources'),
	newrelic = require('newrelic'),
	helmet = require('helmet'),
	moment = require('moment'),
	base64 = require('base64-js'),
	multiparty = require('multiparty'),
	fs = require("fs"),
	uuid = require('node-uuid'),
	url = require('url'),
	rackspaceIO = require('./scripts/rackspaceIO');
  
// Parse initialization  
var Parse = require('parse').Parse;
Parse.initialize(process.env.parseID, process.env.parseJavascriptKey, process.env.parseMasterKey);
var currentUser,
	cache,
	sid = uuid.v4(),
	mport,
	mhost,
	mdb;
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  mdb = 'user';
  mhost = '127.0.0.1';
  mport = 27017;
  MongoClient.connect('mongodb://127.0.0.1:27017/user', function(err, db) {
	if (err){
		console.log(err);
	}
  });
  // mongoose.connect('mongodb://127.0.0.1:27017/db');
});

app.configure('production', function(){
	app.use(express.errorHandler());
	mdb = 'heroku_app23982462';
	mhost = 'ds037508.mongolab.com';
	mport = 37508;
	MongoClient.connect('mmongodb://'+process.env.DbUser+':'+process.env.DbPass+'@ds037508.mongolab.com:'+mport+'/'+mdb, function(err, db) {
		if (err){
			console.log(err);
		}
	});
});

// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.bodyParser());
app.use(helmet.xframe());
app.use(helmet.iexss());
app.use(helmet.contentTypeOptions());
app.use(helmet.cacheControl());
app.use(express.cookieParser(sid));
app.use(express.session({
	secret: sid,
	store: new MongoStore({
		db: mdb,
		host: mhost,
		port: mport
	}),
	cookie: {
		httpOnly: true, 
		// secure: true,
		maxAge: 60000
	}
}));
app.use(app.router);
app.use(express.csrf());
app.use(function (req, res, next) {
  res.locals.csrftoken = req.csrfToken();
  next();
});
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Get
app.get('/', function(req, res) {
	console.log(req.session);
	if (req.session.auth){
		res.render('index', { title: 'Pictroid', username:req.session.user.username, authed:true});
	} else {
		/*var kimReq = http.request({
			host: "www.kimonolabs.com",
			port: 80,
			path: "/api/5zeipr38?apikey="+process.env.kimonoKey,
			method: "GET",
			headers: {
			  "Content-Type": "application/json"
			}
		}, function(kimRes) {
			 var output = '';
			 kimRes.setEncoding('utf8');

			 kimRes.on('data', function (chunk) {
				  output += chunk;
			 });

			 kimRes.on('end', function() {
				  var obj = JSON.parse(output);
				  if(kimRes.statusCode === 200) {
						resources.updateAPOD(obj).then(function(){}, function() {
							console.error(arguments);
						});
				  }
			 });
		});
		kimReq.on('error', function(err) {
			 //res.send('error: ' + err.message);
		});
		kimReq.end();*/
		res.render('index');
	}
});
app.get('/explore/:filter?', function(req, res) {
	if (req.session.auth){
		res.render('explore', { filter: req.params.filter, username:req.session.user.username, authed:true});
	} else {
		res.render('explore', { filter: req.params.filter });
	}
});
app.get('/pic/:id', function(req, res) {
	if (req.session.auth){
		db.asteroids.query.getPic(req.params.id).then(function(result) {
			res.render('details', { picObject: result, username:req.session.user.username, authed:true});
	var message = req.query.m;
	if(message == "u"){
		message = [];
		message.title = "Success!";
		message.message = "Your pic has been successfully uploaded.";
	}
	if(currentUser){
		db.asteroids.query.getPic(req.params.id).then(function(result) {
			res.render('details', { m:message, picObject: result, imgOwner:result.username, username:currentUser.attributes.username, authed:true});
		}, function() {
			res.render('error', { error: '404' }); 	
		});
	} else {
		db.asteroids.query.getPic(req.params.id).then(function(result) {
			res.render('details', {  m:message, picObject:result, imgOwner:result.username });
		}, function() { 
			res.render('error', { error: '404' }); 	
		});
	}
});
app.get('/user/:name', function(req, res) {
	var query = new Parse.Query(Parse.User);
	query.equalTo("username", req.params.name);
	query.first({
		success: function(user) {
			if (user !== undefined) {
				var imgQ = user.relation("uploads").query();
				var image = {};
				imgQ.find({
				   success : function (result) {
						for (var i = 0; i < result.length; i++) {
							result[i];
						}
				   },
				   error : function(error) {
					  alert("Error: " + error.code + " " + error.message);
				   }
				});
				if (req.session.auth) {
					res.render('user/profile', { profile_username:req.params.name, profile_image:user.get("profileImg").url(), profile_status:user.get("status"), username:req.session.user.username, authed:true});
				var relation = user.relation("uploads");
				relation.query().find({
					success: function(uploads) {
						// uploads contains the uploads of the user in param
						console.log(uploads);
					}
				});
				if (currentUser) {
					res.render('user/profile', { profile_username:req.params.name, profile_image:user.get("profileImg").url(), profile_status:user.get("status"), username:currentUser.attributes.username, authed:true});
				} else {
					res.render('user/profile', { profile_username:req.params.name, results:image ,profile_image:user.get("profileImg").url(), profile_status:user.get("status")});
				}
			} else {
				res.render('error', { error: '404', secure:true});
			}
		},
		error: function(user, error) {
			console.log("Error: " + error.code + " " + error.message);
			res.render('error', { error: '404' });
		}
	});
	
});
app.get('/upload', function(req, res) {
	// Code to authedorize
	if (req.session.auth) {
		res.render('user/upload', { username:req.session.user.username, authed:true});
	// Code to auth
	if (currentUser) {
		res.render('user/upload', { username:currentUser.attributes.username, authed:true});
	} else {
		res.redirect('/signin'+'?er=SignInRequired');
	}
});
app.get('/about', function(req, res) {
	console.log(req.session);
	if (req.session.auth){

		res.render('about', { username:req.session.user.username, authed:true});
	} else {
		res.render('about');
	}
});
app.get('/signin', function(req, res) {
	if (!req.session.auth){
		if (req.query.er === "SignInRequired") {
			res.render('signin', { error : "You have to be signed in to access the page", secure:true});
		} else {
			res.render('signin');
		}
	} else {

		res.redirect('/');
	}
});
app.get('/signout', function(req, res) {
	if (req.session.auth){
		Parse.User.logOut();
		currentUser = null;
		req.session.destroy(function(){
			req.session = null;
			if (req.query.return_to) {
				res.redirect(req.query.return_to);
			} else {
				res.redirect('/');
			}
		});
	} else {
		res.redirect('/signin');
	}
});
app.get('/signup', function(req, res) {
	if (!req.session.auth){
		res.render('signup');
	} else {
		res.redirect('/');
	}
});
app.get('/account/settings', function(req, res) {
	// Code to authedorize
	if (req.session.auth) {
		res.render('account/settings', { username:req.session.user.username, email:req.session.user.email, status:req.session.user.status, profileImgSrc:req.session.user.profileImg.url, authed:true, secure:true});

	// Code to auth
	if (currentUser) {
		res.render('account/settings', { username:currentUser.attributes.username, email:currentUser.attributes.email, status:currentUser.attributes.status, profileImgSrc:currentUser.get("profileImg").url(), authed:true, secure:true});
	} else {
		res.redirect('/signin');
	}
});
app.get('/password_reset', function(req, res) {
	if (!currentUser) {
		res.render('password_reset', { secure:true});
	} else {
		res.redirect('/account/settings');
	}
});
app.get('/password_reset_request', function(req, res) {
	if(req.query.email){
		res.render('password_reset_request', { email : req.query.email, secure:true});
	} else {
		res.redirect('/');
	}
});
app.get('/passwordchange_confirmation', function(req, res) {
	if (req.query.username) {
		res.render('passwordchange_confirmation', { username:req.query.username, secure:true});
	} else {
		res.redirect('/');
	}
});
app.get('/email_confirmed', function(req, res) {
	if (req.query.username){
		res.render('email_confirmed', { username : req.query.username, secure:true});
	} else {
		res.redirect('/');
	}
});
app.get('/email_confirmation', function(req, res) {
	if (req.query.email){
		res.render('email_confirmed', { email : req.query.email, secure:true});
	} else {
		res.redirect('/');
	}
});
app.get('/invalid_link', function(req, res) {
	// Code to auth
	res.redirect('/404');
});
app.get('/*', function(req, res) {
	res.render('error', { error: '404' });
});

// Post
app.post('/kimono_spitzer', function(req, res) {
	resources.updateSpitzer(req.body).then(function(){
		res.send(arguments);
	}, function() {
		console.error(arguments);
		res.send(500, arguments);
	});
});
app.post('/kimono_APOD', function(req, res) {
	resources.updateAPOD(req.body).then(function(){
		res.send(arguments);
	}, function() {
		console.error(arguments);
		res.send(500, arguments);
	});
});
app.post('/password_reset', function(req, res) {
	Parse.User.requestPasswordReset(req.body.email.toLowerCase(), {
	  success: function() {
		 // Password reset request was sent successfully
		 res.redirect("/password_reset_request?email="+req.body.email.toLowerCase());
	  },
	  error: function(error) {
		 // Show the error message somewhere
		 alert("Error: " + error.code + " " + error.message);
	  }
	});
});
app.post('/account/settings', function(req, res) {
	var form = new multiparty.Form();
	form.parse(req, function(err, fields, files) {
		var imagef = fs.readFile(files.profileImgFile[0].path, function (err, data) {
			if (err) throw err;
			// convert to array
			data = Array.prototype.map.call(data, function (val){
				return val;
			});
			var file = new Parse.File("user_profile", data, files.profileImgFile[0].headers["content-type"]);
			file.save().then(function (file) {
				Parse.User.current().set("profileImg", file);
				return Parse.User.current().save();
			}).then(function(user) {
				console.log('success');
				res.redirect('/account/settings');
			},
			function(error) {
				console.log('error', error);
				res.render('signin', { error : error.message, secure:true});
			});
		});
		Parse.User.current().set("password", fields.password[0]);
		Parse.User.current().save()
		.then(
		  function(user) {
			return user.fetch();
		  }
		)
		.then(
		  function(user) {
			console.log('Password changed', user);
			res.redirect('/passwordchange_confirmation?username='+req.session.username);
		  },
		  function(error) {
			console.log('Something went wrong', error);
		  }
		);
	});
});

app.post('/signup', function(req, res) {
	// var SignUp = new authed.signup(req.body.username, req.body.password, req.body.email, res);
	var user = new Parse.User();
	user.set("username", req.body.username.toLowerCase());
	user.set("password", req.body.password);
	user.set("email", req.body.email.toLowerCase());
	user.set("status", "Explorer");
	user.signUp(null, {
		success: function(user) {
			// Redirect to email confirmation page
			res.redirect('email_confirmation?email='+req.body.email);
		},
		error: function(user, error) {
			// Show the error message somewhere and let the user try again.
			console.log("Error: " + error.code + " " + error.message);
			res.render('signup', { error : error.message, secure:true});
		}
	});
});

app.post('/signin', function(req, res) {
	Parse.User.logIn(req.body.username.toLowerCase(), req.body.password, {
		success: function(user) {
		// Do stuff after successful login.
			if (user.attributes.emailVerified === true) {
				 if (user.attributes.lastSignIn == undefined) {
						var profileImg = "data:image/gif;base64,R0lGODlhlgCWAOfpABYWFhcXFxgYGBkZGRoaGhsbGxwcHB0dHR4eHh8fHyAgICEhISIiIiMjIyQkJCUlJSYmJicnJygoKCkpKSoqKisrKywsLC0tLS4uLi8vLzAwMDExMTIyMjMzMzQ0NDU1NTY2Njc3Nzg4ODk5OTo6Ojs7Ozw8PD09PT4+Pj8/P0BAQEFBQUJCQkNDQ0REREVFRUZGRkdHR0hISElJSUpKSktLS0xMTE1NTU5OTk9PT1BQUFFRUVJSUlNTU1RUVFVVVVZWVldXV1hYWFlZWVpaWltbW1xcXF1dXV5eXl9fX2BgYGFhYWJiYmNjY2RkZGVlZWZmZmdnZ2hoaGlpaWpqamtra2xsbG1tbW5ubm9vb3BwcHFxcXJycnNzc3R0dHV1dXZ2dnd3d3h4eHl5eXp6ent7e3x8fH19fX5+fn9/f4CAgIGBgYKCgoODg4SEhIWFhYaGhoeHh4iIiImJiYqKiouLi4yMjI2NjY6Ojo+Pj5CQkJGRkZKSkpOTk5SUlJWVlZaWlpeXl5iYmJmZmZqampubm5ycnJ2dnZ6enp+fn6CgoKGhoaKioqOjo6SkpKWlpaampqenp6ioqKmpqaqqqqurq6ysrK2tra6urq+vr7CwsLGxsbKysrOzs7S0tLW1tba2tre3t7i4uLm5ubq6uru7u7y8vL29vb6+vr+/v8DAwMHBwcLCwsPDw8TExMXFxcbGxsfHx8jIyMnJycrKysvLy8zMzM3Nzc7Ozs/Pz9DQ0NHR0dLS0tPT09TU1NXV1dbW1tfX19jY2NnZ2dra2tvb29zc3N3d3d7e3t/f3+Dg4OHh4eLi4uPj4+Tk5OXl5ebm5ufn5+jo6Onp6erq6uvr6+zs7O3t7e7u7u/v7/Dw8PHx8fLy8vPz8/T09PX19fb29vf39/j4+Pn5+fr6+vv7+/z8/P39/f7+/v///////////////////////////////////////////////////////////////////////////////////////////yH+IENvcHlyaWdodCBieSBDb2RleGEgT3JnYW5pc2F0aW9uACH5BAEKAP8ALAAAAACWAJYAAAj+ALEJHEiwoMGDCBMqXMiwocOHECNKnEixosWLGDNq3Mixo8ePIEOKHEmypMmTKFOqXMmypcuXMGPKnEmzps2b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",
							parseFile = new Parse.File("user_profile", { base64: profileImg});
						user.set("lastSignIn", new Date());
						user.set("profileImg", parseFile);
						user.save().then(
							function(user) {
								req.session.regenerate(function(){
									// Store the user's primary key
									// in the session store to be retrieved,
									// or in this case the entire user object
									req.session.user = Parse.User.current();
									req.session.auth = true;
									res.redirect('/account/settings');
								});
							},
							function(error) {
								res.render('signin', { error : error.message, secure:true});
							}
						);
					} else {
						user.set("lastSignIn", new Date());
						user.save().then(
							function(user) {
								req.session.regenerate(function(){
									// Store the user's primary key
									// in the session store to be retrieved,
									// or in this case the entire user object
									req.session.user = Parse.User.current();
									req.session.auth = true;
									res.redirect('/');
								});
							},
								function(error) {
								console.log('error', error);
								res.render('signin', { error : error.message, secure:true});
							}
						);
					}
			} else {
				res.render('signin', { error : "You have to confirm your email before you can Sign In", secure:true});
			}
		},
		error: function(user, error) {
			console.log("Error: " + error.code + " " + error.message);
			res.render('signin', { error : error.message, secure:true});
		}
	});
});

app.post('/upload', function(req, res) {
	// Code to handle upload
	var form = new multiparty.Form();
	form.parse(req, function(err, fields, files) {
		var imagef = fs.readFile(files.image[0].path, function (err, data) {
			if (err) throw err;
			
			db.asteroids.upload(files.image[0].originalFilename, [{
				src: data,
		var imagef = fs.createReadStream(files.image[0].path);
		rackspaceIO.upload(imagef, files.image[0].originalFilename, function(err, result, url) {
			db.asteroids.upload(fields.title[0], [{
				src: url,
				contentType: files.image[0].headers["content-type"],
				resolution: {}
			}], fields.description[0]).then(function (result) {
				res.redirect("/pic/"+result.id+"?m=u");
			}, function (err) {
				console.log(err);
				res.send("Error: " + JSON.stringify(err), 500);
			});
		});
	});
});

db.asteroids.query.getLatest(600).then(function() {
	global.results = arguments;
	http.createServer(app).listen(app.get('port'), function(){
	  console.log('Express server listening on port ' + app.get('port'));
	});
});