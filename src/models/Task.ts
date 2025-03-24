import mongoose, { Schema } from 'mongoose';

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TaskStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PENDING = 'PENDING',
  ON_HOLD = 'ON_HOLD'
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
  _id?: string;
  title: string;
  description?: string;
  assignedTo: (mongoose.Types.ObjectId | string)[];
  createdBy: mongoose.Types.ObjectId | string;
  dueDate: Date | string;
  priority: TaskPriority;
  status: TaskStatus;
  completedAt?: Date | string;
  attachments?: IAttachment[];
  videoIds?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Only define the schema on the server side
const TaskSchema = new Schema<ITask>(
  {
    title: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String 
    },
    assignedTo: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    }],
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    dueDate: { 
      type: Date, 
      required: true 
    },
    priority: { 
      type: String, 
      enum: Object.values(TaskPriority), 
      default: TaskPriority.MEDIUM 
    },
    status: { 
      type: String, 
      enum: Object.values(TaskStatus), 
      default: TaskStatus.NOT_STARTED 
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
TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ createdBy: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });

// Check if we're on the server side
const isServer = typeof window === 'undefined';

// Only create the model on the server side
const Task = isServer 
  ? (mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema))
  : null;

export default Task; 