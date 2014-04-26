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

exports.signin = function (username, password, res) {
	var Parse = require('parse').Parse;
	Parse.initialize(process.env.parseID, process.env.parseJavascriptKey, process.env.parseMasterKey);
	Parse.User.logIn(username, password, {
	  success: function(user) {
	    // Do stuff after successful login.
	    res.setHeader('Location', '/');
	  },
	  error: function(user, error) {
	    // The login failed. Check error to see why.
	    console.log("Error: " + error.code + " " + error.message);
	  }
	});
}

module.exports = function csrf(options) {
  options = options || {};
  var value = options.value || defaultValue;

  return function(req, res, next){
    
    // already have one
    var secret = req.session._csrfSecret;
    if (secret) return createToken(secret);

    // generate secret
    uid(24, function(err, secret){
      if (err) return next(err);
      req.session._csrfSecret = secret;
      createToken(secret);
    });
    
    // generate the token
    function createToken(secret) {
      var token;

      // lazy-load token
      req.csrfToken = function csrfToken() {
        return token || (token = saltedToken(secret));
      };
      
      // compatibility with old middleware
      Object.defineProperty(req.session, '_csrf', {
        configurable: true,
        get: function() {
          console.warn('req.session._csrf is deprecated, use req.csrfToken() instead');
          return req.csrfToken();
        }
      });
      
      // ignore these methods
      if ('GET' == req.method || 'HEAD' == req.method || 'OPTIONS' == req.method) return next();
      
      // determine user-submitted value
      var val = value(req);
      
      // check
      if (!checkToken(val, secret)) return next(utils.error(403));
      
      next();
    }
  }
};