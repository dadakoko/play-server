"use strict";
/**
 * Created by leojpod on 3/3/16.
 */
const jsonApiSerializer = require('jsonapi-serializer');
var VideoSerializer;
(function (VideoSerializer) {
    'use strict';
    VideoSerializer.videoSerializer = new jsonApiSerializer.Serializer('videos', {
        attributes: ['title', 'videourl', 'thumbnailurl', 'author'],
        author: {
            attributes: ['name', 'email'],
            ref: '_id'
        },
        id: '_id',
        typeForAttribute: function (attribute) {
            if (attribute === 'author') {
                return 'users';
            }
            else {
                return attribute;
            }
        }
    });
})(VideoSerializer || (VideoSerializer = {}));
module.exports = VideoSerializer;
//# sourceMappingURL=video-serializer.js.map