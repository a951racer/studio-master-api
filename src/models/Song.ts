import { Schema, model, Document, Types } from 'mongoose';

export interface ISong extends Document {
  title: string;
  projectId: Types.ObjectId;
  author: string;
  key?: string;
  createdAt: Date;
  updatedAt: Date;
}

const songSchema = new Schema<ISong>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying songs by project
songSchema.index({ projectId: 1 });

const Song = model<ISong>('Song', songSchema);

export default Song;
