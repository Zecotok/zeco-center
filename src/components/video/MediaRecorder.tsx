"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMicrophone,
  faVideo,
  faDesktop,
  faTimes,
  faCheckCircle,
  faExclamationTriangle,
  faCog,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import { 
  VideoQuality, 
  AudioQuality, 
  RecordingStatus, 
  RecordingMode 
} from '@/types/videoRecording';
import { 
  VIDEO_QUALITY_OPTIONS, 
  AUDIO_QUALITY_OPTIONS, 
  DEFAULT_QUALITY_ID, 
  DEFAULT_AUDIO_QUALITY_ID,
  getQualityById, 
  getAudioQualityById 
} from '@/libs/videoQualityConfig';

// Format utilities
const formatFileSize = (sizeInMB: number) => {
  if (sizeInMB < 1) {
    return `${(sizeInMB * 1024).toFixed(2)} KB`;
  } else if (sizeInMB < 1024) {
    return `${sizeInMB.toFixed(2)} MB`;
  } else {
    return `${(sizeInMB / 1024).toFixed(2)} GB`;
  }
};

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export interface MediaRecorderProps {
  onMediaCaptured: (blob: Blob, duration: number, fileSize: number) => void;
  onCancel: () => void;
  uploadDirectory?: string; // Optional, e.g., '/videos' or '/task-media'
  initialMode?: RecordingMode;
  showModeSelector?: boolean;
  showSettings?: boolean;
  maxDurationSeconds?: number;
  className?: string;
}

