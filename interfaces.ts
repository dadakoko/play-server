/**
 * Created by leojpod on 2016-06-15.
 */
import {Request} from 'express-serve-static-core';
import {Db} from 'mongodb';

export interface IRequest extends Express.Request, ExpressValidator.RequestValidation, Request {
  decoded?: any;
  db: Db;
}
