import * as express from 'express';
import {Application, NextFunction, Response} from 'express';
import * as logger from 'morgan';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as path from 'path';
import ExpressValidator = require('express-validator');
import * as mongoose from 'mongoose';

import {IRequest} from './interfaces';
import {router as authenticateRoutes} from './routes/authenticate';
import {router as usersRoutes} from './routes/users';
import {router as videosRoutes} from './routes/videos';
import {dbName, dbHost} from "./config";

namespace Play {
  'use strict';

  export const app: Application = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
  app.use(logger('dev'));
// use bodyParser middleware to decode json parameters
  app.use(bodyParser.json());
  app.use(bodyParser.json({type: 'application/vnd.api+json'}));
// use bodyParser middleware to decode urlencoded parameters
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(ExpressValidator());
// use cookieParser to extract cookie information from request
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));

  const corsHeaders: Object = {
    'Access-Control-Allow-Origin': 'http://localhost:8100',
    'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Max-Age': '86400', // 24 hours
    'Access-Control-Allow-Headers': 'X-Requested-With, Access-Control-Allow-Origin, X-HTTP-Method-Override,' +
    ' Content-Type, Authorization, Accept, x-access-token'
  };
  app.options('*', function (req: IRequest, res: Response, next: NextFunction): void {
    res.set(corsHeaders).end();
});
  app.use(function (req: IRequest, res: Response, next: NextFunction): void {
    res.set(corsHeaders);
  next();
});

  let dbReady: boolean = false;
  mongoose.connect('mongodb://localhost:27017/play', (error: any) => {
    dbReady = true;
  });


  app.use((req: IRequest, res: Response, next: NextFunction) => {
    if (dbReady) {
      next();
    } else {
      next(new Error('there is no DB connection!'));
    }
  });

  app.use('/authenticate', authenticateRoutes);
  app.use('/videos', videosRoutes);
  app.use('/users', usersRoutes);

  let err: any;
  // catch 404 and forward to error handler
  app.use(function (req: IRequest, res: Response, next: NextFunction): void {
    err = new Error('Not Found');
  err.status = 404;
  next(err);
});

  // error handlers

  // development error handler
  // will print stacktrace
  if (app.get('env') === 'development') {
    app.use(function (req: IRequest, res: Response, next: NextFunction): void {
      res.status(err.status || 500);
    res.render('error', {
      error: err,
      message: err.message
    });
  });
  }

  // production error handler
  // no stacktraces leaked to user
  app.use(function (req: IRequest, res: Response, next: NextFunction): void {
    res.status(err.status || 500);
  res.render('error', {
    error: {},
    message: err.message
  });
});
}

export = Play.app;
