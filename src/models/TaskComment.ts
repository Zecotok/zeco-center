import mongoose, { Schema } from 'mongoose';

export enum CommentType {
  TEXT = 'text',
  AUDIO = 'audio',
  VIDEO = 'video',
  SCREENSHARE = 'screenshare'
}

export interface ITaskComment {
  _id?: string;
  task: mongoose.Types.ObjectId | string;
  author: mongoose.Types.ObjectId | string;
  content: string;
  commentType?: CommentType | string;
  mediaUrl?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

const TaskCommentSchema = new Schema<ITaskComment>(
  {
    task: { 
      type: Schema.Types.ObjectId, 
      ref: 'Task',
      required: true 
    },
    author: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
    content: { 
      type: String, 
      required: true 
    },
    commentType: {
      type: String,
      enum: Object.values(CommentType),
      default: CommentType.TEXT
    },
    mediaUrl: {
      type: String,
      default: null
    }
  },
  { 
    timestamps: true 
  }
);

// Create indexes for faster queries
TaskCommentSchema.index({ task: 1 });
TaskCommentSchema.index({ author: 1 });
TaskCommentSchema.index({ createdAt: -1 });
TaskCommentSchema.index({ commentType: 1 });

// Check if we're on the server side
const isServer = typeof window === 'undefined';

// Only create the model on the server side
const TaskComment = isServer 
  ? (mongoose.models.TaskComment || mongoose.model<ITaskComment>('TaskComment', TaskCommentSchema))
  : null;

export default TaskComment; 