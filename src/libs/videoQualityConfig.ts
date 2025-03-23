import { VideoQuality } from '@/types/videoRecording';

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

export const DEFAULT_QUALITY_ID = 'medium';

export const getQualityById = (id: string): VideoQuality => {
  const quality = VIDEO_QUALITY_OPTIONS.find(q => q.id === id);
  if (!quality) {
    return VIDEO_QUALITY_OPTIONS.find(q => q.id === DEFAULT_QUALITY_ID)!;
  }
  return quality;
}; 