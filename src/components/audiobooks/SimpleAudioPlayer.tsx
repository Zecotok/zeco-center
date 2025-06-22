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

  // Progress bar seeking
  const handleProgressSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseFloat(e.target.value);
    const newTime = (percentage / 100) * duration;
    seekTo(newTime);
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

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const currentChapterInfo = book.chapters[currentChapter];

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
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b flex-shrink-0">
              <button 
                onClick={() => setIsExpanded(false)} 
                className="text-gray-600 hover:text-gray-800 p-2"
              >
                <FontAwesomeIcon icon={faCompress} className="text-lg" />
              </button>
              <h3 className="font-semibold text-gray-800 truncate mx-4 text-center flex-1">{book.title}</h3>
              <button onClick={onClose} className="text-gray-600 hover:text-gray-800 p-2">
                <FontAwesomeIcon icon={faTimes} className="text-lg" />
              </button>
            </div>

            {/* Book Info */}
            <div className="p-4 bg-gradient-to-br from-[#0A2342] to-[#2C4A7F] text-white flex-shrink-0">
              <div className="text-center">
                <h2 className="text-lg font-bold mb-1">{book.title}</h2>
                <p className="text-[#84B9EF] text-sm mb-3">{book.author}</p>
                {currentChapterInfo && (
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-xs text-[#84B9EF]">Chapter {currentChapter + 1}</p>
                    <p className="font-medium text-sm">{currentChapterInfo.title}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Section */}
            <div className="p-4 bg-gray-50 flex-shrink-0">
              <div className="mb-2">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{Math.round(progress)}%</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleProgressSeek}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #84B9EF 0%, #84B9EF ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`
                  }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex-1 bg-white p-6 flex flex-col justify-center">
              {/* Chapter Navigation */}
              <div className="flex items-center justify-center space-x-6 mb-6">
                <button
                  onClick={previousChapter}
                  disabled={currentChapter === 0}
                  className="text-gray-600 hover:text-[#2C4A7F] disabled:opacity-50 p-4 bg-gray-100 rounded-xl"
                >
                  <FontAwesomeIcon icon={faStepBackward} className="text-2xl" />
                </button>
                <button
                  onClick={nextChapter}
                  disabled={currentChapter === book.chapters.length - 1}
                  className="text-gray-600 hover:text-[#2C4A7F] disabled:opacity-50 p-4 bg-gray-100 rounded-xl"
                >
                  <FontAwesomeIcon icon={faStepForward} className="text-2xl" />
                </button>
              </div>

              {/* Skip Controls */}
              <div className="flex items-center justify-center space-x-4 mb-6">
                <button onClick={() => skipBackward(15)} className="text-gray-600 hover:text-[#2C4A7F] p-3 bg-gray-100 rounded-xl">
                  <span className="text-sm font-bold">-15s</span>
                </button>
                <button onClick={() => skipBackward(30)} className="text-gray-600 hover:text-[#2C4A7F] p-3 bg-gray-100 rounded-xl">
                  <span className="text-sm font-bold">-30s</span>
                </button>
                <button onClick={() => skipForward(10)} className="text-gray-600 hover:text-[#2C4A7F] p-3 bg-gray-100 rounded-xl">
                  <span className="text-sm font-bold">+10s</span>
                </button>
                <button onClick={() => skipForward(30)} className="text-gray-600 hover:text-[#2C4A7F] p-3 bg-gray-100 rounded-xl">
                  <span className="text-sm font-bold">+30s</span>
                </button>
              </div>

              {/* Main Play Button */}
              <div className="flex items-center justify-center mb-6">
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
              </div>

              {/* Additional Controls */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setShowChapters(true)}
                  className="bg-[#84B9EF] text-white px-4 py-2 rounded-lg hover:bg-[#6AA6E8]"
                >
                  <FontAwesomeIcon icon={faList} className="mr-2" />
                  Chapters
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-gray-600 hover:text-[#2C4A7F] p-2"
                  >
                    <FontAwesomeIcon icon={isMuted || volume === 0 ? faVolumeMute : faVolumeUp} />
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const newVolume = parseFloat(e.target.value);
                      setVolume(newVolume);
                      setIsMuted(newVolume === 0);
                    }}
                    className="w-20 h-2 bg-gray-200 rounded-lg"
                  />
                </div>

                <select
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="0.5">0.5x</option>
                  <option value="0.75">0.75x</option>
                  <option value="1">1x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          /* Minimized Player */
          <div className="h-full flex flex-col">
            <div className="h-1 bg-gray-200">
              <div
                className="h-full bg-[#84B9EF] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex-1 flex items-center px-4 py-2">
              <div className="flex items-center flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-[#84B9EF] to-[#6AA6E8] rounded-lg flex items-center justify-center mr-3">
                  <FontAwesomeIcon icon={faPlay} className="text-white" />
                </div>
                <div className="flex-1 min-w-0 mr-4">
                  <h4 className="font-medium text-gray-800 truncate text-sm">{book.title}</h4>
                  <p className="text-xs text-gray-500">{formatTime(currentTime)} / {formatTime(duration)}</p>
                </div>
                <div className="flex items-center space-x-2">
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
                  <button onClick={() => setIsExpanded(true)} className="text-gray-600 hover:text-[#2C4A7F] p-2">
                    <FontAwesomeIcon icon={faExpand} className="text-sm" />
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
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-lg">Chapters</h3>
              <button onClick={() => setShowChapters(false)} className="text-gray-600 hover:text-gray-800 p-2">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {book.chapters.map((chapter, index) => (
                <div
                  key={index}
                  onClick={() => goToChapter(index)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    index === currentChapter ? 'bg-[#84B9EF]/10 border-l-4 border-[#84B9EF]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{chapter.title}</p>
                      <p className="text-sm text-gray-500">Chapter {index + 1}</p>
                    </div>
                    <span className="text-sm text-gray-500">{formatTime(chapter.start_time)}</span>
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