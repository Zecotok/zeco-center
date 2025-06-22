"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, 
  faPause, 
  faForward, 
  faBackward,
  faVolumeUp,
  faVolumeMute,
  faTimes,
  faList,
  faExpand,
  faCompress,
  faStepForward,
  faStepBackward
} from '@fortawesome/free-solid-svg-icons';

interface AudioBook {
  id: string;
  title: string;
  author: string;
  filename: string;
  duration: string;
  duration_seconds: number;
  chapters: Array<{
    title: string;
    start_time: number;
    duration: number;
  }>;
  progress?: {
    current_time: number;
    completed: boolean;
    last_played: string;
  };
}

interface SimpleAudioPlayerProps {
  book: AudioBook;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onProgressUpdate: (time: number) => void;
  onClose: () => void;
  autoExpand?: boolean;
  onAutoExpandHandled?: () => void;
}

export default function SimpleAudioPlayer({ 
  book, 
  isPlaying, 
  onPlay, 
  onPause, 
  onProgressUpdate, 
  onClose,
  autoExpand = false,
  onAutoExpandHandled
}: SimpleAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedProgressRef = useRef<number>(0);
  
  // Simple state - no complex seeking flags
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showChapters, setShowChapters] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  // Handle auto-expand
  useEffect(() => {
    if (autoExpand) {
      setIsExpanded(true);
      if (onAutoExpandHandled) {
        onAutoExpandHandled();
      }
    }
  }, [autoExpand, onAutoExpandHandled]);

  // Smart progress update - only save if 30+ seconds difference
  const smartProgressUpdate = useCallback((time: number) => {
    const timeDifference = Math.abs(time - lastSavedProgressRef.current);
    
    if (timeDifference >= 30) {
      console.log(`📊 Progress update: ${Math.round(time)}s (${Math.round(timeDifference)}s diff)`);
      onProgressUpdate(time);
      lastSavedProgressRef.current = time;
    }
  }, [onProgressUpdate]);

  // Simple progress tracking - only when playing
  useEffect(() => {
    if (progressUpdateRef.current) {
      clearInterval(progressUpdateRef.current);
    }

    if (isPlaying && audioRef.current) {
      progressUpdateRef.current = setInterval(() => {
        const audio = audioRef.current;
        if (audio && !audio.paused) {
          const time = audio.currentTime;
          setCurrentTime(time);
          
          // Only save progress if 30+ seconds difference
          smartProgressUpdate(time);
          
          // Update current chapter
          const chapterIndex = book.chapters.findIndex((chapter, index) => {
            const nextChapter = book.chapters[index + 1];
            return time >= chapter.start_time && 
                   (!nextChapter || time < nextChapter.start_time);
          });
          
          if (chapterIndex !== -1) {
            setCurrentChapter(chapterIndex);
          }
        }
      }, 1000); // Update every second but only save if needed
    }

    return () => {
      if (progressUpdateRef.current) {
        clearInterval(progressUpdateRef.current);
      }
    };
  }, [isPlaying, book.chapters, smartProgressUpdate]);

  // Audio event handlers - simplified
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      console.log('🎵 Metadata loaded');
      setDuration(audio.duration);
      setIsLoading(false);
      setIsReady(true);
      
      // Set initial progress if available
      const initialTime = book.progress?.current_time || 0;
      if (initialTime > 0 && initialTime < audio.duration) {
        audio.currentTime = initialTime;
        setCurrentTime(initialTime);
        lastSavedProgressRef.current = initialTime; // Set as last saved
      }
    };

    const handleCanPlay = () => {
      console.log('🎵 Can play');
      setIsLoading(false);
      setIsReady(true);
    };

    const handleTimeUpdate = () => {
      if (!audio.seeking) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleEnded = () => {
      console.log('🎵 Audio ended');
      onPause();
    };

    const handleError = (e: any) => {
      console.error('🚫 Audio error:', e);
      setIsLoading(false);
      
      if (e.target?.error) {
        const error = e.target.error;
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          filename: book.filename
        });
      }
    };

    const handleLoadStart = () => {
      console.log('🎵 Load start');
      setIsLoading(true);
      setIsReady(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handleCanPlayThrough = () => {
      setIsLoading(false);
    };

    // Add event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, [book, onPause]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isReady) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying, isReady]);

  // Handle volume
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Handle playback rate
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
  }, [playbackRate]);

  // Simple seeking function
  const seekTo = (time: number) => {
    const audio = audioRef.current;
    if (!audio || !isReady) return;

    // Validate that time is a finite number
    if (!isFinite(time) || isNaN(time)) {
      console.error('🚫 Seek error: Invalid time value:', time);
      return;
    }

    const clampedTime = Math.max(0, Math.min(time, duration));
    console.log('🎯 Seeking to:', clampedTime);
    
    try {
      audio.currentTime = clampedTime;
      setCurrentTime(clampedTime);
    } catch (error) {
      console.error('Seek error:', error);
    }
  };

  // Simple skip functions
  const skipForward = (seconds: number) => {
    seekTo(currentTime + seconds);
  };

  const skipBackward = (seconds: number) => {
    seekTo(currentTime - seconds);
  };

  // Chapter navigation
  const goToChapter = (chapterIndex: number) => {
    const chapter = book.chapters[chapterIndex];
    if (chapter && typeof chapter.start_time === 'number') {
      console.log('📖 Going to chapter:', chapter.title, 'at time:', chapter.start_time);
      seekTo(chapter.start_time);
      setShowChapters(false);
    } else {
      console.error('🚫 Invalid chapter or start_time:', chapter);
    }
  };

  const nextChapter = () => {
    if (currentChapter < book.chapters.length - 1) {
      goToChapter(currentChapter + 1);
    }
  };

  const previousChapter = () => {
    if (currentChapter > 0) {
      goToChapter(currentChapter - 1);
    }
  };

  // Progress bar seeking - modified for chapter progress
  const handleProgressSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseFloat(e.target.value);
    const currentChapterInfo = book.chapters[currentChapter];
    if (currentChapterInfo) {
      const chapterDuration = currentChapterInfo.duration;
      const newTimeInChapter = (percentage / 100) * chapterDuration;
      const newTime = currentChapterInfo.start_time + newTimeInChapter;
      seekTo(newTime);
    }
  };

  // Format time helper
  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate chapter progress instead of whole book progress
  const currentChapterInfo = book.chapters[currentChapter];
  const chapterProgress = currentChapterInfo ? 
    Math.min(100, Math.max(0, ((currentTime - currentChapterInfo.start_time) / currentChapterInfo.duration) * 100)) : 0;
  const currentTimeInChapter = currentChapterInfo ? currentTime - currentChapterInfo.start_time : 0;
  const chapterDuration = currentChapterInfo ? currentChapterInfo.duration : 0;

  return (
    <>
      <audio
        ref={audioRef}
        src={`/api/audiobooks/stream/${book.filename}`}
        preload="metadata"
        crossOrigin="anonymous"
        controls={false}
      />

      {/* Player Container */}
      <div className={`fixed inset-0 bg-white z-50 flex flex-col ${!isExpanded ? 'bottom-0 top-auto h-24' : ''}`}>
        {isExpanded ? (
          /* Full Screen Player */
          <div className="h-full flex flex-col">
            {/* Header - Much smaller */}
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b flex-shrink-0">
              <button 
                onClick={() => setIsExpanded(false)} 
                className="text-gray-600 hover:text-gray-800 p-1"
              >
                <FontAwesomeIcon icon={faCompress} className="text-sm" />
              </button>
              <div className="flex-1 text-center mx-2">
                <h3 className="text-xs font-medium text-gray-800 truncate leading-tight">{book.title}</h3>
                {currentChapterInfo && (
                  <p className="text-xs text-gray-400 truncate leading-tight">Ch {currentChapter + 1}: {currentChapterInfo.title}</p>
                )}
              </div>
              <button onClick={onClose} className="text-gray-600 hover:text-gray-800 p-1">
                <FontAwesomeIcon icon={faTimes} className="text-sm" />
              </button>
            </div>

            {/* Progress Section */}
            <div className="p-4 bg-gray-50 flex-shrink-0">
              <div className="mb-2">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{formatTime(Math.max(0, currentTimeInChapter))}</span>
                  <span>{Math.round(chapterProgress)}%</span>
                  <span>{formatTime(chapterDuration)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={chapterProgress}
                  onChange={handleProgressSeek}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #84B9EF 0%, #84B9EF ${chapterProgress}%, #e5e7eb ${chapterProgress}%, #e5e7eb 100%)`
                  }}
                />
              </div>
            </div>

            {/* Controls - Exact Layout as Requested */}
            <div className="flex-1 bg-white p-6 flex flex-col justify-center space-y-6">
              {/* Row 1: -15s, Play/Pause, +15s - Big buttons */}
              <div className="flex items-center justify-center space-x-8">
                <button onClick={() => skipBackward(15)} className="text-gray-600 hover:text-[#2C4A7F] p-6 bg-gray-100 rounded-xl">
                  <span className="text-2xl font-bold">-15</span>
                </button>
                <button
                  onClick={isPlaying ? onPause : onPlay}
                  disabled={isLoading || !isReady}
                  className="bg-[#84B9EF] text-white p-6 rounded-full hover:bg-[#6AA6E8] disabled:opacity-50 shadow-lg"
                >
                  <FontAwesomeIcon 
                    icon={isLoading ? faPlay : (isPlaying ? faPause : faPlay)} 
                    className="text-3xl" 
                  />
                </button>
                <button onClick={() => skipForward(15)} className="text-gray-600 hover:text-[#2C4A7F] p-6 bg-gray-100 rounded-xl">
                  <span className="text-2xl font-bold">+15</span>
                </button>
              </div>

              {/* Row 2: -30s, +30s - Big buttons */}
              <div className="flex items-center justify-center space-x-8">
                <button onClick={() => skipBackward(30)} className="text-gray-600 hover:text-[#2C4A7F] p-6 bg-gray-100 rounded-xl">
                  <span className="text-2xl font-bold">-30</span>
                </button>
                <button onClick={() => skipForward(30)} className="text-gray-600 hover:text-[#2C4A7F] p-6 bg-gray-100 rounded-xl">
                  <span className="text-2xl font-bold">+30</span>
                </button>
              </div>

              {/* Row 3: Chapter Navigation - Very very small buttons */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={previousChapter}
                  disabled={currentChapter === 0}
                  className="text-gray-600 hover:text-[#2C4A7F] disabled:opacity-50 px-2 py-1 bg-gray-100 rounded text-xs"
                >
                  <FontAwesomeIcon icon={faStepBackward} className="text-xs" />
                </button>
                <button
                  onClick={nextChapter}
                  disabled={currentChapter === book.chapters.length - 1}
                  className="text-gray-600 hover:text-[#2C4A7F] disabled:opacity-50 px-2 py-1 bg-gray-100 rounded text-xs"
                >
                  <FontAwesomeIcon icon={faStepForward} className="text-xs" />
                </button>
              </div>

              {/* Row 4: Speed Controls - Very very small buttons */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setPlaybackRate(Math.max(0.5, playbackRate - 0.25))}
                  className="text-gray-600 hover:text-[#2C4A7F] px-2 py-1 bg-gray-100 rounded text-xs"
                >
                  <span className="text-xs">-</span>
                </button>
                <span className="text-xs text-gray-600 px-2">{playbackRate}x</span>
                <button
                  onClick={() => setPlaybackRate(Math.min(2, playbackRate + 0.25))}
                  className="text-gray-600 hover:text-[#2C4A7F] px-2 py-1 bg-gray-100 rounded text-xs"
                >
                  <span className="text-xs">+</span>
                </button>
              </div>

              {/* Row 5: Chapters List - Very very small button */}
              <div className="flex items-center justify-center">
                <button
                  onClick={() => setShowChapters(true)}
                  className="bg-[#84B9EF] text-white px-3 py-1 rounded hover:bg-[#6AA6E8] text-xs"
                >
                  <FontAwesomeIcon icon={faList} className="text-xs" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Minimized Player */
          <div className="h-full flex flex-col">
            <div className="h-1 bg-gray-200">
              <div
                className="h-full bg-[#84B9EF] transition-all duration-300"
                style={{ width: `${chapterProgress}%` }}
              />
            </div>
            <div 
              className="flex-1 flex items-center px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setIsExpanded(true)}
            >
              <div className="flex items-center flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-[#84B9EF] to-[#6AA6E8] rounded-lg flex items-center justify-center mr-3">
                  <FontAwesomeIcon icon={faPlay} className="text-white" />
                </div>
                <div className="flex-1 min-w-0 mr-4">
                  <h4 className="font-medium text-gray-800 truncate text-sm">{book.title}</h4>
                  <p className="text-xs text-gray-500">{formatTime(Math.max(0, currentTimeInChapter))} / {formatTime(chapterDuration)}</p>
                </div>
                <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => skipBackward(15)} className="text-gray-600 hover:text-[#2C4A7F] p-2">
                    <FontAwesomeIcon icon={faBackward} className="text-sm" />
                  </button>
                  <button
                    onClick={isPlaying ? onPause : onPlay}
                    disabled={isLoading || !isReady}
                    className="bg-[#84B9EF] text-white p-2 rounded-full hover:bg-[#6AA6E8] disabled:opacity-50"
                  >
                    <FontAwesomeIcon 
                      icon={isLoading ? faPlay : (isPlaying ? faPause : faPlay)} 
                      className="text-sm" 
                    />
                  </button>
                  <button onClick={() => skipForward(30)} className="text-gray-600 hover:text-[#2C4A7F] p-2">
                    <FontAwesomeIcon icon={faForward} className="text-sm" />
                  </button>
                  <button onClick={onClose} className="text-gray-600 hover:text-[#2C4A7F] p-2">
                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chapter List Modal */}
      {showChapters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-end">
          <div className="w-full bg-white rounded-t-2xl max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <h3 className="font-medium text-sm">Chapters</h3>
              <button onClick={() => setShowChapters(false)} className="text-gray-600 hover:text-gray-800 p-1">
                <FontAwesomeIcon icon={faTimes} className="text-sm" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {book.chapters.map((chapter, index) => (
                <div
                  key={index}
                  onClick={() => goToChapter(index)}
                  className={`px-3 py-1 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    index === currentChapter ? 'bg-[#84B9EF]/10 border-l-2 border-[#84B9EF]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate leading-tight">{chapter.title}</p>
                      <p className="text-xs text-gray-400 leading-tight">Ch {index + 1}</p>
                    </div>
                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{formatTime(chapter.start_time)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 