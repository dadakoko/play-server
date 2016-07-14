"use strict";
const express_1 = require('express');
const jsonApiSerializer = require('jsonapi-serializer');
const async = require('async');
const video_1 = require('../models/video');
const video_serializer_1 = require('../serializers/video-serializer');
/**
 * Created by leojpod on 3/2/16.
 */
var VideoRouter;
(function (VideoRouter) {
    'use strict';
    VideoRouter.router = express_1.Router();
    VideoRouter.router.get('/', function (req, res, next) {
        function handleVideos(videos) {
            async.each(videos, (video, done) => {
                // populate each video with its author
                video.populate('author', done);
            }, (popErr) => {
                if (popErr) {
                    next(popErr);
                    return;
                }
                // serialize and return
                res.status(200).json(video_serializer_1.videoSerializer.serialize(videos));
            });
        }
        if (req.query.author) {
            req.checkQuery('author', 'not an Object Id').isMongoId();
            let errors = req.validationErrors();
            if (errors) {
                res.status(403).json({
                    errors: errors,
                    success: false,
                });
                return;
            }
            video_1.Video.findByAuthor(req.query.author, (err, videos) => {
                handleVideos(videos);
            });
        }
        else {
            video_1.Video.findAll((err, videos) => {
                handleVideos(videos);
            });
        }
    });
    //router.use(Authentication.authenticatedRoute);
    VideoRouter.router.post('/', function (req, res, next) {
        // validate the incoming data:
        console.log('creating a video');
        req.checkBody('data.type', 'not a video record').equals('videos');
        req.checkBody('data.attributes.title', 'missing').len(1);
        req.checkBody('data.attributes.url', 'missing').notEmpty();
        req.checkBody('data.attributes', 'missing').notEmpty();
        let errors = req.validationErrors();
        if (errors) {
            res.status(400).json({ errors: 'malformed JSON-API resource' });
            return;
        }
        console.log('deserializing...');
        new jsonApiSerializer.Deserializer().deserialize(req.body, (error, video) => {
            if (error) {
                console.log('deserialize video failed');
                res.status(400).json({
                    errors: error.toString(),
                    success: false
                });
                return;
            }
            let mongooseVideo = new video_1.Video(video);
            mongooseVideo.save((saveErr) => {
                if (saveErr) {
                    res.status(403).json({ error: saveErr.toString(), success: false });
                    return;
                }
                res.status(200).json(video_serializer_1.videoSerializer.serialize(mongooseVideo));
            });
        });
        /* new jsonApiSerializer.Deserializer({
           users: {
             valueForRelationship: function (relationship: any): number {
               return relationship.id;
             }
           }
         }).deserialize(req.body, function (err: Error, video: IVideo): void {
           if (err) {
             res.status(400).json({errors: 'malformed JSON-API resource'});
             return;
           }
           console.log('deserialized video -> ', video);
           //video.author_id = video.author as String;
           delete(video.id);
           // delete(video.author);
           let insertedVideo: IVideo;
           console.log('making the insertion');
           req.db.collection('videos')
             .insertOne(video, (insertErr, report) => {
               if (insertErr) {
                 next(insertErr);
                 return;
               }
               if (!report.insertedId) {
                 next(new Error('the video creation process failed'));
                 return;
               }
               insertedVideo = report.ops[0];
               res.status(200).json(videoSerializer.serialize(videoSerializer));
             });
         });*/
    });
})(VideoRouter || (VideoRouter = {}));
module.exports = VideoRouter;
//# sourceMappingURL=videos.js.map