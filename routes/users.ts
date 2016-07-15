import * as async from 'async';
import * as bcrypt from 'bcrypt';
import {Router, Response} from 'express';
import {NextFunction} from 'express';
import jsonApiSerializer = require('jsonapi-serializer');
import {IUser, User} from '../models/user';
import {Authentication} from '../authentication';
import {userSerializer} from '../serializers/user-serializer';
import {IRequest} from '../interfaces';

namespace UserRoutes {
  'use strict';

  export const router: Router = Router();
  router.use(function (req, res, next) {
    console.log('this is just an empty middleware');
    next();
  });
  router.post('/', function (req: IRequest, res: Response, next: NextFunction): void {
    console.log('let us create a user please');
    // validate incoming data:
    // we need a user name of min 6 char long
    req.checkBody('data.type', 'not a user record').equals('users');
    req.checkBody('data.attributes.name', 'not alphanumeric').isAlphanumeric();
    req.checkBody('data.attributes.name', 'too short (3 char min)').len(3, undefined);
    // we need an email that is a proper email
    req.checkBody('data.attributes.email', 'invalid email').isEmail();
    // we need a password that is at least 6 char long
    req.checkBody('data.attributes.password', 'password too short  (6 char min)').len(6, undefined);

    let errors: Dictionary<any> = req.validationErrors(true);
    // if any of these parameter does not fit the criteria
    if (errors) {
      res.status(403).json({
        errors: errors,
        success: false,
      });
      return;
    } else {
      console.log('about to create a new user');
      // let's create the new user:
      new jsonApiSerializer.Deserializer().deserialize(req.body, (err: Error, user: IUser): void => {
        if (err) {
          console.log('deserialize failed');
          res.status(400).json({
            errors: err.toString(),
            success: false
          });
          return;
        }
        // at this point we "parsed" the data from the request's body into a IUser
        let mongooseUser: IUser;
        async.series([
          (done) => {
            // 2 - encrypt the password
            bcrypt.hash(user.password, 10, (hashErr, hashedPwd) => {
              if (hashErr) {
                next(hashErr);
                done(hashErr);
                return;
              }
              user.password = hashedPwd;
              done();
            });
          },
          (done) => {
            // 3 - create the user if we are good
            mongooseUser = new User(user);
            mongooseUser.save((saveErr) => {
              if (saveErr) {
                done(saveErr);
                return;
              }
              done();
            });
          }
        ], (processErr) => {
          if (processErr) {
            res.status(403).json({error: processErr.toString(), success: false});
          } else {
            res.status(200).json(userSerializer.serialize(mongooseUser));
          }
        });
      });
    }
  });

  router.use(Authentication.authenticatedRoute);

  router.get('/', function (req: IRequest, res: Response, next: NextFunction): void {
    User.findAll((err, users) => {
      if (err) {
        next(err);
        return;
      }
      res.status(200).json(userSerializer.serialize(users));
    });
  });

  router.get('/:id', function (req: IRequest, res: Response, next: NextFunction): void {
    req.checkParams('id', 'not a valid ObjectId').isMongoId();
    let errors: Dictionary<any> = req.validationErrors();
    if (errors) {
      res.status(403).json({
        errors: errors,
        success: false
      });
      return;
    }
    console.log('req.params.id -> ', req.params.id);
    User.findById(req.params.id, (err, user) => {
        if (err) {
          next(err);
          return;
        }
        if (user) {
          res.json(userSerializer.serialize(user));
        } else {
          res.json(userSerializer.serialize(null));
        }
      });
  });
}

export = UserRoutes;
