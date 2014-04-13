
/**
 * Module dependencies.
 */

//var db =  monk('localhost:27017/test');
var express = require('express');
var http = require('http');
var mongo = require('mongodb');
var monk = require('monk');
var path = require('path');
var routes = require('./routes');
var user = require('./routes/user');
var Parse = require('parse').Parse;
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/:view', function(req, res) {
    res.render(req.params.view, { title: 'Pictroid' });
});
app.get('/user/:name', function(req, res) {
    res.render('user', { username: req.params.name });
});
app.get('/user/:name/settings', function(req, res) {
	// Code to authorize
    res.render('settings', { });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
