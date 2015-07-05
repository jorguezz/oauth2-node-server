var passport = require('passport');
var BearerStrategy = require('passport-http-bearer').Strategy
var BasicStrategy = require('passport-http').BasicStrategy;
var LocalStrategy = require('passport-local').Strategy;
var AccessToken = require('../models/access_token');
var User = require('../models/user');
var Client = require('../models/client');

var config = require('../config/config');

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


passport.use('client-basic', new BasicStrategy(
    function(username, password, callback) {
        Client.findOne({
            id: username
        }, function(err, client) {
            if (err) {
                return callback(err);
            }

            // No client found with that id or bad password
            if (!client || client.secret !== password) {
                return callback(null, false);
            }

            // Success
            return callback(null, client);
        });
    }
));


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

exports.isClientAuthenticated = passport.authenticate('client-basic', {
    session: false
});

exports.isAuthenticated = passport.authenticate(['basic', 'bearer'], {
    session: false
});