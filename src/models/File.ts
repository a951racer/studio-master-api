import { Schema, model, Document, Types } from 'mongoose';

export interface IFile extends Document {
  songId: Types.ObjectId;
  name: string;
  formatId: Types.ObjectId;
  typeId: Types.ObjectId;
  s3Url: string;
  createdAt: Date;
  updatedAt: Date;
}

const fileSchema = new Schema<IFile>(
  {
    songId: {
      type: Schema.Types.ObjectId,
      ref: 'Song',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    formatId: {
      type: Schema.Types.ObjectId,
      ref: 'LookupEntry',
      required: true,
    },
    typeId: {
      type: Schema.Types.ObjectId,
      ref: 'LookupEntry',
      required: true,
    },
    s3Url: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying files by song
fileSchema.index({ songId: 1 });

const File = model<IFile>('File', fileSchema);

export default File;
