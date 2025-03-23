export interface VideoQuality {
  id: string;
  label: string;
  width: number;
  height: number;
  frameRate: number;
}

export interface AudioQuality {
  id: string;
  label: string;
  bitrate: number;
  sampleRate: number;
  bitDepth: number;
  channels: number;
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

// Define the RecordingMode enum with the values used in VideoRecorder component
export enum RecordingMode {
  AUDIO_ONLY = 'audio_only',
  SCREEN_SHARE = 'screen_share',
  VIDEO = 'video'
} 