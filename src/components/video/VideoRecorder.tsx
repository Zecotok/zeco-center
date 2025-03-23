'use client';

import React, { useState, useRef, useEffect } from 'react';
import { VideoQuality, RecordingStatus, AudioQuality, RecordingMode } from '@/types/videoRecording';
import { VIDEO_QUALITY_OPTIONS, DEFAULT_QUALITY_ID, getQualityById, AUDIO_QUALITY_OPTIONS, DEFAULT_AUDIO_QUALITY_ID, getAudioQualityById } from '@/libs/videoQualityConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faVideoSlash, faPause, faPlay, faStop, faTrash, faCog, faCheckCircle, faMicrophone, faDesktop } from '@fortawesome/free-solid-svg-icons';

interface VideoRecorderProps {
  onVideoSaved: (videoData: any) => void;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({ onVideoSaved }) => {
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>(
    getQualityById(DEFAULT_QUALITY_ID)
  );
  const [selectedAudioQuality, setSelectedAudioQuality] = useState<AudioQuality>(
    getAudioQualityById(DEFAULT_AUDIO_QUALITY_ID)
  );
  
  // New recording mode state
  const [recordingMode, setRecordingMode] = useState<RecordingMode>(RecordingMode.AUDIO_ONLY);
  const [isWithAudio, setIsWithAudio] = useState<boolean>(true);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>(RecordingStatus.IDLE);
  const [isOptionsOpen, setIsOptionsOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [mediaBlobUrl, setMediaBlobUrl] = useState<string | null>(null);
  const [browserSupported, setBrowserSupported] = useState<boolean>(true);
  
  // New state for file size info
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [fileSizePerMinute, setFileSizePerMinute] = useState<number | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingStartTime = useRef<number | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  // Initialize component on mount
  useEffect(() => {
    setIsLoading(false);
    setIsMounted(true);

    // Check browser support
    if (typeof window === 'undefined' || 
        !navigator.mediaDevices || 
        !window.MediaRecorder) {
      setBrowserSupported(false);
    }
    
    return () => {
      stopMediaTracks();
      setIsMounted(false);
    };
  }, []);

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
          video: {
            cursor: "always",
            displaySurface: "monitor"
          },
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
      
      let stream: MediaStream;
      
      if (recordingMode === RecordingMode.SCREEN_SHARE) {
        // For screen capture
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            displaySurface: 'monitor'
          },
          audio: isWithAudio
        } as MediaStreamConstraints);
        
