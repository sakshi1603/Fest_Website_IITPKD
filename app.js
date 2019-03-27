var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var Joi = require("joi"); // This module could be used for evaluating user input

mongoose.connect("mongodb://localhost/website");

app.use(bodyParser.urlencoded({extended: true}));

app.get("/", function(req,res){
   res.render("home.ejs"); 
});

app.get("/signup", function(req,res){
    res.render("signup.ejs");
});

app.post("/addUser", (req, res)=>{
    
    var inputSchema = Joi.object().keys({   // creating a schema with which to evaluate the user input
        name: Joi.string().required(),
        email: Joi.string().trim().email().required(),
        pass: Joi.string().required(),
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
            ///////// Do the database work here ///////////
        }
    });
});

app.listen(process.env.PORT, process.env.IP,function(){
    console.log("Server is running!!!")
});