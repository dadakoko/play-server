"use strict";
const mongoose = require('mongoose');
const mongoose_1 = require('mongoose');
/**
 * Created by dk on 2016-07-14.
 */
var Video;
(function (Video_1) {
    'use strict';
    const videoSchema = new mongoose_1.Schema({
        author: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
        artist: { type: String },
        title: { type: String, required: true },
        description: { type: String },
        videourl: { type: String, required: true, unique: true },
        thumbnailurl: { type: String, required: true, unique: true }
    });
    videoSchema.static('findAll', function (cb) {
        return this.find(cb);
    });
    videoSchema.static('findByAuthor', function (authorId, cb) {
        return this.find({ author: authorId }, cb);
    });
    Video_1.Video = mongoose.model('Video', videoSchema);
})(Video || (Video = {}));
module.exports = Video;
//# sourceMappingURL=video.js.map