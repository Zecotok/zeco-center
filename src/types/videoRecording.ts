export interface VideoQuality {
  id: string;
  label: string;
  width: number;
  height: number;
  frameRate: number;
}

export interface RecordedVideo {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  duration: number;
  quality: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoRecordingOptions {
  quality: VideoQuality;
  withAudio: boolean;
  captureScreen: boolean;
  captureCamera: boolean;
}

export enum RecordingStatus {
  IDLE = 'idle',
  RECORDING = 'recording',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  PROCESSING = 'processing',
  ERROR = 'error'
} 