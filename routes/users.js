"use strict";
const async = require('async');
const bcrypt = require('bcrypt');
const express_1 = require('express');
const jsonApiSerializer = require('jsonapi-serializer');
const user_1 = require('../models/user');
const authentication_1 = require('../authentication');
const user_serializer_1 = require('../serializers/user-serializer');
var UserRoutes;
(function (UserRoutes) {
    'use strict';
    UserRoutes.router = express_1.Router();
    UserRoutes.router.use(function (req, res, next) {
        console.log('this is just an empty middleware');
        next();
    });
    UserRoutes.router.post('/', function (req, res, next) {
        console.log('let us create a user please');
        // validate incoming data:
        // we need a user name of min 6 char long
        req.checkBody('data.type', 'not a user record').equals('users');
        req.checkBody('data.attributes.name', 'not alphanumeric').isAlphanumeric();
        req.checkBody('data.attributes.name', 'too short (6 char min)').len(6, undefined);
        // we need an email that is a proper email
        req.checkBody('data.attributes.email', 'invalid email').isEmail();
        // we need a password that is at least 6 char long
        req.checkBody('data.attributes.password', 'password too short  (6 char min)').len(6, undefined);
        let errors = req.validationErrors(true);
        // if any of these parameter does not fit the criteria
        if (errors) {
            res.status(403).json({
                errors: errors,
                success: false,
            });
            return;
        }
        else {
            console.log('about to create a new user');
            // let's create the new user:
            new jsonApiSerializer.Deserializer().deserialize(req.body, (err, user) => {
                if (err) {
                    console.log('deserialize failed');
                    res.status(400).json({
                        errors: err.toString(),
                        success: false
                    });
                    return;
                }
                // at this point we "parsed" the data from the request's body into a IUser
                let mongooseUser;
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
                        mongooseUser = new user_1.User(user);
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
                        res.status(403).json({ error: processErr.toString(), success: false });
                    }
                    else {
                        res.status(200).json(user_serializer_1.userSerializer.serialize(mongooseUser));
                    }
                });
            });
        }
    });
    UserRoutes.router.use(authentication_1.Authentication.authenticatedRoute);
    UserRoutes.router.get('/', function (req, res, next) {
        user_1.User.findAll((err, users) => {
            if (err) {
                next(err);
                return;
            }
            res.status(200).json(user_serializer_1.userSerializer.serialize(users));
        });
    });
    UserRoutes.router.get('/:id', function (req, res, next) {
        req.checkParams('id', 'not a valid ObjectId').isMongoId();
        let errors = req.validationErrors();
        if (errors) {
            res.status(403).json({
                errors: errors,
                success: false
            });
            return;
        }
        console.log('req.params.id -> ', req.params.id);
        user_1.User.findById(req.params.id, (err, user) => {
            if (err) {
                next(err);
                return;
            }
            if (user) {
                res.json(user_serializer_1.userSerializer.serialize(user));
            }
            else {
                res.json(user_serializer_1.userSerializer.serialize(null));
            }
        });
    });
})(UserRoutes || (UserRoutes = {}));
module.exports = UserRoutes;
//# sourceMappingURL=users.js.map