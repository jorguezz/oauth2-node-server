# OAuth2-node-server
> Allowing access to API endpoints for the authorized user or authorized applications with Oauth2-Server.

## Jump to Section

* [Quickstart](#quickstart)
* [What's included](#what's-included)
* [Usage](#usage)
* [Our first endpoint]('#api-endpoint')
* [Passport](#passport)
* [oauth2orize](#oauth2orize)
* [Basic Authentication](#basic-auth)
* [Local Authentication](#local-auth)
* [Bearer Authentication](#bearer-auth)
* [Authenticate an application client](#auth-client)
* [Bearer Authentication](#bearer-auth)
* [Exchange authorization code for accesstoken](#code-accesstoken)
* [RefreshToken](#refresh-token)

### Attention! 
> On production always use HTTPS

## Quickstart
[[Back To Top]](#jump-to-section)

> OAuth2-node-server is very easy to install and configure.

* [Install dependencies](https://www.npmjs.com/): `npm install`
* [Mongod is requied](https://www.mongodb.org/):  `mongod`

## What's included
[[Back To Top]](#jump-to-section)

    oauth2-node-server/
    ├── config/
    │   ├── config.json
    │   
    ├── controllers/
    │   ├── appointment.js
    │   ├── auth.js
    │   ├── client.js
    │   ├── oauth2.js
    │   ├── user.js
    │   
    ├── models/
    │   ├── access_token.js
    │   ├── appointment.js
    │   ├── client.js
    │   ├── code.js
    │   ├── refresh_token.js
    │   ├── user.js
    |
    ├──  node_modules/
    │
    └──  app.js



## Usage
[[Back To Top]](#jump-to-section)

> After downloading Oauth2-node-server, follow these simple steps to get started:

## Our first endpoint
[[Back To Top]](#jump-to-section)

### Api example api/appointments

```javascript
// Create our Express router
var router = express.Router();

router.route('/appointments')
    .post(authController.isAuthenticated, appointmentController.postAppointments)
    .get(authController.isAuthenticated, appointmentController.getAppointments);

router.route('/appointments/:id')
    .get(authController.isAuthenticated, appointmentController.getAppointment)
    .put(authController.isAuthenticated, appointmentController.putAppointment)
    .delete(authController.isAuthenticated, appointmentController.deleteAppointment);

app.use('/api', router);
```

#### models/appointment.js

```javascript
var AppointmentSchema = new mongoose.Schema({
    userId: String,
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
```

#### controllers/appointment.js

```javascript
// Example API controller
var Appointment = require('../models/appointment');

// Create endpoint /api/appointments for POSTS
exports.postAppointments = function(req, res) {
    // Create a new instance of the Appointment model
    var appointment = new Appointment();

    // Set the appointment properties that came from the POST data
    appointment.title = req.body.title;
    appointment.start = req.body.start;
    appointment.end = req.body.end;
    appointment.state = req.body.state;
    appointment.userId = req.user._id;

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
    Appointment.find({
        userId: req.user._id
    }, function(err, appointments) {
        if (err)
            res.send(err);

        res.json(appointments);
    });
};


// Create endpoint /api/appointments/:id for GET
exports.getAppointment = function(req, res) {
    // Use the Appointment model to find a specific appointment
    Appointment.find({
        userId: req.user._id,
        _id: req.params.id
    }, function(err, appointment) {
        if (err)
            res.send(err);
        res.json(appointment);
    });
};


// Create endpoint /api/appointments/:id for PUT
exports.putAppointment = function(req, res) {
    // Use the Appointment model to find a specific appointment
    Appointment.update({
        userId: req.user._id,
        _id: req.params.id
    }, {
        title: req.body.title,
        state: req.body.state,
        start: req.body.start,
        end: req.body.end
    }, function(err, num, raw) {
        if (err)
            res.send(err);

        res.json({
            message: num + ' updated'
        });
    });
};

exports.deleteAppointment = function(req, res) {
    // Use the Appointment model to find a specific appointment and remove it
    Appointment.remove({
        userId: req.user._id,
        _id: req.params.id
    }, function(err) {
        if (err)
            res.send(err);

        res.json({
            message: 'Appointment removed!'
        });
    });
};
```

## Passport
[[Back To Top]](#jump-to-section)

> Simple, unobtrusive authentication for Node.js 

> [Passport](http://passportjs.org/)
 is authentication middleware for Node.js. Extremely flexible and modular, Passport can be unobtrusively dropped in to any Express-based web application. A comprehensive set of strategies support authentication using a username and password, Facebook, Twitter, and more. 


## oauth2orize
[[Back To Top]](#jump-to-section)

## Basic Authentication
[[Back To Top]](#jump-to-section)

## Local Authentication
[[Back To Top]](#jump-to-section)

## Bearer Authentication
[[Back To Top]](#jump-to-section)

## Authenticate an application client
[[Back To Top]](#jump-to-section)

## Exchange authorization code for accesstoken
[[Back To Top]](#jump-to-section)

## RefreshToken
[[Back To Top]](#jump-to-section)
