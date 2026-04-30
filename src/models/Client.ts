import { Schema, model, Document, Types } from 'mongoose';

export interface IClientPersonAssociation {
  personId: Types.ObjectId;
  roleId: Types.ObjectId;
  isPrimary: boolean;
}

export interface IClient extends Document {
  name: string;
  description?: string;
  persons: IClientPersonAssociation[];
  createdAt: Date;
  updatedAt: Date;
}

const clientPersonAssociationSchema = new Schema<IClientPersonAssociation>(
  {
    personId: {
      type: Schema.Types.ObjectId,
      ref: 'Person',
      required: true,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'LookupEntry',
      required: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

const clientSchema = new Schema<IClient>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    persons: {
      type: [clientPersonAssociationSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Client = model<IClient>('Client', clientSchema);

export default Client;
