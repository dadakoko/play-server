/**
 * Created by leojpod on 2016-06-14.
 */
"use strict";
/**
 * Created by leojpod on 3/5/16.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const mongoose_1 = require('mongoose');
var User;
(function (User_1) {
    'use strict';
    const userSchema = new mongoose_1.Schema({
        email: { type: String, required: true, unique: true },
        name: { type: String, required: true, unique: true },
        // we don't want the password to be fetched by default
        password: { type: String, required: true, select: false }
    });
    userSchema.static('findAll', function (cb) {
        return this.find(cb);
    });
    userSchema.static('authenticateUser', function (identifier, password, cb) {
        // we need to ask mongoose for the password property this time ...
        this.find({ $or: [{ name: identifier }, { email: identifier }] }, { name: 1, email: 1, password: 1 }, (findErr, users) => {
            if (findErr) {
                cb(findErr);
                return;
            }
            if (users.length > 0) {
                // we assume that there is at most one user !
                let user = users[0];
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
                    }
                    else {
                        cb(undefined, undefined);
                    }
                });
            }
            else {
                cb(undefined, undefined);
            }
        });
    });
    userSchema.method('compare', function (password, cb) {
        console.log('compare');
        bcrypt.compare(password, this.password, cb);
    });
    User_1.User = mongoose.model('User', userSchema);
})(User || (User = {}));
module.exports = User;
//# sourceMappingURL=user.js.map