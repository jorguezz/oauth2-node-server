# OAuth2-node-server
> Allowing access to API endpoints for the authorized user or authorized applications with Oauth2-Server.

## Jump to Section

* [Quickstart](#quickstart)
* [What's included](#what's-included)
* [Usage](#usage)
* [Our first endpoint]('#api-endpoint')
* [Passport](#passport)
* [Basic Authentication](#basic-auth)
* [Local Authentication](#local-auth)
* [Bearer Authentication](#bearer-auth)
* [Authenticate an application client](#auth-client)
* [Bearer Authentication](#bearer-auth)
* [oauth2orize](#oauth2orize)
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

#### models/appointment.js
```javascript
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

// Define our user schema
var UserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

// Execute before each user.save() call
UserSchema.pre('save', function(callback) {
    var user = this;

    // Break out if the password hasn't changed
    if (!user.isModified('password')) return callback();

    // Password changed so we need to hash it
    bcrypt.genSalt(5, function(err, salt) {
        if (err) return callback(err);

        bcrypt.hash(user.password, salt, null, function(err, hash) {
            if (err) return callback(err);
            user.password = hash;
            callback();
        });
    });
});

UserSchema.methods.verifyPassword = function(password, cb) {
    bcrypt.compare(password, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);
```


## Passport
[[Back To Top]](#jump-to-section)

> Simple, unobtrusive authentication for Node.js 

> [Passport](http://passportjs.org/)
 is authentication middleware for Node.js. Extremely flexible and modular, Passport can be unobtrusively dropped in to any Express-based web application. A comprehensive set of strategies support authentication using a username and password, Facebook, Twitter, and more. 


## Basic Authentication
[[Back To Top]](#jump-to-section)

> The Basic scheme uses a username and password to authenticate a user. These credentials are transported in plain text, so it is advised to use HTTPS when implementing this scheme.

```javascript
var User = require('../models/user');

passport.use('basic', new BasicStrategy(
    function(username, password, callback) {
        User.findOne({
            username: username
        }, function(err, user) {
            if (err) {
                return callback(err);
            }
            // No user found with that username
            if (!user) {
                return callback(null, false);
            }
            // Make sure the password is correct
            user.verifyPassword(password, function(err, isMatch) {
                if (err) {
                    return callback(err);
                }
                // Password did not match
                if (!isMatch) {
                    return callback(null, false);
                }
                // Success
                return callback(null, user);
            });
        });
    }
));
```

## Local Authentication
[[Back To Top]](#jump-to-section)

> The most widely used way for websites to authenticate users is via a username and password. Support for this mechanism is provided by the passport-local module.

```javascript
passport.use('local', new LocalStrategy(
    function(username, password, callback) {
        User.findOne({
            username: username
        }, function(err, user) {
            if (err) {
                return callback(err);
            }
            // No user found with that username
            if (!user) {
                return callback(null, false);
            }
            // Make sure the password is correct
            user.verifyPassword(password, function(err, isMatch) {
                if (err) {
                    return callback(err);
                }
                // Password did not match
                if (!isMatch) {
                    return callback(null, false);
                }
                // Success
                return callback(null, user);
            });
        });
    }
));
```

## Bearer Authentication
[[Back To Top]](#jump-to-section)

> OAuth 2.0 provides a framework, in which an arbitrarily extensible set of token types can be issued. In practice, only specific token types have gained widespread use.

> Bearer tokens are the most widely issued type of token in OAuth 2.0. So much so, in fact, that many implementations assume that bearer tokens are the only type of token issued.

> Bearer tokens can be authenticated using the passport-http-bearer module.

## Authenticate an application client
[[Back To Top]](#jump-to-section)

## oauth2orize
[[Back To Top]](#jump-to-section)

## Exchange authorization code for accesstoken
[[Back To Top]](#jump-to-section)

## RefreshToken
[[Back To Top]](#jump-to-section)
