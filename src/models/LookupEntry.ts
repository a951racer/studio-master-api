import { Schema, model, Document, Types } from 'mongoose';

export interface ILookupEntry extends Document {
  listType: 'file-format' | 'file-type' | 'workflow-stage' | 'phone-number-type' | 'role';
  clientId?: Types.ObjectId;
  name: string;
  sequenceOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const lookupEntrySchema = new Schema<ILookupEntry>(
  {
    listType: {
      type: String,
      required: true,
      enum: ['file-format', 'file-type', 'workflow-stage', 'phone-number-type', 'role'],
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sequenceOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: ensures name is unique within (listType, clientId) scope
lookupEntrySchema.index({ listType: 1, clientId: 1, name: 1 }, { unique: true });

// Index for ordered queries by listType and clientId
lookupEntrySchema.index({ listType: 1, clientId: 1, sequenceOrder: 1 });

const LookupEntry = model<ILookupEntry>('LookupEntry', lookupEntrySchema);

export default LookupEntry;
