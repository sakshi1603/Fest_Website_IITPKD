var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    
        name: String,
        email: String,
        username: String,
        pass: String,
        repass: String,
        college_name: String,
        resetPasswordToken: String,
        resetPasswordExpires: Date
    
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);