const MediaRecorderComponent: React.FC<MediaRecorderProps> = ({
  onMediaCaptured,
  onCancel,
  uploadDirectory = '/videos',
  initialMode = RecordingMode.VIDEO,
  showModeSelector = true,
  showSettings = true,
  maxDurationSeconds = 600, // 10 minutes default
  className = ''
}) => {
  // State variables for recording settings
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>(
    getQualityById(DEFAULT_QUALITY_ID)
  );
  const [selectedAudioQuality, setSelectedAudioQuality] = useState<AudioQuality>(
    getAudioQualityById(DEFAULT_AUDIO_QUALITY_ID)
  );
  
  // Recording state
  const [recordingMode, setRecordingMode] = useState<RecordingMode>(initialMode);
  const [isWithAudio, setIsWithAudio] = useState<boolean>(true);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>(RecordingStatus.IDLE);
  const [isOptionsOpen, setIsOptionsOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mediaBlobUrl, setMediaBlobUrl] = useState<string | null>(null);
  const [isBrowserSupported, setBrowserSupported] = useState<boolean>(true);
  
  // Refs for media elements
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const recordingStartTime = useRef<number | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // State for file info
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [fileSizePerMinute, setFileSizePerMinute] = useState<number | null>(null);
  const [videoBitrate, setVideoBitrate] = useState<number | null>(null);
  const [videoFps, setVideoFps] = useState<number | null>(null);
  
  // Timer state
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [isStopping, setIsStopping] = useState<boolean>(false);

  // Check browser compatibility and setup media stream on mount
  useEffect(() => {
    const checkBrowserCompatibility = async () => {
      const isMediaRecorderSupported = 
        typeof window !== 'undefined' && 
        typeof window.MediaRecorder !== 'undefined';
      
      const isUserMediaSupported = 
        typeof navigator !== 'undefined' && 
        typeof navigator.mediaDevices !== 'undefined' && 
        typeof navigator.mediaDevices.getUserMedia !== 'undefined';
      
      const isDisplayMediaSupported = 
        typeof navigator !== 'undefined' && 
        typeof navigator.mediaDevices !== 'undefined' && 
        typeof navigator.mediaDevices.getDisplayMedia !== 'undefined';
      
      const isCompatible = isMediaRecorderSupported && isUserMediaSupported;
      setBrowserSupported(isCompatible);
      
      // If screen sharing is selected but not supported, default to video mode
      if (recordingMode === RecordingMode.SCREEN_SHARE && !isDisplayMediaSupported) {
        setRecordingMode(RecordingMode.VIDEO);
        setError('Screen sharing is not supported in this browser.');
      }

      setIsLoading(false);
      
      // Immediately setup media stream when component mounts
      if (isCompatible) {
        try {
          await setupMediaStream();
        } catch (err) {
          console.error('Error setting up initial media stream:', err);
        }
      }
    };

    checkBrowserCompatibility();

    // Cleanup function
    return () => {
      stopMediaTracks();
    };
  }, [recordingMode]);

  // Stop all media tracks when component unmounts or stream changes
  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping media recorder:', err);
      }
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  // Get media constraints based on selected quality and mode
  const getMediaConstraints = () => {
    switch (recordingMode) {
      case RecordingMode.AUDIO_ONLY:
        return {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: { ideal: selectedAudioQuality.sampleRate },
            sampleSize: { ideal: selectedAudioQuality.bitDepth },
            channelCount: { ideal: selectedAudioQuality.channels }
          },
          video: false
        };
      case RecordingMode.SCREEN_SHARE:
        return {
          video: true,
          audio: isWithAudio ? {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: { ideal: selectedAudioQuality.sampleRate },
            sampleSize: { ideal: selectedAudioQuality.bitDepth },
            channelCount: { ideal: selectedAudioQuality.channels }
          } : false
        };
      case RecordingMode.VIDEO:
        return {
          video: {
            width: { ideal: selectedQuality.width },
            height: { ideal: selectedQuality.height },
            frameRate: { ideal: selectedQuality.frameRate }
          },
          audio: isWithAudio ? {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: { ideal: selectedAudioQuality.sampleRate },
            sampleSize: { ideal: selectedAudioQuality.bitDepth },
            channelCount: { ideal: selectedAudioQuality.channels }
          } : false
        };
      default:
        return { audio: true, video: false };
    }
  };

  // Initialize and set up media stream
  const setupMediaStream = async () => {
    try {
      stopMediaTracks();
      setError(null);
      
      recordedChunksRef.current = [];
      
      let stream: MediaStream | null = null;
      
      if (recordingMode === RecordingMode.SCREEN_SHARE) {
        // For screen sharing - show instructions but don't request permissions yet
        // We'll do this when they click record to avoid permission dialogs on initial load
        setError('Click "Start Recording" to select your screen');
        
        // Clear any previous preview
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
        }
        
        return null;
      } else if (recordingMode === RecordingMode.AUDIO_ONLY) {
        // For audio-only recording
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: { ideal: selectedAudioQuality.sampleRate },
            sampleSize: { ideal: selectedAudioQuality.bitDepth },
            channelCount: { ideal: selectedAudioQuality.channels }
          },
          video: false 
        });
      } else {
        // For camera recording
        stream = await navigator.mediaDevices.getUserMedia(getMediaConstraints());
      }
      
      streamRef.current = stream;
      
      // Set up preview if video/audio element exists
      if (recordingMode !== RecordingMode.AUDIO_ONLY && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.muted = true; // Prevent feedback
        await videoPreviewRef.current.play().catch(e => console.error('Error playing video:', e));
      } else if (recordingMode === RecordingMode.AUDIO_ONLY && audioPreviewRef.current) {
        audioPreviewRef.current.srcObject = stream;
        audioPreviewRef.current.muted = true; // Prevent feedback
      }
      
      return stream;
    } catch (err) {
      console.error('Error setting up media stream:', err);
      setError(`Failed to access ${recordingMode === RecordingMode.SCREEN_SHARE ? 'screen' : recordingMode === RecordingMode.AUDIO_ONLY ? 'microphone' : 'camera'}: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  };

  // Start recording
  const startRecording = async () => {
    if (recordingStatus !== RecordingStatus.IDLE) {
      return;
    }
    
    setError(null);
    setMediaBlobUrl(null);
    setRecordingTime(0);
    setRecordingStatus(RecordingStatus.PROCESSING);
    
    try {
      // For screen sharing, we need to handle it specially since getDisplayMedia must be
      // triggered by a user action (like clicking the start recording button)
      let stream: MediaStream | null = null;
      
      if (recordingMode === RecordingMode.SCREEN_SHARE) {
        try {
          // @ts-ignore - TypeScript doesn't know about getDisplayMedia yet
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: isWithAudio
          });
          
          // If audio is enabled, we need to get it separately and combine with screen share
          if (isWithAudio) {
            try {
              const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  sampleRate: { ideal: selectedAudioQuality.sampleRate },
                  sampleSize: { ideal: selectedAudioQuality.bitDepth },
                  channelCount: { ideal: selectedAudioQuality.channels }
                }
              });
              
              // Combine the screen video track with the audio track
              audioStream.getAudioTracks().forEach(track => {
                stream?.addTrack(track);
              });
            } catch (audioErr) {
              console.warn('Could not capture audio:', audioErr);
            }
          }
          
          streamRef.current = stream;
          
          // Set up preview
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
            videoPreviewRef.current.muted = true; // Prevent feedback
            await videoPreviewRef.current.play().catch(e => console.error('Error playing video:', e));
          }
        } catch (err) {
          console.error('Error accessing display media:', err);
          setError(`Failed to access screen: ${err instanceof Error ? err.message : String(err)}`);
          setRecordingStatus(RecordingStatus.ERROR);
          return;
        }
      } else {
        // For audio and video, use the normal setup
        stream = await setupMediaStream();
      }
      
      if (!stream) {
        setRecordingStatus(RecordingStatus.ERROR);
        return;
      }
      
      // Find supported MIME type based on recording mode
      let mimeTypeOptions: string[] = [];
      
      if (recordingMode === RecordingMode.AUDIO_ONLY) {
        mimeTypeOptions = [
          'audio/webm;codecs=opus',
          'audio/ogg;codecs=opus',
          'audio/mp4',
          'audio/webm'
        ];
      } else {
        mimeTypeOptions = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm;codecs=h264,opus',
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
          'video/mp4'
        ];
      }
      
      let mimeType = '';
      for (const type of mimeTypeOptions) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      if (!mimeType) {
        throw new Error(`No supported ${recordingMode === RecordingMode.AUDIO_ONLY ? 'audio' : 'video'} format found in this browser`);
      }
      
      // Create and configure MediaRecorder
      const options: MediaRecorderOptions = {
        mimeType
      };
      
      // Add appropriate bitrate settings
      if (recordingMode === RecordingMode.AUDIO_ONLY) {
        options.audioBitsPerSecond = selectedAudioQuality.bitrate;
      } else {
        options.videoBitsPerSecond = selectedQuality.bitrate;
        if (isWithAudio) {
          options.audioBitsPerSecond = selectedAudioQuality.bitrate;
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstart = () => {
        setRecordingStatus(RecordingStatus.RECORDING);
        recordingStartTime.current = Date.now();
        
        // Start the recording timer
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(prev => {
            const newTime = prev + 1;
            // Auto-stop if max duration is reached
            if (newTime >= maxDurationSeconds) {
              stopRecording();
            }
            return newTime;
          });
        }, 1000);
      };
      
      mediaRecorder.onstop = () => {
        // Calculate duration
        const durationInSeconds = recordingStartTime.current 
          ? Math.floor((Date.now() - recordingStartTime.current) / 1000)
          : 0;
        
        setVideoDuration(durationInSeconds);
        
        // Stop the timer
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        
        // Create blob from recorded chunks
        if (recordedChunksRef.current.length) {
          const blob = new Blob(recordedChunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          setMediaBlobUrl(url);
          
          // Calculate file size and MB per minute
          const fileSizeInBytes = blob.size;
          const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
          setFileSize(fileSizeInMB);
          
          if (durationInSeconds > 0) {
            const minutesDuration = durationInSeconds / 60;
            const mbPerMinute = fileSizeInMB / minutesDuration;
            setFileSizePerMinute(mbPerMinute);
            
            // Calculate and set bitrate in Kbps (kilobits per second)
            const bitrate = (fileSizeInBytes * 8) / (durationInSeconds * 1000);
            setVideoBitrate(bitrate);
          }
          
          // Set FPS based on recording quality or default to the selected quality
          if (recordingMode === RecordingMode.VIDEO || recordingMode === RecordingMode.SCREEN_SHARE) {
            setVideoFps(selectedQuality.frameRate);
          } else {
            setVideoFps(null);
          }
          
          // Update preview source
          if (recordingMode !== RecordingMode.AUDIO_ONLY && videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = null;
            videoPreviewRef.current.src = url;
            videoPreviewRef.current.muted = false;
          } else if (recordingMode === RecordingMode.AUDIO_ONLY && audioPreviewRef.current) {
            audioPreviewRef.current.srcObject = null;
            audioPreviewRef.current.src = url;
            audioPreviewRef.current.muted = false;
          }
        }
        
        setRecordingStatus(RecordingStatus.STOPPED);
        setIsStopping(false);
      };
      
      // Request data every second to enable pausing
      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(`Failed to start recording: ${err instanceof Error ? err.message : String(err)}`);
      setRecordingStatus(RecordingStatus.ERROR);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (recordingStatus !== RecordingStatus.RECORDING) {
      return;
    }
    
    setIsStopping(true);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        
        // Stop video tracks to turn off camera/screenshare
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        console.error('Error stopping recording:', err);
        setError(`Failed to stop recording: ${err instanceof Error ? err.message : String(err)}`);
        setIsStopping(false);
      }
    }
  };

  // Discard recording
  const discardRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Reset video/audio elements
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
      videoPreviewRef.current.src = '';
    }
    
    if (audioPreviewRef.current) {
      audioPreviewRef.current.srcObject = null;
      audioPreviewRef.current.src = '';
    }
    
    // Clean up blob URL
    if (mediaBlobUrl) {
      URL.revokeObjectURL(mediaBlobUrl);
    }
    
    // Reset state
    setMediaBlobUrl(null);
    setRecordingStatus(RecordingStatus.IDLE);
    setError(null);
    setRecordingTime(0);
    setFileSize(null);
    setFileSizePerMinute(null);
    setVideoBitrate(null);
    setVideoFps(null);
    setIsStopping(false);
    
    onCancel();
  };

  // Submit the recording
  const submitRecording = async () => {
    if (!mediaBlobUrl || recordingStatus !== RecordingStatus.STOPPED) {
      return;
    }
    
    try {
      // Convert blob URL to blob
      const response = await fetch(mediaBlobUrl);
      const blob = await response.blob();
      
      // Send the blob to the parent component
      if (blob) {
        onMediaCaptured(blob, videoDuration, fileSize || 0);
      }
    } catch (err) {
      console.error('Error submitting recording:', err);
      setError(`Failed to submit recording: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  if (isLoading) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading media recorder...</p>
      </div>
    );
  }

  if (!isBrowserSupported) {
    return (
      <div className={`p-4 bg-red-50 border border-red-300 rounded-md ${className}`}>
        <div className="flex items-center text-red-700 mb-2">
          <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
          <h3 className="font-medium">Browser Not Supported</h3>
        </div>
        <p className="text-sm text-red-600">
          Your browser does not support the required APIs for media recording. 
          Please try using a modern browser like Chrome, Firefox, or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg bg-white shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 border-b px-4 py-3 flex justify-between items-center">
        <h3 className="font-medium">
          {recordingStatus === RecordingStatus.RECORDING ? (
            <span className="flex items-center">
              <span className="animate-pulse text-red-600 mr-2">●</span> Recording
            </span>
          ) : recordingStatus === RecordingStatus.STOPPED ? (
            <span className="flex items-center">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 mr-2" /> Recording Complete
            </span>
          ) : (
            `${recordingMode === RecordingMode.AUDIO_ONLY ? 'Audio' : recordingMode === RecordingMode.SCREEN_SHARE ? 'Screen' : 'Video'} Recorder`
          )}
        </h3>
        
        {recordingStatus !== RecordingStatus.RECORDING && (
          <button
            type="button"
            onClick={() => setIsOptionsOpen(!isOptionsOpen)}
            className="text-gray-500 hover:text-gray-700"
            title="Settings"
          >
            <FontAwesomeIcon icon={faCog} />
          </button>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700">
          <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
          {error}
        </div>
      )}
      
      {/* Mode Selector */}
      {recordingStatus !== RecordingStatus.RECORDING && showModeSelector && (
        <div className="px-4 py-3 border-b">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setRecordingMode(RecordingMode.AUDIO_ONLY);
                setupMediaStream();
              }}
              className={`flex flex-col items-center justify-center p-3 rounded border ${
                recordingMode === RecordingMode.AUDIO_ONLY 
                  ? 'bg-blue-100 border-blue-400 text-blue-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FontAwesomeIcon icon={faMicrophone} className="text-xl mb-1" />
              <span className="text-xs font-medium">Audio Only</span>
            </button>
            
            <button
              type="button"
              onClick={() => {
                setRecordingMode(RecordingMode.SCREEN_SHARE);
                setupMediaStream();
              }}
              className={`flex flex-col items-center justify-center p-3 rounded border ${
                recordingMode === RecordingMode.SCREEN_SHARE 
                  ? 'bg-blue-100 border-blue-400 text-blue-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FontAwesomeIcon icon={faDesktop} className="text-xl mb-1" />
              <span className="text-xs font-medium">Screen Sharing</span>
            </button>
            
            <button
              type="button"
              onClick={() => {
                setRecordingMode(RecordingMode.VIDEO);
                setupMediaStream();
              }}
              className={`flex flex-col items-center justify-center p-3 rounded border ${
                recordingMode === RecordingMode.VIDEO 
                  ? 'bg-blue-100 border-blue-400 text-blue-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FontAwesomeIcon icon={faVideo} className="text-xl mb-1" />
              <span className="text-xs font-medium">Video</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Settings Panel */}
      {isOptionsOpen && showSettings && (
        <div className="bg-gray-50 p-4 border-b space-y-3">
          {recordingMode !== RecordingMode.AUDIO_ONLY && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video Quality
              </label>
              <select
                value={selectedQuality.id}
                onChange={(e) => setSelectedQuality(getQualityById(e.target.value))}
                className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={recordingStatus !== RecordingStatus.IDLE}
              >
                {VIDEO_QUALITY_OPTIONS.map((quality) => (
                  <option key={quality.id} value={quality.id}>
                    {quality.label} ({quality.width}x{quality.height}, {quality.frameRate} fps)
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Audio Quality
            </label>
            <select
              value={selectedAudioQuality.id}
              onChange={(e) => setSelectedAudioQuality(getAudioQualityById(e.target.value))}
              className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
              disabled={recordingStatus !== RecordingStatus.IDLE || (recordingMode !== RecordingMode.AUDIO_ONLY && !isWithAudio)}
            >
              {AUDIO_QUALITY_OPTIONS.map((quality) => (
                <option key={quality.id} value={quality.id}>
                  {quality.label} ({quality.bitrate / 1000}kbps, {quality.sampleRate / 1000}kHz)
                </option>
              ))}
            </select>
          </div>
          
          {recordingMode !== RecordingMode.AUDIO_ONLY && (
            <div className="flex items-center">
              <input
                id="with-audio"
                type="checkbox"
                checked={isWithAudio}
                onChange={() => setIsWithAudio(!isWithAudio)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={recordingStatus !== RecordingStatus.IDLE}
              />
              <label htmlFor="with-audio" className="ml-2 block text-sm text-gray-700">
                Record Audio
              </label>
            </div>
          )}
        </div>
      )}
      
      {/* Media Preview */}
      <div className="p-4">
        {recordingMode === RecordingMode.AUDIO_ONLY ? (
          <div className="flex flex-col items-center justify-center bg-gray-50 rounded p-4 min-h-[100px]">
            <div className="w-full">
              <audio 
                ref={audioPreviewRef} 
                controls={recordingStatus === RecordingStatus.STOPPED} 
                className={`w-full ${recordingStatus !== RecordingStatus.STOPPED ? 'hidden' : ''}`} 
              >
                Your browser does not support the audio element.
              </audio>
              
              {recordingStatus !== RecordingStatus.STOPPED && (
                <div className="flex items-center justify-center h-24">
                  {recordingStatus === RecordingStatus.RECORDING ? (
                    <div className="flex flex-col items-center">
                      <div className="flex space-x-1">
                        <div className="w-2 h-8 bg-blue-500 rounded-full animate-pulse"></div>
                        <div className="w-2 h-8 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-8 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                      <div className="mt-2 text-sm font-medium">
                        Recording audio... {formatDuration(recordingTime)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <FontAwesomeIcon icon={faMicrophone} className="text-3xl" />
                      <p className="mt-2 text-sm">Ready to record audio</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative w-full max-h-[240px] h-[240px] overflow-hidden bg-black rounded">
            <video 
              ref={videoPreviewRef} 
              controls={recordingStatus === RecordingStatus.STOPPED} 
              className="w-full h-full object-cover"
            >
              Your browser does not support the video element.
            </video>
            
            {/* Recording indicator and timer */}
            {recordingStatus === RecordingStatus.RECORDING && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-sm px-2 py-1 rounded-md flex items-center">
                <div className="animate-pulse mr-2 w-2 h-2 rounded-full bg-red-600"></div>
                {formatDuration(recordingTime)}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Stats (visible only when recording is complete) */}
      {recordingStatus === RecordingStatus.STOPPED && fileSize !== null && (
        <div className="px-4 pb-4">
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Recording Details</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>Duration: {formatDuration(videoDuration)}</div>
              <div>Size: {formatFileSize(fileSize)}</div>
              
              {fileSizePerMinute !== null && (
                <div className="col-span-2">
                  Data rate: ~{fileSizePerMinute.toFixed(2)} MB/minute
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Controls */}
      <div className="bg-gray-50 px-4 py-3 border-t flex justify-between items-center">
        {recordingStatus === RecordingStatus.RECORDING ? (
          <>
            <button
              type="button"
              onClick={discardRecording}
              className="px-3 py-1 text-gray-700 hover:text-gray-900"
              disabled={isStopping}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className={`px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-200 ${isStopping ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isStopping}
            >
              {isStopping ? 'Stopping...' : 'Stop Recording'}
            </button>
          </>
        ) : recordingStatus === RecordingStatus.STOPPED ? (
          <>
            <button
              type="button"
              onClick={discardRecording}
              className="px-3 py-1 text-gray-700 hover:text-gray-900"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={submitRecording}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-200 flex items-center"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
              Use Recording
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={startRecording}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
            >
              Start Recording
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MediaRecorderComponent; 