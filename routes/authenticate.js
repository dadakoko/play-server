"use strict";
const express_1 = require('express');
const jwt = require('jsonwebtoken');
const authentication_1 = require('../authentication');
const config_1 = require('../config');
const user_1 = require('../models/user');
var AuthenticateRouter;
(function (AuthenticateRouter) {
    'use strict';
    AuthenticateRouter.router = express_1.Router();
    AuthenticateRouter.router.get('/', function (req, res) {
        authentication_1.Authentication.checkAuthentication(req, function (isAuth) {
            if (isAuth === false) {
                res.json({
                    message: 'you are not authenticated',
                    success: false
                });
            }
            else {
                res.json({ success: true });
            }
        });
    });
    AuthenticateRouter.router.post('/', function (req, res, next) {
        req.checkBody('identifier', 'required').notEmpty();
        req.checkBody('password', 'required').notEmpty();
        let errors = req.validationErrors();
        if (errors) {
            res.status(400).json({ error: errors });
            return;
        }
        let userIdentifier = req.body.identifier;
        let password = req.body.password;
        // console.log('let us find the user');
        user_1.User.authenticateUser(userIdentifier, password, (findErr, user) => {
            if (findErr) {
                // console.log('something is wrong');
                next(findErr);
            }
            else if (!user) {
                // either we didn't find the user either the password didn't match
                res.status(403).json({
                    'success': false,
                    'message': 'wrong combination of password/identification'
                });
            }
            else {
                jwt.sign({ userId: user._id, username: user.name }, config_1.secretTokenKey, { expiresIn: 86400000 }, (errorOrToken) => {
                    // console.log('token signed ');
                    // console.log('errorOrToken -> ', errorOrToken);
                    // - NOTE: at this point we're borderline pyramid of death and we should consider using async
                    if (errorOrToken instanceof Error) {
                        res.status(500).json({
                            'error': 'something went wrong with the JWT generation',
                            'success': false
                        });
                        next(errorOrToken);
                    }
                    else {
                        let token = errorOrToken;
                        res.status(200).json({
                            'success': true,
                            'token': token
                        });
                    }
                });
            }
        });
    });
})(AuthenticateRouter || (AuthenticateRouter = {}));
module.exports = AuthenticateRouter;
//# sourceMappingURL=authenticate.js.map