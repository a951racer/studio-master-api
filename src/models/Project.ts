import { Schema, model, Document, Types } from 'mongoose';

export interface IProject extends Document {
  name: string;
  clientId: Types.ObjectId;
  workflowStageId: Types.ObjectId;
  description?: string;
  targetCompletionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    workflowStageId: {
      type: Schema.Types.ObjectId,
      ref: 'LookupEntry',
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    targetCompletionDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying projects by client
projectSchema.index({ clientId: 1 });

// Index for querying projects by workflow stage
projectSchema.index({ workflowStageId: 1 });

const Project = model<IProject>('Project', projectSchema);

export default Project;
