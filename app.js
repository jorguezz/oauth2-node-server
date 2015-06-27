var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

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




// Create our Express router
var router = express.Router();

var appointmentController = require('./controllers/appointment');
var userController = require('./controllers/user');

// Create endpoint handlers for /appointments
router.route('/appointments')
    .post(appointmentController.postAppointments)
    .get(appointmentController.getAppointments);

// Create endpoint handlers for /appointments/:id
router.route('/appointments/:id')
    .get(appointmentController.getAppointment)
    .put(appointmentController.putAppointment)
    .delete(appointmentController.deleteAppointment);

// Create endpoint handlers for /users
router.route('/users')
    .post(userController.postUsers)
    .get(userController.getUsers);


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