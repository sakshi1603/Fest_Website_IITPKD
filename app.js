var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var Joi = require("joi"); // This module could be used for evaluating user input
var passport = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var User = require("./models/user.js");


mongoose.connect("mongodb://localhost/website", {useNewUrlParser: true});
mongoose.set('useCreateIndex', true);

app.use(bodyParser.urlencoded({extended: true}));
app.use(require("express-session")({
    secret: "It's a secret code",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

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





app.post("/addUser", (req, res)=>{
    
    var inputSchema = Joi.object().keys({   // creating a schema with which to evaluate the user input
        name: Joi.string().required(),
        email: Joi.string().trim().email().required(),
        username: Joi.string().required(),
        password: Joi.string().required(),
        repass: Joi.string().required(),
        college_name: Joi.string().required()
    });
    
    Joi.validate(req.body, inputSchema, (error, result)=>{ // This will evaluate it
        if(error)
        {
            res.send("Some error has occurred");
            console.log(error);
        }
        else
        {
            console.log(result);
            User.register(new User({name: result.name, email: result.email, username: result.username, college_name: result.college_name}), result.password, function(err, user){
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

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

app.listen(process.env.PORT, process.env.IP,function(){
    console.log("Server is running!!!");
});