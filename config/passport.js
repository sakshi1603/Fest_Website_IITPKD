var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var User            = require('../models/user');
var configAuth = require('./auth');
var randomstring = require("randomstring");
var nodemailer = require("nodemailer");
var async = require("async");



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
	    				newUser.notifications = ["Please update your profile in the profile section."]

	    				newUser.save(function(err){
	    					if(err)
	    						console.log(err);
                    async.waterfall([function(){
                    var smtpTransport = nodemailer.createTransport({
                      service: 'Gmail', 
                      secure: false,
                      auth: {
                        user: '111701013@smail.iitpkd.ac.in',
                        pass: 'durga@B90'
                      }
                    });
                    var mailOptions = {
                      to: newUser.email,
                      from: '111701013@smail.iitpkd.ac.in',
                      subject: 'IIT-PKD Petrichor',
                      text: 'Dear ' + newUser.name + ',\n\nThank you for registering with us.\n\nYour Petrichor Token ID is ' + 
                              newUser.registerToken + '. Please make a note of this for future reference.\n\nThanks for showing interest in ' + 
                              'Petrichor 2020. Stay tuned for more updates.'
                    };
                    smtpTransport.sendMail(mailOptions);
                  }]);
	    					return done(null, newUser);
	    				})
	    			}
	    		});
	    	});
	    }

	));


	


};