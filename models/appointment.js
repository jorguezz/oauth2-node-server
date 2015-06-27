var mongoose = require('mongoose');

// Define our appointment schema
var AppointmentSchema = new mongoose.Schema({
    title: String,
    start: Date,
    end: Date,
    state: {
        type: String,
        "enum": ['pending', 'completed', 'canceled'],
        required: false
    },
    created: {
        type: Date,
        "default": Date.now
    },
    updated: {
        type: Date,
        "default": Date.now
    }
});

// Export the Mongoose model
module.exports = mongoose.model('Appointment', AppointmentSchema);