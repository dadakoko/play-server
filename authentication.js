"use strict";
const jsonwebtoken_1 = require('jsonwebtoken');
const config_1 = require('./config');
/**
 * Created by leojpod on 3/3/16.
 */
var Authentication;
(function (Authentication_1) {
    'use strict';
    // export the authentication class:
    class Authentication {
        static checkAuthentication(req, cb) {
            // look for the token in the incoming request:
            let token = req.body.token || req.query.token ||
                req.get('x-access-token') || req.get('authentication') || undefined;
            if (token === undefined) {
                // there is no token!
                cb(false);
            }
            else {
                jsonwebtoken_1.verify(token, config_1.secretTokenKey, function (err, decoded) {
                    if (err) {
                        cb(false);
                    }
                    else {
                        req.decoded = decoded;
                        cb(true);
                    }
                });
            }
        }
        static authenticatedRoute(req, res, next) {
            Authentication.checkAuthentication(req, function (isAuth) {
                if (isAuth) {
                    // the user has a proper token: let's call next
                    next();
                }
                else {
                    console.log('unauthorized access! kicking the client out with 403');
                    res.status(403).json({
                        message: 'you need to authenticate to access this part of the API',
                        success: false
                    });
                }
            });
        }
    }
    Authentication_1.Authentication = Authentication;
})(Authentication || (Authentication = {}));
module.exports = Authentication;
//# sourceMappingURL=authentication.js.map