import {IUser} from './user';
import * as mongoose from 'mongoose';
import {Document} from 'mongoose';
import {Model} from 'mongoose';
import {Schema} from 'mongoose';
import {ObjectID} from "mongodb";

/**
 * Created by dk on 2016-07-14.
 */

namespace Video {
  'use strict';

  export interface IVideo extends Document {
    // author_id?: string;
    author?: IUser| ObjectID;
    artist?: string;
    title: string;
    description?: string;
    videourl: string;
    thumbnailurl: string;
  }

  const videoSchema: Schema = new Schema({
    title: {type: String, required: true},
    artist: {type: String},
    description: {type: String},
    videourl: {type: String, required: true, unique: true},
    thumbnailurl: {type: String, required: true, unique: true},
    author: {type: Schema.Types.ObjectId, ref: 'User'}
  });

  videoSchema.static('findAll', function (cb: {(err: Error, videos: IVideo[]): void}): Promise<IVideo[]> {
    return this.find(cb);
  });

  videoSchema.static('findByAuthor', function (authorId: string, cb: {(err: Error, videos: IVideo[]): void}): Promise<IVideo[]> {
    return this.find({author: authorId}, cb);
  });

  export const Video: Model<IVideo> = mongoose.model<IVideo>('Video', videoSchema);
}

export = Video;
