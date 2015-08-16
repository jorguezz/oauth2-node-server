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
* [oauth2orize](#oauth2orize)
* [Register authorization code grant type](auth-grant-type)
* [Exchange username & password for an access token](auth-exchange-username-ac)
* [Exchange authorization codes for access tokens](auth-exchange-codes-ac)
* [Exchange refreshToken for an access token](#refresh-token)

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

#### models/user.js
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

```javascript
passport.use('bearer', new BearerStrategy(
    function(accessToken, callback) {
        AccessToken.findOne({
            token: accessToken
        }, function(err, token) {
            if (err) {
                return callback(err);
            }

            // No token found
            if (!token) {
                return callback(null, false);
            }

            // Check token expiration
            if (Math.round((Date.now() - token.created) / 1000) > config.security.tokenLife) {
                AccessToken.remove({
                    token: accessToken
                }, function(err) {
                    if (err) return callback(err);
                });
                return callback(null, false, {
                    message: 'AccessToken expired'
                });
            }

            User.findOne({
                _id: token.userId
            }, function(err, user) {
                if (err) {
                    return callback(err);
                }

                // No user found
                if (!user) {
                    return callback(null, false);
                }

                // Simple example with no scope
                callback(null, user, {
                    scope: '*'
                });
            });
        });
    }
));

exports.isBearerAuthenticated = passport.authenticate('bearer', {
    session: false
});

exports.isAuthenticated = passport.authenticate(['basic', 'bearer'], {
    session: false
});
```

## oauth2orize
[[Back To Top]](#jump-to-section)

> OAuth2orize is an authorization server toolkit for Node.js. It provides a suite of middleware that, combined with Passport authentication strategies and application-specific route handlers, can be used to assemble a server that implements the OAuth 2.0 protocol. [More info](https://github.com/jaredhanson/oauth2orize)

### Register authorization code grant type
[[Back To Top]](#jump-to-section)

```javascript
server.grant(oauth2orize.grant.code(function(client, redirectUri, user, ares, callback) {
    // Create a new authorization code
    var code = crypto.randomBytes(32).toString('hex');
    var code = new Code({
        value: code,
        clientId: client._id,
        redirectUri: redirectUri,
        userId: user._id
    });

    // Save the auth code and check for errors
    code.save(function(err) {
        if (err) {
            return callback(err);
        }
        callback(null, code.value);
    });
}));
```

### Exchange username & password for an access token
[[Back To Top]](#jump-to-section)

```javascript
server.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done) {
    User.findOne({
        username: username
    }, function(err, user) {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false);
        }

        // Make sure the password is correct
        user.verifyPassword(password, function(err, isMatch) {
            if (err) {
                return done(err, false);
            }

            // Password did not match
            if (!isMatch) {
                return done(null, false);
            }

            RefreshToken.remove({
                userId: user._id,
                clientId: client._id
            }, function(err) {
                if (err) return done(err);
            });

            AccessToken.remove({
                userId: user._id,
                clientId: client._id
            }, function(err) {
                if (err) return done(err);
            });

            var tokenValue = crypto.randomBytes(128).toString('hex');
            var refreshTokenValue = crypto.randomBytes(128).toString('hex');

            var token = new AccessToken({
                token: tokenValue,
                clientId: client._id,
                userId: user._id
            });

            var refreshToken = new RefreshToken({
                token: refreshTokenValue,
                clientId: client._id,
                userId: user._id
            });

            refreshToken.save(function(err) {
                if (err) {
                    return done(err);
                }
            });

            token.save(function(err, token) {
                if (err) {
                    return done(err);
                }
                done(null, tokenValue, refreshTokenValue, {
                    'expires_in': config.security.tokenLife
                });
            });

        });
    });
}));
```


### Exchange authorization codes for access tokens]
[[Back To Top]](#jump-to-section)

```javascript
server.exchange(oauth2orize.exchange.code(function(client, code, redirectUri, callback) {
    Code.findOne({
        value: code
    }, function(err, authCode) {
        if (err) {
            return callback(err);
        }
        if (authCode === undefined) {
            return callback(null, false);
        }
        if (client._id.toString() !== authCode.clientId) {
            return callback(null, false);
        }
        if (redirectUri !== authCode.redirectUri) {
            return callback(null, false);
        }

        // Delete auth code now that it has been used
        authCode.remove(function(err) {
            if (err) {
                return callback(err);
            }

            var tokenValue = crypto.randomBytes(128).toString('hex');

            // Create a new access token
            var token = new AccessToken({
                token: tokenValue,
                clientId: authCode.clientId,
                userId: authCode.userId
            });

            var refreshTokenValue = crypto.randomBytes(128).toString('hex');
            var refreshToken = new RefreshToken({
                token: refreshTokenValue,
                clientId: authCode.clientId,
                userId: authCode.userId
            });

            refreshToken.save(function(err) {
                if (err) {
                    return callback(err);
                }
            });

            token.save(function(err, token) {
                if (err) {
                    return callback(err);
                }
                callback(null, tokenValue, refreshTokenValue, {
                    'expires_in': config.security.tokenLife
                });
            });
        });
    });
}));
```

### Exchange refreshToken for an access token]
[[Back To Top]](#jump-to-section)

```javascript
server.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, scope, done) {
    RefreshToken.findOne({
        token: refreshToken
    }, function(err, token) {
        if (err) {
            return done(err);
        }
        if (!token) {
            return done(null, false);
        }

        User.findById(token.userId, function(err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false);
            }

            // Remove RefreshToken
            RefreshToken.remove({
                userId: token.userId,
                clientId: token.clientId
            }, function(err) {
                if (err) {
                    return done(err);
                }
            });

            // Remove AccessToken
            AccessToken.remove({
                userId: token.userId,
                clientId: token.clientId
            }, function(err) {
                if (err) {
                    return done(err);
                }
            });

            var tokenValue = crypto.randomBytes(128).toString('hex');
            var refreshTokenValue = crypto.randomBytes(128).toString('hex');

            // New AccessToken instance
            var newtoken = new AccessToken({
                token: tokenValue,
                clientId: token.clientId,
                userId: token.userId
            });

            // New AccessToken instance
            var newRefreshToken = new RefreshToken({
                token: refreshTokenValue,
                clientId: token.clientId,
                userId: token.userId
            });

            // Save new RefreshToken
            newRefreshToken.save(function(err) {
                if (err) {
                    return done(err);
                }
            });

            // Save new AccessToken
            newtoken.save(function(err, token) {
                if (err) {
                    return done(err);
                }

                done(null, tokenValue, refreshTokenValue, {
                    'expires_in': config.security.tokenLife
                });
            });
        });
    });
}));
```