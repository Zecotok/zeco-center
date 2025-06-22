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
  faStepBackward,
  faBars
} from '@fortawesome/free-solid-svg-icons';

interface AudioBook {
  id: string;
  title: string;
  author: string;
  filename: string;
  duration: string;
  duration_seconds: number;
  chapters: Array<{
    chapter: number;
    title: string;
    start_time: string;
    start_seconds: number;
  }>;
  progress?: {
    current_time: number;
    completed: boolean;
    last_played: string;
  };
}

interface AudioPlayerProps {
  book: AudioBook;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onProgressUpdate: (time: number) => void;
  onClose: () => void;
}

export default function AudioPlayer({ 
  book, 
  isPlaying, 
  onPlay, 
  onPause, 
  onProgressUpdate, 
  onClose 
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showChapters, setShowChapters] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [localCacheInterval, setLocalCacheInterval] = useState<NodeJS.Timeout | null>(null);
  const [databaseUpdateInterval, setDatabaseUpdateInterval] = useState<NodeJS.Timeout | null>(null);

  // Save progress to localStorage for immediate persistence
  const saveProgressLocally = useCallback((time: number) => {
    const progressData = {
      bookId: book.id,
      currentTime: time,
      lastPlayed: new Date().toISOString(),
      completed: time >= (book.duration_seconds * 0.95)
    };
    localStorage.setItem(`audiobook_progress_${book.id}`, JSON.stringify(progressData));
    console.log(`Local cache updated: ${Math.round(time)}s`);
  }, [book.id, book.duration_seconds]);

  // Save pending database updates for offline sync
  const savePendingUpdate = useCallback((time: number) => {
    const updateData = {
      bookId: book.id,
      currentTime: time,
      timestamp: Date.now()
    };
    
    // Get existing pending updates
    const pendingUpdates = JSON.parse(localStorage.getItem('pendingProgressUpdates') || '[]');
    
    // Remove any existing update for this book (keep only the latest)
    const filteredUpdates = pendingUpdates.filter((u: any) => u.bookId !== book.id);
    filteredUpdates.push(updateData);
    
    // Keep only the last 20 pending updates to prevent storage bloat
    const trimmedUpdates = filteredUpdates.slice(-20);
    
    localStorage.setItem('pendingProgressUpdates', JSON.stringify(trimmedUpdates));
  }, [book.id]);

  // Process pending updates when online
  const processPendingUpdates = useCallback(async () => {
    if (!navigator.onLine) return;
    
    const pendingUpdates = JSON.parse(localStorage.getItem('pendingProgressUpdates') || '[]');
    
    // Find the latest update for the current book only
    const currentBookUpdate = pendingUpdates.find((u: any) => u.bookId === book.id);
    
    if (!currentBookUpdate) return;
    
    console.log(`Processing latest progress update for current book: ${book.id}`);
    
    try {
      await fetch('/api/audiobooks/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: currentBookUpdate.bookId,
          currentTime: currentBookUpdate.currentTime
        })
      });
      
      console.log(`Synced latest progress for book ${currentBookUpdate.bookId}: ${Math.round(currentBookUpdate.currentTime)}s`);
      
      // Remove only the successfully processed update for this book
      const remainingUpdates = pendingUpdates.filter((u: any) => u.bookId !== book.id);
      localStorage.setItem('pendingProgressUpdates', JSON.stringify(remainingUpdates));
      
    } catch (error) {
      console.error('Failed to sync latest progress update:', error);
      // Keep the pending update for retry later
    }
  }, [book.id]);

  // Load progress from localStorage on component mount
  const loadProgressLocally = useCallback(() => {
    const savedProgress = localStorage.getItem(`audiobook_progress_${book.id}`);
    if (savedProgress) {
      try {
        const progressData = JSON.parse(savedProgress);
        return progressData.currentTime || 0;
      } catch (error) {
        console.error('Error parsing saved progress:', error);
      }
    }
    return book.progress?.current_time || 0;
  }, [book.id, book.progress?.current_time]);

  // Update database progress (less frequent, with offline support)
  const updateDatabaseProgress = useCallback(async (time: number) => {
    try {
      await fetch('/api/audiobooks/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          currentTime: time
        })
      });
      
      console.log(`Database progress updated: ${Math.round(time)}s`);
      
    } catch (error) {
      console.error('Failed to update progress on server:', error);
      // Save for offline sync
      savePendingUpdate(time);
    }
  }, [book.id, savePendingUpdate]);

  // Update local cache progress (more frequent)
  const updateLocalProgress = useCallback((time: number) => {
    saveProgressLocally(time);
  }, [saveProgressLocally]);

  // Force database update (for seek, pause, unload events)
  const forceUpdateDatabase = useCallback(async (time: number) => {
    updateLocalProgress(time);
    await updateDatabaseProgress(time);
  }, [updateLocalProgress, updateDatabaseProgress]);

  // Process pending updates on mount and when coming online
  useEffect(() => {
    processPendingUpdates();
    
    const handleOnline = () => {
      console.log('Connection restored, processing pending updates...');
      processPendingUpdates();
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [processPendingUpdates]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      
      // Load progress from localStorage first (faster), then server
      const localProgress = loadProgressLocally();
      if (localProgress > 0) {
        audio.currentTime = localProgress;
        setCurrentTime(localProgress);
      }
    };

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);

      // Update current chapter
      const chapterIndex = book.chapters.findIndex((chapter, index) => {
        const nextChapter = book.chapters[index + 1];
        return time >= chapter.start_seconds && 
               (!nextChapter || time < nextChapter.start_seconds);
      });
      
      if (chapterIndex !== -1 && chapterIndex !== currentChapter) {
        setCurrentChapter(chapterIndex);
      }
    };

    const handleEnded = () => {
      forceUpdateDatabase(duration);
      onPause();
    };

    const handleError = (e: any) => {
      console.error('Audio playback error:', e);
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [book, duration, currentChapter, forceUpdateDatabase, onPause, loadProgressLocally]);

  // Enhanced progress tracking with separate intervals for local cache and database
  useEffect(() => {
    // Clear existing intervals
    if (localCacheInterval) {
      clearInterval(localCacheInterval);
      setLocalCacheInterval(null);
    }
    if (databaseUpdateInterval) {
      clearInterval(databaseUpdateInterval);
      setDatabaseUpdateInterval(null);
    }

    if (isPlaying) {
      // Update local cache every 2 seconds
      const localInterval = setInterval(() => {
        if (audioRef.current) {
          updateLocalProgress(audioRef.current.currentTime);
        }
      }, 2000);
      setLocalCacheInterval(localInterval);

      // Update database every 10 seconds
      const dbInterval = setInterval(() => {
        if (audioRef.current) {
          updateDatabaseProgress(audioRef.current.currentTime);
        }
      }, 10000);
      setDatabaseUpdateInterval(dbInterval);
    }

    return () => {
      if (localCacheInterval) {
        clearInterval(localCacheInterval);
      }
      if (databaseUpdateInterval) {
        clearInterval(databaseUpdateInterval);
      }
    };
  }, [isPlaying, updateLocalProgress, updateDatabaseProgress]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
      // Force database update when pausing
      forceUpdateDatabase(audio.currentTime);
    }
  }, [isPlaying, forceUpdateDatabase]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = playbackRate;
  }, [playbackRate]);

  // Handle page visibility change (for background playback)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && audioRef.current) {
        // Force database update when app goes to background
        forceUpdateDatabase(audioRef.current.currentTime);
      }
    };

    const handleBeforeUnload = () => {
      if (audioRef.current) {
        // Force database update before page unload
        forceUpdateDatabase(audioRef.current.currentTime);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [forceUpdateDatabase]);

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
    // Force database update on seek
    forceUpdateDatabase(time);
  };

  const handleChapterJump = (chapterIndex: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const chapter = book.chapters[chapterIndex];
    audio.currentTime = chapter.start_seconds;
    setCurrentTime(chapter.start_seconds);
    setCurrentChapter(chapterIndex);
    setShowChapters(false);
    // Force database update on chapter jump
    forceUpdateDatabase(chapter.start_seconds);
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = Math.min(audio.currentTime + 30, duration);
    audio.currentTime = newTime;
    // Force database update on skip
    forceUpdateDatabase(newTime);
  };

  const skipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = Math.max(audio.currentTime - 15, 0);
    audio.currentTime = newTime;
    // Force database update on skip
    forceUpdateDatabase(newTime);
  };

  const nextChapter = () => {
    if (currentChapter < book.chapters.length - 1) {
      handleChapterJump(currentChapter + 1);
    }
  };

  const previousChapter = () => {
    if (currentChapter > 0) {
      handleChapterJump(currentChapter - 1);
    }
  };

  const currentChapterInfo = book.chapters[currentChapter];
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <audio
        ref={audioRef}
        src={`/api/audiobooks/stream/${book.filename}`}
        preload="metadata"
      />

      {/* Fixed Player Bar */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t border-gray-200 z-50 transition-all duration-300 ${isExpanded ? 'h-screen' : 'h-24 sm:h-20'}`}>
        {isExpanded ? (
          /* Expanded Player */
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <button onClick={() => setIsExpanded(false)} className="text-gray-600 hover:text-gray-800 p-2">
                <FontAwesomeIcon icon={faCompress} className="text-lg" />
              </button>
              <h3 className="font-semibold text-gray-800 truncate mx-4 text-center">{book.title}</h3>
              <button onClick={onClose} className="text-gray-600 hover:text-gray-800 p-2">
                <FontAwesomeIcon icon={faTimes} className="text-lg" />
              </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Mobile: Stack vertically, Desktop: Side by side */}
              <div className="flex-1 flex flex-col lg:flex-row">
                {/* Book Info Panel */}
                <div className="lg:w-1/3 p-4 lg:p-6 bg-gradient-to-br from-[#0A2342] to-[#2C4A7F] text-white">
                  <div className="text-center">
                    <div className="w-32 h-32 lg:w-48 lg:h-48 mx-auto mb-4 bg-gradient-to-br from-[#84B9EF] to-[#6AA6E8] rounded-lg flex items-center justify-center shadow-xl">
                      <FontAwesomeIcon icon={faPlay} className="text-4xl lg:text-6xl text-white opacity-80" />
                    </div>
                    <h2 className="text-lg lg:text-xl font-bold mb-2 line-clamp-2">{book.title}</h2>
                    <p className="text-[#84B9EF] mb-4 text-sm lg:text-base">{book.author}</p>
                    {currentChapterInfo && (
                      <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-sm text-[#84B9EF]">Chapter {currentChapterInfo.chapter}</p>
                        <p className="font-medium text-sm line-clamp-2">{currentChapterInfo.title}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chapters Panel */}
                <div className="lg:w-2/3 flex flex-col bg-white">
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Chapters</h3>
                      <button 
                        onClick={() => setShowChapters(!showChapters)}
                        className="lg:hidden text-gray-600 hover:text-gray-800 p-2"
                      >
                        <FontAwesomeIcon icon={faBars} />
                      </button>
                    </div>
                  </div>
                  <div className={`flex-1 overflow-y-auto ${showChapters || window.innerWidth >= 1024 ? 'block' : 'hidden lg:block'}`}>
                    {book.chapters.map((chapter, index) => (
                      <div
                        key={chapter.chapter}
                        onClick={() => handleChapterJump(index)}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                          index === currentChapter ? 'bg-[#84B9EF]/10 border-l-4 border-[#84B9EF]' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 line-clamp-2">{chapter.title}</p>
                            <p className="text-sm text-gray-500">Chapter {chapter.chapter}</p>
                          </div>
                          <div className="text-sm text-gray-500 ml-2 flex-shrink-0">
                            {chapter.start_time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Controls */}
            <div className="p-4 lg:p-6 bg-gray-50 border-t">
              {/* Progress Bar */}
              <div className="mb-4">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #84B9EF 0%, #84B9EF ${progressPercentage}%, #e5e7eb ${progressPercentage}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>{formatTime(currentTime)}</span>
                  <span className="text-center">{Math.round(progressPercentage)}%</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center space-x-4 lg:space-x-6 mb-4">
                <button
                  onClick={previousChapter}
                  disabled={currentChapter === 0}
                  className="text-gray-600 hover:text-[#2C4A7F] disabled:opacity-50 disabled:cursor-not-allowed p-2"
                >
                  <FontAwesomeIcon icon={faStepBackward} className="text-lg lg:text-xl" />
                </button>
                
                <button onClick={skipBackward} className="text-gray-600 hover:text-[#2C4A7F] p-2">
                  <FontAwesomeIcon icon={faBackward} className="text-lg lg:text-xl" />
                </button>

                <button
                  onClick={isPlaying ? onPause : onPlay}
                  disabled={isLoading}
                  className="bg-[#84B9EF] text-white p-3 lg:p-4 rounded-full hover:bg-[#6AA6E8] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <FontAwesomeIcon 
                    icon={isLoading ? faPlay : (isPlaying ? faPause : faPlay)} 
                    className="text-xl lg:text-2xl" 
                  />
                </button>

                <button onClick={skipForward} className="text-gray-600 hover:text-[#2C4A7F] p-2">
                  <FontAwesomeIcon icon={faForward} className="text-lg lg:text-xl" />
                </button>

                <button
                  onClick={nextChapter}
                  disabled={currentChapter === book.chapters.length - 1}
                  className="text-gray-600 hover:text-[#2C4A7F] disabled:opacity-50 disabled:cursor-not-allowed p-2"
                >
                  <FontAwesomeIcon icon={faStepForward} className="text-lg lg:text-xl" />
                </button>
              </div>

              {/* Additional Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
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
                      className="w-16 lg:w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 hidden sm:inline">Speed:</span>
                  <select
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                    className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
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
          </div>
        ) : (
          /* Minimized Player */
          <div className="h-full flex flex-col">
            {/* Progress Bar at Top */}
            <div className="h-1 bg-gray-200 flex-shrink-0">
              <div
                className="h-full bg-[#84B9EF] transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Player Content */}
            <div className="flex-1 flex items-center px-4 py-2">
              <div className="flex items-center flex-1 min-w-0">
                <div className="w-12 h-12 bg-gradient-to-br from-[#84B9EF] to-[#6AA6E8] rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <FontAwesomeIcon icon={faPlay} className="text-white text-lg" />
                </div>
                
                <div className="flex-1 min-w-0 mr-4">
                  <h4 className="font-medium text-gray-800 truncate text-sm">{book.title}</h4>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate">{book.author}</p>
                    <span className="text-xs text-gray-500 ml-2">{formatTime(currentTime)} / {formatTime(duration)}</span>
                  </div>
                </div>

                {/* Mobile Controls */}
                <div className="flex items-center space-x-2">
                  <button onClick={skipBackward} className="text-gray-600 hover:text-[#2C4A7F] p-2 hidden sm:inline-block">
                    <FontAwesomeIcon icon={faBackward} className="text-sm" />
                  </button>
                  
                  <button
                    onClick={isPlaying ? onPause : onPlay}
                    disabled={isLoading}
                    className="bg-[#84B9EF] text-white p-2 rounded-full hover:bg-[#6AA6E8] disabled:opacity-50"
                  >
                    <FontAwesomeIcon 
                      icon={isLoading ? faPlay : (isPlaying ? faPause : faPlay)} 
                      className="text-sm" 
                    />
                  </button>

                  <button onClick={skipForward} className="text-gray-600 hover:text-[#2C4A7F] p-2 hidden sm:inline-block">
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

      {/* Custom CSS for better slider styling */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #84B9EF;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          border: 2px solid white;
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #84B9EF;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </>
  );
} 