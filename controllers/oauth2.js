var oauth2orize = require('oauth2orize')
var User = require('../models/user');
var Client = require('../models/client');
var Code = require('../models/code');
var AccessToken = require('../models/access_token');
var RefreshToken = require('../models/refresh_token');
var config = require('../config/config');
var crypto = require('crypto');

var server = oauth2orize.createServer();

// Register serialialization function
server.serializeClient(function(client, callback) {
    return callback(null, client._id);
});

// Register deserialization function
server.deserializeClient(function(id, callback) {
    Client.findOne({
        _id: id
    }, function(err, client) {
        if (err) {
            return callback(err);
        }
        return callback(null, client);
    });
});


// Register authorization code grant type
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

// Exchange username & password for an access token.
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
                userId: user.userId,
                clientId: client.clientId
            }, function(err) {
                if (err) return done(err);
            });

            AccessToken.remove({
                userId: user.userId,
                clientId: client.clientId
            }, function(err) {
                if (err) return done(err);
            });

            var tokenValue = crypto.randomBytes(128).toString('hex');
            var refreshTokenValue = crypto.randomBytes(128).toString('hex');

            var token = new AccessToken({
                token: tokenValue,
                clientId: client.clientId,
                userId: user.userId
            });

            var refreshToken = new RefreshToken({
                token: refreshTokenValue,
                clientId: client.clientId,
                userId: user.userId
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


// Exchange authorization codes for access tokens
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


// Exchange refreshToken for an access token.
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


// User authorization endpoint
exports.authorization = [
    server.authorization(function(clientId, redirectUri, callback) {
        Client.findOne({
            id: clientId
        }, function(err, client) {
            if (err) {
                return callback(err);
            }

            return callback(null, client, redirectUri);
        });
    }),
    function(req, res) {
        res.render('dialog', {
            transactionID: req.oauth2.transactionID,
            user: req.user,
            client: req.oauth2.client
        });
    }
];

// User decision endpoint
exports.decision = [
    server.decision()
];

// Application client token exchange endpoint
exports.token = [
    server.token(),
    server.errorHandler()
];