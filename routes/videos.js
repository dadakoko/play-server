"use strict";
const express_1 = require('express');
const jsonApiSerializer = require('jsonapi-serializer');
const async = require('async');
const video_1 = require('../models/video');
const video_serializer_1 = require('../serializers/video-serializer');
const authentication_1 = require('../authentication');
var gcloud = require('gcloud');
var format = require('util').format;
var multer = require('multer');
/**
 * Created by leojpod on 3/2/16.
 */
var VideoRouter;
(function (VideoRouter) {
    'use strict';
    // [START config]
    // Multer is required to process file uploads and make them available via
    // req.files.
    var multer = require('multer')({
        inMemory: true,
        fileSize: 5 * 1024 * 1024 * 1024 // no larger than 5mb, you can change as needed.
    });
    // var mstorage = multer.diskStorage({ //multers disk storage settings
    //     destination: function (req, file, cb) {
    //         cb(null, './uploads/')
    //     },
    //     filename: function (req, file, cb) {
    //         var datetimestamp = Date.now();
    //         cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
    //     }
    // });
    // var upload = multer({ //multer settings
    //     storage: mstorage
    // }).single('file');
    // The following environment variables are set by app.yaml when running on GAE,
    // but will need to be manually set when running locally.
    // The storage client is used to communicate with Google Cloud Storage
    var storage = gcloud.storage({
        projectId: 'play-1376'
    });
    // A bucket is a container for objects (files).
    var bucket = storage.bucket('play-video');
    // [END config]
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
    VideoRouter.router.use(authentication_1.Authentication.authenticatedRoute);
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
    });
    // upload(req,res,function(err){
    //     if(err){
    //         res.json({error_code:1,err_desc:err});
    //         return;
    //     }
    //     res.json({error_code:0,err_desc:null});
    // });
    // [START process]
    // Process the file upload and upload to Google Cloud Storage.
    VideoRouter.router.post('/upload', multer.single('file'), function (req, res, next) {
        console.warn('were are we ?');
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }
        // Create a new blob in the bucket and upload the file data.
        var blob = bucket.file(req.file.originalname);
        var blobStream = blob.createWriteStream();
        blobStream.on('error', function (err) {
            return next(err);
        });
        blobStream.on('finish', function () {
            // The public URL can be used to directly access the file via HTTP.
            var publicUrl = format('https://storage.googleapis.com/%s/%s', bucket.name, blob.name);
            res.status(200).send(publicUrl);
        });
        blobStream.end(req.file.buffer);
    });
})(VideoRouter || (VideoRouter = {}));
module.exports = VideoRouter;
//# sourceMappingURL=videos.js.map