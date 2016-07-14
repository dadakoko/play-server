import {Router} from 'express';
import {Response} from 'express';
import * as jwt from 'jsonwebtoken';
import {Authentication} from '../authentication';
import {IRequest} from '../interfaces';
import {secretTokenKey} from '../config';
import {IUser, User} from '../models/user';
import {NextFunction} from 'express';

namespace AuthenticateRouter {
  'use strict';

  export const router: Router = Router();

  router.get('/', function (req: IRequest, res: Response): void {
    Authentication.checkAuthentication(req, function (isAuth: boolean): void {
      if (isAuth === false) {
        res.json({
          message: 'you are not authenticated',
          success: false
        });
      } else {
        res.json({success: true});
      }
    });
  });

  router.post('/', function (req: IRequest, res: Response, next: NextFunction): void {
    req.checkBody('identifier', 'required').notEmpty();
    req.checkBody('password', 'required').notEmpty();
    let errors: Object = req.validationErrors();
    if (errors) {
      res.status(400).json({error: errors});
      return;
    }
    let userIdentifier: string = req.body.identifier;
    let password: string = req.body.password;

    // console.log('let us find the user');
    User.authenticateUser(userIdentifier, password, (findErr: Error, user: IUser) => {
        if (findErr) {
          // console.log('something is wrong');
          next(findErr);
        } else if (!user) {
          // either we didn't find the user either the password didn't match
          res.status(403).json({
            'success': false,
            'message': 'wrong combination of password/identification'
          });
        } else {
          jwt.sign(
            {userId: user._id},
            secretTokenKey,
            {expiresIn: 86400000},
            (errorOrToken: Error|string): void => {
              // console.log('token signed ');
              // console.log('errorOrToken -> ', errorOrToken);
              // - NOTE: at this point we're borderline pyramid of death and we should consider using async
              if (errorOrToken instanceof Error) {
                res.status(500).json({
                  'error': 'something went wrong with the JWT generation',
                  'success': false
                });
                next(errorOrToken);
              } else {
                let token: string = errorOrToken;
                res.status(200).json({
                  'success': true,
                  'token': token
                });
              }
            }
          );
        }
      }
    )
    ;
  })
  ;
}

export = AuthenticateRouter;
