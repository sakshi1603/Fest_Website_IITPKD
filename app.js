var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var Joi = require("joi"); // This module could be used for evaluating user input
var passport = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var User = require("./models/user.js");
var SHA256 = require("crypto-js/sha256");
var mongo = require("mongodb").MongoClient;


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
   console.log(User.find({username: "recursed"}));
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
            User.register(new User({name: result.name, email: result.email, username: result.username, college_name: result.college_name, password: SHA256(result.password)}), function(err, user){
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
                    //////// give user the password via mail......
                    console.log(item);
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