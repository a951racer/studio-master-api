import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = model<IUser>('User', userSchema);

export default User;
