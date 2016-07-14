/**
 * Created by leojpod on 3/2/16.
 */
import jsonApiSerializer = require('jsonapi-serializer');

namespace UserSerializer {
  'use strict';

  export const userSerializer: jsonApiSerializer.Serializer = new jsonApiSerializer.Serializer('user', {
    attributes: ['name', 'email'],
    id: '_id'
  });
}

export = UserSerializer;
