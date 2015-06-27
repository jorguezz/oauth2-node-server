var Appointment = require('../models/appointment');

// Create endpoint /api/appointments for POSTS
exports.postAppointments = function(req, res) {
    // Create a new instance of the Appointment model
    var appointment = new Appointment();

    // Set the appintment properties that came from the POST data
    appointment.title = req.body.title;
    appointment.start = req.body.start;
    appointment.end = req.body.end;
    appointment.state = req.body.state;

    // Save the appointment and check for errors
    appointment.save(function(err) {
        if (err)
            res.send(err);

        res.json({
            message: 'Appointment added!',
            data: appointment
        });
    });
};


// Create endpoint /api/appointments for GET
exports.getAppointments = function(req, res) {
    // Use the Appointment model to find all appointments
    Appointment.find(function(err, appointments) {
        if (err)
            res.send(err);

        res.json(appointments);
    });
};


// Create endpoint /api/appointments/:id for GET
exports.getAppointment = function(req, res) {
    // Use the Appointment model to find a specific appointment
    Appointment.findById(req.params.id, function(err, appointment) {
        if (err)
            res.send(err);
        res.json(appointment);
    });
};


// Create endpoint /api/appointments/:id for PUT
exports.putAppointment = function(req, res) {
    // Use the Appointment model to find a specific appointment
    Appointment.findById(req.params.id, function(err, appointment) {
        if (err)
            res.send(err);

        // Update the existing appointment state
        appointment.state = req.body.state;

        // Save the appointment and check for errors
        appointment.save(function(err) {
            if (err)
                res.send(err);

            res.json(appointment);
        });
    });
};

exports.deleteAppointment = function(req, res) {
    // Use the Appointment model to find a specific appointment and remove it
    Appointment.findByIdAndRemove(req.params.id, function(err) {
        if (err)
            res.send(err);

        res.json({
            message: 'Appointment removed!'
        });
    });
};