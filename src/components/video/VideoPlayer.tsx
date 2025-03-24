'use client';

import React, { useRef, useEffect, useState } from 'react';
import { RecordedVideo } from '@/types/videoRecording';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExpand, faCompress, faPlay, faPause, faVolumeMute, faVolumeUp } from '@fortawesome/free-solid-svg-icons';

interface VideoPlayerProps {
  video: RecordedVideo | null;
  onClose?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    if (video && videoRef.current) {
      // Reset player state
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setLoading(true);
      setError(null);
      
      // Set video source
      videoRef.current.src = `/api/videos/stream/${video.id}`;
      videoRef.current.load();
    }
    
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
    };
  }, [video, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    const onTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };
    
    const onDurationChange = () => {
      setDuration(videoElement.duration);
    };
    
    const onPlay = () => {
      setIsPlaying(true);
    };
    
    const onPause = () => {
      setIsPlaying(false);
    };
    
    const onVolumeChange = () => {
      setVolume(videoElement.volume);
      setIsMuted(videoElement.muted);
    };
    
    const onLoadedData = () => {
      setLoading(false);
    };
    
    const onError = () => {
      setError('Failed to load video');
      setLoading(false);
    };
    
    videoElement.addEventListener('timeupdate', onTimeUpdate);
    videoElement.addEventListener('durationchange', onDurationChange);
    videoElement.addEventListener('play', onPlay);
    videoElement.addEventListener('pause', onPause);
    videoElement.addEventListener('volumechange', onVolumeChange);
    videoElement.addEventListener('loadeddata', onLoadedData);
    videoElement.addEventListener('error', onError);
    
    return () => {
      videoElement.removeEventListener('timeupdate', onTimeUpdate);
      videoElement.removeEventListener('durationchange', onDurationChange);
      videoElement.removeEventListener('play', onPlay);
      videoElement.removeEventListener('pause', onPause);
      videoElement.removeEventListener('volumechange', onVolumeChange);
      videoElement.removeEventListener('loadeddata', onLoadedData);
      videoElement.removeEventListener('error', onError);
    };
  }, [isMounted]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  if (!video) {
    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-500">No video selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{video.title}</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800"
            >
              &times;
            </button>
          )}
        </div>
        
        {video.description && (
          <p className="text-sm text-gray-600">{video.description}</p>
        )}
        
        <div 
          ref={containerRef}
          className={`relative bg-black ${isFullscreen ? 'w-full h-full' : 'h-[150px]'}`}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
              Loading...
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
              {error}
            </div>
          )}
          
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            controls={false}
            preload="metadata"
          />
          
          {/* Custom Video Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white px-4 py-2">
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePlayPause}
                className="text-white hover:text-indigo-400 transition-colors"
              >
                <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
              </button>
              
              <div className="flex-grow flex items-center space-x-2">
                <span className="text-sm">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  className="w-full h-1"
                  min={0}
                  max={duration || 100}
                  step={0.01}
                  value={currentTime}
                  onChange={handleSeek}
                />
                <span className="text-sm">{formatTime(duration)}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleToggleMute}
                  className="text-white hover:text-indigo-400 transition-colors"
                >
                  <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} />
                </button>
                
                <input
                  type="range"
                  className="w-16 h-1"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                />
                
                <button
                  onClick={handleToggleFullscreen}
                  className="text-white hover:text-indigo-400 transition-colors"
                >
                  <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer; 