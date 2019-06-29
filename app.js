var express = require("express");
var app = express();
var randomstring = require('randomstring');
var mongoose = require("mongoose");
var morgan = require("morgan");
var flash = require("connect-flash");
var bodyParser = require("body-parser");
var Joi = require("joi"); // This module could be used for evaluating user input
var passport = require("passport");
var LocalStrategy = require("passport-local");
var User = require("./models/user");  
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var cookieParser = require("cookie-parser");
var nodemailer = require("nodemailer");       // made by the great head himanshu jain and the team .... Devansh Satchit Ahmed.....   :-)  lovely.... awesome ... ofcourse me!
var async = require("async");
var updates = require("./models/updates");

require('./config/passport')(passport);


mongoose.connect("mongodb://localhost/website", {useNewUrlParser: true});
mongoose.set('useCreateIndex', true);

app.use(morgan('dev'));
app.use(cookieParser());

app.use(bodyParser.urlencoded({extended: true}));
app.use(require("express-session")({
    secret: "It's a secret code",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req,res){
   res.render("home.ejs");
});


app.get("/account", isLoggedIn, function(req,res){
  updates.findOne({}, function(err, updates) {
    if(err) {
      console.log("some error has occured");
      res.render('home.ejs');
    } else  {
      console.log(updates);
      res.render("account.ejs", { user: req.user, updates: updates.updates });
    }
  })
    
});

app.get("/signup", function(req,res){
    res.render("signup.ejs", {message:""});
});

app.get("/account/registrations", isLoggedIn, function(req,res){
  res.render("registrations.ejs", {user: req.user});
});


// app.get("/account/profile", function(req, res) {
//     res.render("profile.ejs");
// });

app.get('/auth/google', passport.authenticate('google', {scope: ['profile', 'email']}));

app.get('/auth/google/callback', 
  passport.authenticate('google', { successRedirect: '/account',
	                                      failureRedirect: '/' }));
	                                      
app.post("/updateProfile", (req, res) => {
  
  User.findOne({ username: req.body.username }, function(err,user){
        if(err) {
          res.send(err);
        }
        else if(user && user.username!=req.body.username) {
          // req.body.username = "";
          res.render('user.ejs', { message: "This username is already taken", user });
          // return;
        } else {
          User.findOne({ email: req.body.email }, function(err,user) {
    if(err) {
      res.send("Some error has occured");
      console.log(err);
    }
    if(user) {
      user.college_name = req.body.college_name;
      user.username = req.body.username;
      user.name = req.body.name;
      user.address = req.body.address;
      user.phoneNumber = req.body.phoneNumber;
      user.city = req.body.city;
      user.country = req.body.country;
      user.aboutMe = req.body.aboutMe;
      if(user.notifications[0]=="Please update your profile in the profile section.") {
        user.notifications = user.notifications.slice(1,user.notifications.length);
      }
      
      
      
      user.save(function (err) {
        if(err) {
            console.log(err);
        }
        res.redirect("/account/profile");
      });
      console.log(user);
    }
  });
        }
      });
      
  
  
});
	                                      

app.post("/addUser", (req, res)=>{
    
    var inputSchema = Joi.object().keys({   // creating a schema with which to evaluate the user input
        name: Joi.string().required(),
        email: Joi.string().trim().email().required(),
        username: Joi.string().required(),
        password: Joi.string().min(6).max(14).required(),
        repass: Joi.string().min(6).max(14).required(),
        college_name: Joi.string().required()
    });
    
    Joi.validate(req.body, inputSchema, (error, result)=>{ // This will evaluate it
        if(error)
        {
            // res.send("Some error has occurred");
            console.log(error);
            res.render('signup.ejs', {message: "Password should be atleast 6 digit long"});
        }
        else if(result.password != result.repass)
        {
            // res.send("Enter the same pass in pass and respass");
            res.render('siginup.ejs', {message: "Please enter the same passwords"})
            console.log('here');
        }
        else
        {
          User.findOne({ email: result.email }, function(err, user) {
            if(err){
                console.log(err);
                res.redirect('/signup');
                return
            }
            if (user) {
              // req.flash('error', 'User with this email is already registered');
              res.render('signup.ejs', {message: "This email id already exists"});
            }
            else {
              User.findOne({ username: result.username }, function(err,user){
                if(err) {
                  console.log(err);
                  res.redirect('/signup');
                }
                else if(user) {
                  res.render('signup.ejs', {message: "This username is already taken"});
                  return;
                }
              });
              console.log(result);
              var pass_hash = bcrypt.hashSync(result.password, 10);
              var token = randomstring.generate(7);
              User.register(new User({name: result.name, email: result.email, registerToken:token, notifications: ["Please update your profile in the profile section."], username: result.username, college_name: result.college_name, password: pass_hash}), result.password, function(err, user){
                  if(err){
                      console.log(err);
                      res.render('signup.ejs', {message: "This username is already taken"});
                      return
                  }
                  passport.authenticate("local")(req, res, function(){
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
                      to: result.email,
                      from: '111701013@smail.iitpkd.ac.in',
                      subject: 'IIT-PKD Petrichor',
                      text: 'Dear ' + result.name + ',\n\nThank you for registering with us.\n\nYour Petrichor Token ID is ' + 
                              token + '. Please make a note of this for future reference.\n\nThanks for showing interest in ' + 
                              'Petrichor 2020. Stay tuned for more updates.'
                    };
                    smtpTransport.sendMail(mailOptions);
                       res.redirect("/account");
                  }])});
              });
            }
          });
        }
    });
});

app.get("/login", function(req, res){
   res.render("login.ejs", {login_failure: false}); 
});

app.get("/login_failed", function(req, res){
   res.render("login.ejs", {login_failure: true}); 
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/account",
    failureRedirect: "/login_failed"
}) ,function(req, res){
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

app.get('/forgot_pass', (req, res)=>{
    res.render('forgot_pass.ejs');
});

app.use(express.static("public"));

app.get('/forgot', function(req, res) {
  res.render('forgot_pass.ejs');
});

app.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if(err){
            console.log(err);
        }
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        // secure: false,
        auth: {
          user: '111701013@smail.iitpkd.ac.in',
          pass: 'durga@B90'
        }
      });
      var mailOptions = {
        to: user.email,
        from: '111701013@smail.iitpkd.ac.in',
        subject: 'Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

app.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if(err){
        console.log(err);
    }
    else if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset.ejs', {token: req.params.token});
  });
});

app.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if(err){
            console.log(err);
        }
        else if (!user) {
            console.log("Password reset token is invalid");
            console.log(req.params.token);
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
            console.log("entered");
          user.setPassword(req.body.password, function(err) {
            if(err){
                console.log(err);
            }
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
                if(err){
                    console.log(err);
                }
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          });
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('login.ejs');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'relations.petrichor@iitpkd.ac.in',
          pass: 'fest@iitpkd'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'relations.petrichor@iitpkd.ac.in',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
      if(err){
          console.log(err);
      }
    res.redirect('home.ejs');
  });
});


app.get('/account/profile', function(req, res) {
    
    if(req.user) //User logged in
    {
      User.findOne({email: req.user.email}, (err, user)=>{
        if(err)
        {
          console.log(err);
        }
        else
        {
          res.render('user.ejs', {message: "", user});
        }
      });
    }
    else
    {
      res.redirect('/login');
    }
});


function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

app.listen(process.env.PORT, process.env.IP,function(){
    console.log("Server is running!!!");
});