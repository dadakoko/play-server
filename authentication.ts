import {verify} from 'jsonwebtoken';
import {secretTokenKey} from './config';
import {Response} from 'express';
import {NextFunction} from 'express';
import {IRequest} from './interfaces';
/**
 * Created by leojpod on 3/3/16.
 */

namespace Authentication {
    'use strict';

    // export the authentication class:
    export class Authentication {
        public static checkAuthentication(req: IRequest, cb: (isAuth: boolean) => void): void {
            // look for the token in the incoming request:
            let token: string = req.body.token || req.query.token ||
                req.get('x-access-token') || req.get('authentication') || undefined;

            if (token === undefined) {
                // there is no token!
                cb(false);
            } else {
                verify(token, secretTokenKey, function (err: Error, decoded: Object): void {
                    if (err) {
                        cb(false);
                    } else {
                        req.decoded = decoded;
                        cb(true);
                    }
                });
            }
        }

        public static authenticatedRoute(req: IRequest, res: Response, next: NextFunction): void {
            Authentication.checkAuthentication(req, function (isAuth: boolean): void {
                if (isAuth) {
                    // the user has a proper token: let's call next
                    next();
                } else {
                    console.log('unauthorized access! kicking the client out with 403');
                    res.status(403).json({
                        message: 'you need to authenticate to access this part of the API',
                        success: false
                    });
                }
            });
        }
    }
}

export = Authentication;
