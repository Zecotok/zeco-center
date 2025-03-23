import { VideoQuality, AudioQuality } from '@/types/videoRecording';

export const VIDEO_QUALITY_OPTIONS: VideoQuality[] = [
  {
    id: 'low',
    label: 'Low (480p)',
    width: 854,
    height: 480,
    frameRate: 15
  },
  {
    id: 'medium',
    label: 'Medium (720p)',
    width: 1280,
    height: 720,
    frameRate: 25
  },
  {
    id: 'high',
    label: 'High (1080p)',
    width: 1920,
    height: 1080,
    frameRate: 30
  },
  {
    id: 'ultra',
    label: 'Ultra (2K)',
    width: 2560,
    height: 1440,
    frameRate: 30
  }
];

export const AUDIO_QUALITY_OPTIONS: AudioQuality[] = [
  {
    id: 'audio-low',
    label: 'Low',
    bitrate: 64000,
    sampleRate: 22050,
    bitDepth: 16,
    channels: 1
  },
  {
    id: 'audio-medium',
    label: 'Medium',
    bitrate: 128000,
    sampleRate: 44100,
    bitDepth: 16,
    channels: 2
  },
  {
    id: 'audio-high',
    label: 'High',
    bitrate: 192000,
    sampleRate: 48000,
    bitDepth: 24,
    channels: 2
  },
  {
    id: 'audio-studio',
    label: 'Studio',
    bitrate: 320000,
    sampleRate: 96000, 
    bitDepth: 24,
    channels: 2
  }
];

export const DEFAULT_QUALITY_ID = 'medium';
export const DEFAULT_AUDIO_QUALITY_ID = 'audio-low';

export const getQualityById = (id: string): VideoQuality => {
  const quality = VIDEO_QUALITY_OPTIONS.find(q => q.id === id);
  if (!quality) {
    return VIDEO_QUALITY_OPTIONS.find(q => q.id === DEFAULT_QUALITY_ID)!;
  }
  return quality;
};

export const getAudioQualityById = (id: string): AudioQuality => {
  const quality = AUDIO_QUALITY_OPTIONS.find(q => q.id === id);
  return quality || AUDIO_QUALITY_OPTIONS.find(q => q.id === DEFAULT_AUDIO_QUALITY_ID)!;
}; 