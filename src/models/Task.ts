import mongoose, { Schema } from 'mongoose';

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TaskStatus {
  NOT_GROOMED = 'NOT_GROOMED',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED'
}

export enum AttachmentType {
  TEXT = 'TEXT',
  AUDIO = 'AUDIO',
  SCREENSHARE = 'SCREENSHARE',
  VIDEO = 'VIDEO'
}

export interface IAttachment {
  type: AttachmentType;
  url: string;
  title?: string;
  description?: string;
}

export interface ITask {
  _id?: mongoose.Types.ObjectId | string;
  title: string;
  description?: string;
  assignedTo?: mongoose.Types.ObjectId[] | string[];
  dueDate?: Date;
  status: TaskStatus;
  priority: TaskPriority;
  createdBy: mongoose.Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
  completedAt?: Date;
  attachments?: string[];
  videoIds?: mongoose.Types.ObjectId[] | string[];
}

// Only define the schema on the server side
const TaskSchema = new Schema<ITask>(
  {
    title: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String, 
      default: '' 
    },
    assignedTo: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    }],
    dueDate: { 
      type: Date 
    },
    status: { 
      type: String, 
      enum: Object.values(TaskStatus), 
      default: TaskStatus.NOT_GROOMED 
    },
    priority: { 
      type: String, 
      enum: Object.values(TaskPriority), 
      default: TaskPriority.MEDIUM 
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    completedAt: { 
      type: Date 
    },
    attachments: [{
      type: {
        type: String,
        enum: Object.values(AttachmentType),
        required: true
      },
      url: {
        type: String,
        required: true
      },
      title: String,
      description: String
    }],
    videoIds: [{ type: String }]
  },
  { 
    timestamps: true 
  }
);

// Create indexes for faster queries
TaskSchema.index({ assignedTo: 1 }, { sparse: true });
TaskSchema.index({ createdBy: 1 }, { sparse: true });
TaskSchema.index({ status: 1 }, { sparse: true });
TaskSchema.index({ priority: 1 }, { sparse: true });

// Check if we're on the server side
const isServer = typeof window === 'undefined';

// Only create the model on the server side
const Task = isServer 
  ? (mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema))
  : null;

export default Task; 