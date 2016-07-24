"use strict";
const express_1 = require('express');
const jsonApiSerializer = require('jsonapi-serializer');
const async = require('async');
const video_1 = require('../models/video');
const video_serializer_1 = require('../serializers/video-serializer');
var gcloud = require('gcloud');
var format = require('util').format;
var multer = require('multer');
var ffmpeg = require('fluent-ffmpeg');
/**
 * Created by leojpod on 3/2/16.
 */
var VideoRouter;
(function (VideoRouter) {
    'use strict';
    // [START config]
    // Multer is required to process file uploads and make them available via
    // req.files.
    // var multer = require('multer')({
    //     inMemory: true,
    //     fileSize: 5 * 1024 * 1024 * 1024 // no larger than 5mb, you can change as needed.
    // });
    // var multer = multer({ //multer settings
    //     storage: mstorage
    // });
    var mstorage = require('multer').diskStorage({
        destination: function (req, file, cb) {
            cb(null, '../uploads/');
        },
        filename: function (req, file, cb) {
            var datetimestamp = Date.now();
            cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1]);
        }
    });
    var multer = require('multer')({
        storage: mstorage
    });
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
    //router.use(Authentication.authenticatedRoute);
    VideoRouter.router.post('/', function (req, res, next) {
        // validate the incoming data:
        console.log('creating a video');
        req.checkBody('data.type', 'not a video record').equals('videos');
        req.checkBody('data.attributes.title', 'missing').len(1);
        req.checkBody('data.attributes.videourl', 'missing').notEmpty();
        req.checkBody('data.attributes.thumbnailurl', 'missing').notEmpty();
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
    VideoRouter.router.delete('/:id', function (req, res, next) {
        let prefix;
        async.series([
                (done) => {
                video_1.Video.findById(req.params.id, (err, video) => {
                    if (err) {
                        next(err);
                        done(err);
                        return;
                    }
                    prefix = video.videourl.split('/')[video.videourl.split('/').length - 1].split('.')[0];
                    done();
                });
            },
                (done) => {
                video_1.Video.remove({
                    _id: req.params.id
                }, function (err) {
                    if (err) {
                        next(err);
                        done(err);
                        return;
                    }
                    done();
                });
            },
                (done) => {
                bucket.deleteFiles({
                    prefix: prefix
                }, function (err) {
                    if (err) {
                        next(err);
                        done(err);
                        return;
                    }
                    done();
                });
            }
        ], (processErr) => {
            prefix = null;
            if (processErr) {
                res.status(403).json({ error: processErr.toString(), success: false });
            }
            else {
                res.status(200).json({ message: 'Deleted' });
            }
        });
    });
    // [START process]
    // Process the file upload and upload to Google Cloud Storage.
    VideoRouter.router.post('/upload', multer.single('file'), function (req, res, next) {
        console.log("body: ", req.body);
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }
        ffmpeg(req.file.path)
            .inputFormat('mov')
            .screenshots({
            count: 1,
            timestamps: [0],
            filename: req.file.path.split('.mov')[0] + '.png',
            folder: '../uploads/',
            size: '320x240'
        }).on('end', function () {
            console.log('Screenshots taken');
            let filestoUpload = [req.file.path.split('.mov')[0] + '.png', req.file.path];
            var publicUrl = [];
            //use async foreach to upload the local files to a new file to be created in your bucket.
            async.forEach(filestoUpload, (file, callback) => bucket.upload(file, function (err) {
                if (!err) {
                    publicUrl.push(format('https://storage.googleapis.com/%s/%s', bucket.name, file.split('../uploads/')[1]));
                }
                callback();
            }), function (err) {
                if (err)
                    return next(err);
                //Tell the user about the great success
                res.status(200).send(JSON.stringify(publicUrl.sort()));
            });
        });
    });
})(VideoRouter || (VideoRouter = {}));
module.exports = VideoRouter;
//# sourceMappingURL=videos.js.map