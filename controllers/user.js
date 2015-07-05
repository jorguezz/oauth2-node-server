// Load required packages
var User = require('../models/user');

// Create endpoint /api/users for POST
exports.postUsers = function(req, res) {
    // TODO use JWT
    var user = new User({
        username: req.body.username,
        password: req.body.password
    });

    user.save(function(err) {
        if (err)
            res.send(err);

        res.json({
            message: 'New user added '
        });
    });
};

// Create endpoint /api/users for GET
exports.getUsers = function(req, res) {
    User.find(function(err, users) {
        if (err)
            res.send(err);

        // TODO omit password field
        res.json(users);
    });
};

// Create endpoint /api/users/:id for GET
exports.getUser = function(req, res) {
    User.findById(req.params.id, function(err, user) {
        if (err)
            res.send(err);

        if (!user) {
            return res.status(404).send('Invalid userId');
        }

        // TODO omit password field
        res.json(user);
    });
};


exports.userInfo = function(req, res) {
    // req.authInfo is set using the `info` argument supplied by
    // `BearerStrategy`.  It is typically used to indicate a scope of the token,
    // and used in access control checks.  For illustrative purposes, this
    // example simply returns the scope in the response.
    res.json({
        user_id: req.user._id,
        name: req.user.username,
        scope: req.authInfo.scope
    });
};