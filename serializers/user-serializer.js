"use strict";
/**
 * Created by leojpod on 3/2/16.
 */
const jsonApiSerializer = require('jsonapi-serializer');
var UserSerializer;
(function (UserSerializer) {
    'use strict';
    UserSerializer.userSerializer = new jsonApiSerializer.Serializer('user', {
        attributes: ['name', 'email'],
        id: '_id'
    });
})(UserSerializer || (UserSerializer = {}));
module.exports = UserSerializer;
//# sourceMappingURL=user-serializer.js.map