var mongoose = require("mongoose");
// var passportLocalMongoose = require("passport-local-mongoose");

var updates = new mongoose.Schema({

        updates: []
    
});

// updates.plugin(passportLocalMongoose);

module.exports = mongoose.model("updates", updates);