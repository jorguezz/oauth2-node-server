var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

// Define our client schema
var ClientSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    id: {
        type: String,
        required: true
    },
    secret: { // TODO bcrypt
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    }
});


// Export the Mongoose model
module.exports = mongoose.model('Client', ClientSchema);