        // If audio is requested but not available in screen stream, get it separately
        if (isWithAudio && !stream.getAudioTracks().length) {
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStream.getAudioTracks().forEach(track => stream.addTrack(track));
          } catch (err) {
            console.warn('Could not add audio to screen capture:', err);
          }
        }
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
        await videoPreviewRef.current.play();
      } else if (recordingMode === RecordingMode.AUDIO_ONLY && audioPreviewRef.current) {
        audioPreviewRef.current.srcObject = stream;
        audioPreviewRef.current.muted = true; // Prevent feedback
      }
      
      return stream;
    } catch (err: any) {
      console.error('Error accessing media devices:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Permission denied. Please allow access to camera/microphone or screen sharing.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera or microphone found on this device.');
      } else {
        setError(`Could not access media: ${err.message || 'Unknown error'}`);
      }
      
      setRecordingStatus(RecordingStatus.ERROR);
      return null;
    }
  };

  // Start recording with the configured settings
  const startRecording = async () => {
    if (recordingStatus !== RecordingStatus.IDLE && recordingStatus !== RecordingStatus.STOPPED) {
      return;
    }
    
    recordedChunksRef.current = [];
    setMediaBlobUrl(null);
    setFileSize(null);
    setFileSizePerMinute(null);
    
    try {
      const stream = await setupMediaStream();
      if (!stream) return;
      
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
      };
      
      mediaRecorder.onstop = () => {
        // Calculate duration
        const durationInSeconds = recordingStartTime.current 
          ? Math.floor((Date.now() - recordingStartTime.current) / 1000)
          : 0;
        
        setVideoDuration(durationInSeconds);
        
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
      };
      
      mediaRecorder.onpause = () => setRecordingStatus(RecordingStatus.PAUSED);
      mediaRecorder.onresume = () => setRecordingStatus(RecordingStatus.RECORDING);
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording error occurred. Try again with different settings.');
        setRecordingStatus(RecordingStatus.ERROR);
      };
      
      // Start the recorder
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError(`Failed to start recording: ${err.message || 'Unknown error'}`);
      setRecordingStatus(RecordingStatus.ERROR);
    }
  };
  
  // Stop the current recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      stopMediaTracks();
    }
  };
  
  // Pause the current recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
  };
  
  // Resume a paused recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
  };
  
  // Discard the current recording
  const discardRecording = () => {
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    
    stopMediaTracks();
    recordedChunksRef.current = [];
    
    if (mediaBlobUrl) {
      URL.revokeObjectURL(mediaBlobUrl);
      setMediaBlobUrl(null);
    }
    
    setRecordingStatus(RecordingStatus.IDLE);
    setTitle('');
    setDescription('');
    setVideoDuration(0);
    setFileSize(null);
    setFileSizePerMinute(null);
    recordingStartTime.current = null;
    
    // Reset preview
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
      videoPreviewRef.current.src = '';
    }
    if (audioPreviewRef.current) {
      audioPreviewRef.current.srcObject = null;
      audioPreviewRef.current.src = '';
    }
  };
  
  // Handle recording controls
  const handleStartRecording = () => startRecording();
  const handleStopRecording = () => stopRecording();
  
  const handlePauseResumeRecording = () => {
    if (recordingStatus === RecordingStatus.RECORDING) {
      pauseRecording();
    } else if (recordingStatus === RecordingStatus.PAUSED) {
      resumeRecording();
    }
  };
  
  const handleDiscardRecording = () => discardRecording();
  
  // Save recording to server
  const handleSaveRecording = async () => {
    if (!mediaBlobUrl) {
      setError('No recording available');
      return;
    }

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setRecordingStatus(RecordingStatus.PROCESSING);
    setError(null);

    try {
      // Convert blob URL to file
      const response = await fetch(mediaBlobUrl);
      const blob = await response.blob();
      
      // Determine file extension based on recording mode and blob type
      let fileExtension = 'webm';
      if (blob.type.includes('mp4')) fileExtension = 'mp4';
      else if (blob.type.includes('ogg')) fileExtension = 'ogg';
      else if (recordingMode === RecordingMode.AUDIO_ONLY) fileExtension = 'webm';
      
      const file = new File(
        [blob], 
        `recording-${Date.now()}.${fileExtension}`, 
        { type: blob.type }
      );

      // Upload file to server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('recordingMode', recordingMode);

      const uploadRes = await fetch('/api/videos/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload recording');
      }

      const uploadData = await uploadRes.json();

      // Save recording metadata
      const recordingData = {
        title,
        description,
        fileName: uploadData.fileName,
        filePath: uploadData.filePath,
        fileSize: uploadData.fileSize,
        duration: videoDuration,
        quality: recordingMode === RecordingMode.AUDIO_ONLY 
          ? selectedAudioQuality.id 
          : selectedQuality.id,
        recordingMode
      };

      const metadataRes = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recordingData)
      });

      if (!metadataRes.ok) {
        throw new Error('Failed to save recording metadata');
      }

      const result = await metadataRes.json();
      
      // Clean up
      if (mediaBlobUrl) {
        URL.revokeObjectURL(mediaBlobUrl);
      }
      
      setRecordingStatus(RecordingStatus.IDLE);
      setTitle('');
      setDescription('');
      setVideoDuration(0);
      setFileSize(null);
      setFileSizePerMinute(null);
      recordingStartTime.current = null;
      setMediaBlobUrl(null);
      
      // Notify parent component
      onVideoSaved(result.video);
    } catch (err: any) {
      console.error("Error saving recording:", err);
      setError(`Error saving recording: ${err.message || 'Unknown error'}`);
      setRecordingStatus(RecordingStatus.ERROR);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours > 0 ? String(hours).padStart(2, '0') : null,
      String(minutes).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  const formatFileSize = (sizeInMB: number): string => {
    if (sizeInMB < 1) {
      return `${(sizeInMB * 1024).toFixed(2)} KB`;
    } else {
      return `${sizeInMB.toFixed(2)} MB`;
    }
  };

  // Return early for unsupported browsers or loading state
  if (!browserSupported) {
    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="text-center p-6">
          <FontAwesomeIcon icon={faVideoSlash} className="text-red-500 text-4xl mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Recording Not Supported</h3>
          <p className="text-gray-600">
            Your browser does not support recording functionality. 
            Please try using a modern browser like Chrome, Firefox, or Edge.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !isMounted) {
    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-12 h-12 border-t-4 border-indigo-500 border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading recorder component...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Media Recorder</h2>
          <button
            onClick={() => setIsOptionsOpen(!isOptionsOpen)}
            className="p-2 text-gray-600 hover:text-gray-800"
            title="Recording options"
          >
            <FontAwesomeIcon icon={faCog} />
          </button>
        </div>

        {isOptionsOpen && (
          <div className="bg-gray-50 p-3 rounded-md space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recording Mode
              </label>
              <select
                value={recordingMode}
                onChange={(e) => setRecordingMode(e.target.value as RecordingMode)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={recordingStatus !== RecordingStatus.IDLE}
              >
                <option value={RecordingMode.AUDIO_ONLY}>Audio Only</option>
                <option value={RecordingMode.SCREEN_SHARE}>Screen Sharing</option>
                <option value={RecordingMode.VIDEO}>Video (Camera)</option>
              </select>
            </div>
            
            {recordingMode !== RecordingMode.AUDIO_ONLY && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video Quality
                </label>
                <select
                  value={selectedQuality.id}
                  onChange={(e) => setSelectedQuality(getQualityById(e.target.value))}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
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
        <div className="border rounded-md bg-black aspect-video flex items-center justify-center overflow-hidden">
          {recordingMode !== RecordingMode.AUDIO_ONLY ? (
            // Video preview
            recordingStatus === RecordingStatus.STOPPED && mediaBlobUrl ? (
              <video
                ref={videoPreviewRef}
                controls
                className="w-full h-full"
                src={mediaBlobUrl}
              />
            ) : (
              <div className="relative w-full h-full">
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full ${recordingStatus === RecordingStatus.RECORDING ? 'border-2 border-red-500' : ''}`}
                />
                
                {recordingStatus !== RecordingStatus.RECORDING && recordingStatus !== RecordingStatus.PAUSED && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-center p-4">
                    <div>
                      <FontAwesomeIcon icon={recordingMode === RecordingMode.SCREEN_SHARE ? faDesktop : faVideo} size="3x" />
                      <p className="mt-2">
                        {recordingStatus === RecordingStatus.ERROR
                          ? "Error occurred"
                          : `Click 'Start Recording' to begin ${recordingMode === RecordingMode.SCREEN_SHARE ? 'screen sharing' : 'video recording'}`}
                      </p>
                    </div>
                  </div>
                )}
                
                {recordingStatus === RecordingStatus.RECORDING && (
                  <div className="absolute top-2 right-2 bg-red-600 px-2 py-1 rounded-md text-white text-sm font-medium animate-pulse">
                    Recording...
                  </div>
                )}
                
                {recordingStatus === RecordingStatus.PAUSED && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 text-white">
                    <div className="text-center">
                      <p className="text-xl font-bold">Recording Paused</p>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            // Audio preview
            <div className="w-full h-full flex flex-col items-center justify-center text-white">
              {recordingStatus === RecordingStatus.STOPPED && mediaBlobUrl ? (
                <div className="text-center w-full max-w-md">
                  <div className="py-5">
                    <FontAwesomeIcon icon={faMicrophone} size="3x" className="mb-4" />
                    <h3 className="text-lg font-medium mb-2">Audio Recording</h3>
                  </div>
                  <audio 
                    ref={audioPreviewRef}
                    controls 
                    className="w-full" 
                    src={mediaBlobUrl}
                  />
                </div>
              ) : (
                <div className="text-center">
                  <FontAwesomeIcon 
                    icon={faMicrophone} 
                    size="3x" 
                    className={`mb-4 ${recordingStatus === RecordingStatus.RECORDING ? 'text-red-500 animate-pulse' : ''}`} 
                  />
                  <p className="text-lg">
                    {recordingStatus === RecordingStatus.RECORDING
                      ? "Recording audio..."
                      : recordingStatus === RecordingStatus.PAUSED
                      ? "Recording paused"
                      : "Click 'Start Recording' to begin audio recording"}
                  </p>
                  <audio ref={audioPreviewRef} className="hidden" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recording Controls */}
        <div className="flex space-x-2">
          {recordingStatus === RecordingStatus.IDLE || recordingStatus === RecordingStatus.STOPPED ? (
            <button
              onClick={handleStartRecording}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              disabled={recordingStatus === RecordingStatus.PROCESSING || recordingStatus === RecordingStatus.ERROR}
            >
              <FontAwesomeIcon 
                icon={
                  recordingMode === RecordingMode.AUDIO_ONLY 
                    ? faMicrophone 
                    : recordingMode === RecordingMode.SCREEN_SHARE 
                    ? faDesktop 
                    : faVideo
                } 
                className="mr-2" 
              />
              Start {recordingMode === RecordingMode.AUDIO_ONLY ? 'Audio Recording' : recordingMode === RecordingMode.SCREEN_SHARE ? 'Screen Recording' : 'Video Recording'}
            </button>
          ) : (
            <>
              <button
                onClick={handlePauseResumeRecording}
                className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                disabled={recordingStatus === RecordingStatus.PROCESSING || recordingStatus === RecordingStatus.ERROR}
              >
                <FontAwesomeIcon
                  icon={recordingStatus === RecordingStatus.PAUSED ? faPlay : faPause}
                  className="mr-2"
                />
                {recordingStatus === RecordingStatus.PAUSED ? "Resume" : "Pause"}
              </button>
              <button
                onClick={handleStopRecording}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                disabled={recordingStatus === RecordingStatus.PROCESSING || recordingStatus === RecordingStatus.ERROR}
              >
                <FontAwesomeIcon icon={faStop} className="mr-2" />
                Stop
              </button>
            </>
          )}
        </div>

        {/* Recording Information Form (visible after recording) */}
        {recordingStatus === RecordingStatus.STOPPED && mediaBlobUrl && (
          <div className="space-y-3 pt-2 border-t">
            <div>
              <label htmlFor="recording-title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                id="recording-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter recording title"
                required
              />
            </div>
            
            <div>
              <label htmlFor="recording-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="recording-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter recording description"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">Duration:</span> {formatDuration(videoDuration)}
              </div>
              {fileSize !== null && (
                <div>
                  <span className="font-medium">File Size:</span> {formatFileSize(fileSize)}
                </div>
              )}
              {fileSizePerMinute !== null && (
                <div>
                  <span className="font-medium">MB/Minute:</span> {fileSizePerMinute.toFixed(2)} MB
                </div>
              )}
            </div>
            
            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleSaveRecording}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                disabled={!title.trim() || recordingStatus !== RecordingStatus.STOPPED}
              >
                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                {recordingStatus === RecordingStatus.PROCESSING ? "Saving..." : "Save Recording"}
              </button>
              <button
                onClick={handleDiscardRecording}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                disabled={recordingStatus !== RecordingStatus.STOPPED}
              >
                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoRecorder; 