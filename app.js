var express = require("express");
var app = express();
var mongoose = require("mongoose");
var morgan = require("morgan");
var flash = require("connect-flash");
var bodyParser = require("body-parser");
var Joi = require("joi"); // This module could be used for evaluating user input
var passport = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var User = require("./models/user.js");
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var mongo = require("mongodb").MongoClient;
var cookieParser = require("cookie-parser");
var nodemailer = require("nodemailer");

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
    res.render("account.ejs");
});

app.get("/signup", function(req,res){
    res.render("signup.ejs");
});

app.get('/auth/google', passport.authenticate('google', {scope: ['profile', 'email']}));

app.get('/auth/google/callback', 
  passport.authenticate('google', { successRedirect: '/account',
	                                      failureRedirect: '/' }));

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
            res.send("Some error has occurred");
            console.log(error);
        }
        else if(result.password != result.repass)
        {
            res.send("Enter the same pass in pass and respass");
        }
        else
        {
            console.log(result);
            var pass_hash = bcrypt.hashSync(result.password, 10);
            User.register(new User({name: result.name, email: result.email, username: result.username, college_name: result.college_name, password: pass_hash}), result.password, function(err, user){
                if(err){
                    console.log(err);
                    return res.render('signup.ejs');
                }
                passport.authenticate("local")(req, res, function(){
                     res.redirect("/signup");
                });
            });
        }
    });
});

app.get("/login", function(req, res){
   res.render("login.ejs"); 
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/account",
    failureRedirect: "/login"
}) ,function(req, res){
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

app.get('/forgot_pass', (req, res)=>{
    res.render('forgot_pass.ejs');
});


app.post('/send_pass', (req, res)=>{
    mongo.connect('mongodb://localhost/website', (error, client)=>{
        if(error)
        {
            console.log(error);
        }
        else
        {
            var db = client.db('website');
            var collection = db.collection('users');
            
            collection.findOne({username : req.body.username, email : req.body.email}, (err, item)=>{
                if(err)
                {
                    res.send("invalid username and email pair");
                }
                else
                {
                    var new_pass = crypto.randomBytes(64).toString('hex');
                    console.log(item);
                    console.log(new_pass);
                    var new_pass_hash = bcrypt.hashSync(new_pass, 10);
                    collection.updateOne({username : req.body.username, email: req.body.email}, {password: new_pass_hash}, (err2, item2)=>{
                        if(err2)
                        {
                            res.send("Password could not be update for some reason");
                        }
                        else
                        {
                            console.log(item2);
                            
                            
                            var transporter = nodemailer.createTransport({
                                service: 'gmail',
                                auth: {
                                    user: 'the.bus.app.project@gmail.com',
                                    pass: 'thebusapp'
                                }
                            });
                            
                            var mailOptions = {
                                from: 'the.bus.app.project@gmail.com',
                                to: req.body.email,
                                subject: 'forgot password.....',
                                text: 'your new password is: ' + new_pass
                            };
                            
                            transporter.sendMail(mailOptions, (err3, info)=>{
                                if(err3)
                                    console.log(err3);
                                else
                                {
                                    console.log('mail sent: ' + info.response);
                                }
                                
                            });
                            
                            
                        }
                    });
                }
            });
        }
        
        client.close(); // close the connection
    });
    
    
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