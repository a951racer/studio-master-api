import { Schema, model, Document, Types } from 'mongoose';

export interface IPhoneNumber {
  _id?: Types.ObjectId;
  number: string;
  typeId: Types.ObjectId;
}

export interface IPerson extends Document {
  firstName: string;
  lastName: string;
  preferredName?: string;
  email?: string;
  notes?: string;
  phoneNumbers: IPhoneNumber[];
  createdAt: Date;
  updatedAt: Date;
}

const phoneNumberSchema = new Schema<IPhoneNumber>(
  {
    number: {
      type: String,
      required: true,
      trim: true,
    },
    typeId: {
      type: Schema.Types.ObjectId,
      ref: 'LookupEntry',
      required: true,
    },
  },
  {
    _id: true,
  }
);

const personSchema = new Schema<IPerson>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    preferredName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
    },
    phoneNumbers: {
      type: [phoneNumberSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Person = model<IPerson>('Person', personSchema);

export default Person;
