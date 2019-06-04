var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var User            = require('../models/user');
var configAuth = require('./auth');
var randomstring = require("randomstring");
module.exports = function(passport) {
    
    passport.serializeUser(function(user, done){
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done){
		User.findById(id, function(err, user){
			done(err, user);
		});
	});
	
	
    passport.use(new GoogleStrategy({
	    clientID: configAuth.googleAuth.clientID,
	    clientSecret: configAuth.googleAuth.clientSecret,
	    callbackURL: configAuth.googleAuth.callbackURL
	  },
	  function(accessToken, refreshToken, profile, done) {
	    	process.nextTick(function(){
	    		User.findOne({'email': profile.emails[0].value}, function(err, user){
	    			if(err)
	    				return done(err);
	    			if(user)
	    				return done(null, user);
	    			else {
	    				var newUser = new User();
	    				newUser.name = profile.displayName;
	    				newUser.email = profile.emails[0].value;
	    				newUser.registerToken = String(randomstring.generate(7));

	    				newUser.save(function(err){
	    					if(err)
	    						console.log(err);
	    					return done(null, newUser);
	    				})
	    				console.log("DOne!!!")
	    				console.log(profile);
	    			}
	    		});
	    	});
	    }

	));


	


};