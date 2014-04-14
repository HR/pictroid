// Sign up
exports.signup = function (username, password, email, res) {
	var Parse = require('parse').Parse;
	Parse.initialize(process.env.parseID, process.env.parseJavascriptKey, process.env.parseMasterKey);

	var user = new Parse.User();

	user.set("username", username);
	user.set("password", password);
	user.set("email", email);

	user.signUp(null, {
		success: function(user) {
			// Redirect to profile page
			res.setHeader('Location', '/user/'+user.username);
		},
		error: function(user, error) {
			// Show the error message somewhere and let the user try again.
			console.log("Error: " + error.code + " " + error.message);
		}
	});
};