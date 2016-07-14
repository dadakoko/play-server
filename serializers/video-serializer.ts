/**
 * Created by leojpod on 3/3/16.
 */
import jsonApiSerializer = require('jsonapi-serializer');

namespace VideoSerializer {
  'use strict';

  export const videoSerializer: jsonApiSerializer.Serializer = new jsonApiSerializer.Serializer('videos', {
    attributes: ['title', 'url', 'author'],
    author: {
      attributes: ['name', 'email'],
      ref: '_id'
    },
    id: '_id',
    typeForAttribute: function (attribute: string): string {
      if (attribute === 'author') {
        return 'users';
      } else {
        return attribute;
      }
    }
  });

  // export const videoSerializer: jsonApiSerializer.Serializer = new jsonApiSerializer.Serializer('videos', {
  //   attributes: ['title', 'url'],
  //   id: '_id'
  // });

}

export = VideoSerializer;
