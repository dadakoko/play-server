import {Router, Response, Request} from 'express';
import jsonApiSerializer = require('jsonapi-serializer');
import {NextFunction} from 'express';
import * as async from 'async';
import {IVideo, Video} from '../models/video';
import {videoSerializer} from '../serializers/video-serializer';
import {Authentication} from '../authentication';
import {IRequest} from '../interfaces';
import {ObjectID} from "mongodb";
var gcloud = require('gcloud');
var format = require('util').format;
var multer = require('multer');

var ffmpeg = require('fluent-ffmpeg');

/**
 * Created by leojpod on 3/2/16.
 */


namespace VideoRouter {
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

    var mstorage = require('multer').diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, '../uploads/')
        },
        filename: function (req, file, cb) {
            var datetimestamp = Date.now();
            cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
        }
    });
    var multer = require('multer')({ //multer settings
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


    export const router:Router = Router();

    router.get('/', function (req:IRequest, res:Response, next:NextFunction):void {
        function handleVideos(videos:IVideo[]) {
            async.each(videos, (video, done) => {
                // populate each video with its author
                video.populate('author', done);
            }, (popErr) => {
                if (popErr) {
                    next(popErr);
                    return;
                }
                // serialize and return
                res.status(200).json(videoSerializer.serialize(videos));
            });
        }

        if (req.query.author) {
            req.checkQuery('author', 'not an Object Id').isMongoId();
            let errors:Dictionary<any> = req.validationErrors();
            if (errors) {
                res.status(403).json({
                    errors: errors,
                    success: false,
                });
                return;
            }
            Video.findByAuthor(req.query.author, (err, videos) => {
                handleVideos(videos);
            });
        } else {
            Video.findAll((err, videos:IVideo[]) => {
                handleVideos(videos);
            });
        }
    });

    //router.use(Authentication.authenticatedRoute);

    router.post('/', function (req:IRequest, res:Response, next:NextFunction):void {
        // validate the incoming data:
        console.log('creating a video');
        req.checkBody('data.type', 'not a video record').equals('videos');
        req.checkBody('data.attributes.title', 'missing').len(1);
        req.checkBody('data.attributes.videourl', 'missing').notEmpty();
        req.checkBody('data.attributes.thumbnailurl', 'missing').notEmpty();
        req.checkBody('data.attributes', 'missing').notEmpty();

        let errors:Dictionary<any> = req.validationErrors();
        if (errors) {
            res.status(400).json({errors: 'malformed JSON-API resource'});
            return;
        }

        console.log('deserializing...');
        new jsonApiSerializer.Deserializer().deserialize(req.body, (error:Error, video:IVideo):void => {
                if (error) {
                    console.log('deserialize video failed');
                    res.status(400).json({
                        errors: error.toString(),
                        success: false
                    });
                    return;
                }
                let mongooseVideo:IVideo = new Video(video);
                mongooseVideo.save((saveErr)=> {
                    if (saveErr) {
                        res.status(403).json({error: saveErr.toString(), success: false});
                        return;
                    }
                    res.status(200).json(videoSerializer.serialize(mongooseVideo));
                })

            }
        );

    });


    // [START process]
    // Process the file upload and upload to Google Cloud Storage.
    router.post('/upload', multer.single('file'), function (req, res, next) {


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
            var publicUrl:string[] = [];
            //use async foreach here
            async.forEach(filestoUpload,
                (file,callback)=>bucket.upload(file, function (err) {
                    if (!err) {
                        publicUrl.push(format(
                            'https://storage.googleapis.com/%s/%s',
                            bucket.name, file.split('../uploads/')[1]));
                    }
                    callback();
                }),
                function (err) {
                    if (err) return next(err);
                    //Tell the user about the great success
                    res.status(200).send(JSON.stringify(publicUrl));
                });

            // bucket.upload(req.file.path.split('.mov')[0] + '.png', function (err, file) {
            //     if (!err) {
            //         var publicUrl = format(
            //             'https://storage.googleapis.com/%s/%s',
            //             bucket.name, req.file.filename.split('.mov')[0] + '.png');
            //
            //         res.status(200).send(publicUrl);
            //     }
            // });
        });

        // Upload a local file to a new file to be created in your bucket.

        // bucket.upload(req.file.path, function(err, file) {
        //     if (!err) {
        //         var publicUrl = format(
        //             'https://storage.googleapis.com/%s/%s',
        //             bucket.name, req.file.filename);
        //
        //         res.status(200).send(publicUrl);
        //     }
        // });


    });
// [END process]

}

export = VideoRouter;
