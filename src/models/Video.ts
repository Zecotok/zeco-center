import mongoose, { Schema } from 'mongoose';
import { RecordedVideo } from '../types/videoRecording';

const VideoSchema = new Schema<RecordedVideo>(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    duration: { type: Number, required: true },
    quality: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.models.Video || mongoose.model<RecordedVideo>('Video', VideoSchema); 