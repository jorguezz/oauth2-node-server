var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');

mongoose.connect('mongodb://localhost:27017/dbmyapp');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Use the passport package in our application

// Use express session support since OAuth2orize requires it
app.use(session({
    secret: 'my-secret-key',
    saveUninitialized: true,
    resave: true
}));

app.use(passport.initialize());

var authController = require('./controllers/auth');
var appointmentController = require('./controllers/appointment');
var userController = require('./controllers/user');
var clientController = require('./controllers/client');
var oauth2Controller = require('./controllers/oauth2');

// Create our Express router
var router = express.Router();

router.route('/appointments')
    .post(authController.isAuthenticated, appointmentController.postAppointments)
    .get(authController.isAuthenticated, appointmentController.getAppointments);

router.route('/appointments/:id')
    .get(authController.isAuthenticated, appointmentController.getAppointment)
    .put(authController.isAuthenticated, appointmentController.putAppointment)
    .delete(authController.isAuthenticated, appointmentController.deleteAppointment);

router.route('/users')
    .post(userController.postUsers)
    .get(authController.isAuthenticated, userController.getUsers);

router.route('/clients')
    .post(authController.isAuthenticated, clientController.postClients)
    .get(authController.isAuthenticated, clientController.getClients);

// Create endpoint handlers for oauth2 authorize
router.route('/oauth2/authorize')
    .get(authController.isAuthenticated, oauth2Controller.authorization) // TODO login template with localStrategy
.post(authController.isAuthenticated, oauth2Controller.decision);

// Create endpoint handlers for oauth2 token
router.route('/oauth2/token')
    .post(authController.isClientAuthenticated, oauth2Controller.token);


app.use('/api', router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;