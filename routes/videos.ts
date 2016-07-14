import {Router, Response, Request} from 'express';
import jsonApiSerializer = require('jsonapi-serializer');
import {NextFunction} from 'express';
import * as async from 'async';
import {IVideo, Video} from '../models/video';
import {videoSerializer} from '../serializers/video-serializer';
import {Authentication} from '../authentication';
import {IRequest} from '../interfaces';
import {ObjectID} from "mongodb";

/**
 * Created by leojpod on 3/2/16.
 */


namespace VideoRouter {
  'use strict';

  export const router: Router = Router();

  router.get('/', function (req: IRequest, res: Response, next: NextFunction): void {
    function handleVideos(videos: IVideo[]) {
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
      let errors: Dictionary<any> = req.validationErrors();
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
      Video.findAll((err, videos: IVideo[]) => {
        handleVideos(videos);
      });
    }
  });

  //router.use(Authentication.authenticatedRoute);

  router.post('/', function (req: IRequest, res: Response, next: NextFunction): void {
    // validate the incoming data:
    console.log('creating a video');
    req.checkBody('data.type', 'not a video record').equals('videos');
    req.checkBody('data.attributes.title', 'missing').len(1);
    req.checkBody('data.attributes.url', 'missing').notEmpty();
    req.checkBody('data.attributes', 'missing').notEmpty();

    let errors: Dictionary<any> = req.validationErrors();
    if (errors) {
      res.status(400).json({errors: 'malformed JSON-API resource'});
      return;
    }
    console.log('deserializing...');
    new jsonApiSerializer.Deserializer().deserialize(req.body,(error:Error,video:IVideo):void => {
      if(error){
        console.log('deserialize video failed');
        res.status(400).json({
          errors:error.toString(),
          success:false
        });
        return;
      }
      let mongooseVideo : IVideo = new Video(video);
      mongooseVideo.save((saveErr)=>{
        if(saveErr) {
          res.status(403).json({error: saveErr.toString(), success: false});
          return;
        }
        res.status(200).json(videoSerializer.serialize(mongooseVideo));
      })

    }
    );

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

}

export = VideoRouter;
