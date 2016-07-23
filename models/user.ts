/**
 * Created by leojpod on 2016-06-14.
 */

/**
 * Created by leojpod on 3/5/16.
 */
import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import {Document} from 'mongoose';
import {Model} from 'mongoose';
import {Schema} from 'mongoose';

namespace User {
  'use strict';

  export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
  }

  const userSchema: Schema = new Schema({
    name: {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true},
    // we don't want the password to be fetched by default
    password: {type: String, required: true, select: false}
  });

  userSchema.static('findAll', function (cb: {(err: Error, user: IUser[]): void}) {
    return this.find(cb);
  });
  userSchema.static('authenticateUser', function (identifier: string, password: string, cb: {(err: Error, user?: IUser): void}) {
    // we need to ask mongoose for the password property this time ...
    this.find({$or: [{name: identifier}, {email: identifier}]}, {name: 1, email: 1, password: 1}, (findErr: Error, users) => {
      if (findErr) {
        cb(findErr);
        return;
      }
      if (users.length > 0) {
        // we assume that there is at most one user !
        let user: IUser = users[0];
        user.compare(password, (bcryptErr, isAuth) => {
          if (bcryptErr) {
            cb(bcryptErr);
            return;
          }
          if (isAuth) {
            // remove the password from the fetched object
            delete user.password;
            cb(undefined, user);
            return;
          } else {
            cb(undefined, undefined);
          }
        });
      } else {
        cb(undefined, undefined);
      }
    });
  });
  
  userSchema.method('compare', function (password: string, cb: {(err: Error, isValid: boolean): void}): void {
    console.log('compare');
    bcrypt.compare(password, this.password, cb);
  });

  export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

}
export = User;
