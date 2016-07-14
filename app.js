"use strict";
const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const ExpressValidator = require('express-validator');
const mongoose = require('mongoose');
const authenticate_1 = require('./routes/authenticate');
const users_1 = require('./routes/users');
const videos_1 = require('./routes/videos');
var Play;
(function (Play) {
    'use strict';
    Play.app = express();
    // view engine setup
    // app.set('views', path.join(__dirname, 'views'));
    Play.app.set('view engine', 'jade');
    // uncomment after placing your favicon in /public
    // app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
    Play.app.use(logger('dev'));
    // use bodyParser middleware to decode json parameters
    Play.app.use(bodyParser.json());
    Play.app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
    // use bodyParser middleware to decode urlencoded parameters
    Play.app.use(bodyParser.urlencoded({ extended: false }));
    Play.app.use(ExpressValidator());
    // use cookieParser to extract cookie information from request
    Play.app.use(cookieParser());
    Play.app.use(express.static(path.join(__dirname, 'public')));
    const corsHeaders = {
        'Access-Control-Allow-Origin': 'http://localhost:4200',
        'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Headers': 'X-Requested-With, Access-Control-Allow-Origin, X-HTTP-Method-Override,' +
            ' Content-Type, Authorization, Accept, x-access-token'
    };
    Play.app.options('*', function (req, res, next) {
        res.set(corsHeaders).end();
    });
    Play.app.use(function (req, res, next) {
        res.set(corsHeaders);
        next();
    });
    let dbReady = false;
    mongoose.connect('mongodb://localhost:27017/play', (error) => {
        dbReady = true;
    });
    Play.app.use((req, res, next) => {
        if (dbReady) {
            next();
        }
        else {
            next(new Error('there is no DB connection!'));
        }
    });
    Play.app.use('/authenticate', authenticate_1.router);
    Play.app.use('/videos', videos_1.router);
    Play.app.use('/users', users_1.router);
    let err;
    // catch 404 and forward to error handler
    Play.app.use(function (req, res, next) {
        err = new Error('Not Found');
        err.status = 404;
        next(err);
    });
    // error handlers
    // development error handler
    // will print stacktrace
    if (Play.app.get('env') === 'development') {
        Play.app.use(function (req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                error: err,
                message: err.message
            });
        });
    }
    // production error handler
    // no stacktraces leaked to user
    Play.app.use(function (req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            error: {},
            message: err.message
        });
    });
})(Play || (Play = {}));
module.exports = Play.app;
//# sourceMappingURL=app.js.map