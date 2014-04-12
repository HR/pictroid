
/*
 * GET home page.
 */

// Simple syntax to create a new subclass of Parse.Object.
var GameScore = Parse.Object.extend("GameScore");
 
// Create a new instance of that class.
var gameScore = new GameScore();
 
// Alternatively, you can use the typical Backbone syntax.
var Achievement = Parse.Object.extend({
  className: "Achievement"
});

exports.index = function(req, res){
  res.render('index', { title: 'Pictroid' });
};