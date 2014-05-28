/**
* POST
*/
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