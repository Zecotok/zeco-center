"use client";

import { useState, useEffect, useRef } from 'react';
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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      
      // Resume from saved progress
      if (book.progress?.current_time) {
        audio.currentTime = book.progress.current_time;
        setCurrentTime(book.progress.current_time);
      }
    };

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      
      // Update progress every 10 seconds
      if (Math.floor(time) % 10 === 0) {
        onProgressUpdate(time);
      }

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
      onProgressUpdate(duration);
      onPause();
    };

    const handleError = (e: any) => {
      console.error('Audio playback error:', e);
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [book, duration, currentChapter, onProgressUpdate, onPause]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

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
  };

  const handleChapterJump = (chapterIndex: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const chapter = book.chapters[chapterIndex];
    audio.currentTime = chapter.start_seconds;
    setCurrentTime(chapter.start_seconds);
    setCurrentChapter(chapterIndex);
    setShowChapters(false);
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.currentTime + 30, duration);
  };

  const skipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(audio.currentTime - 15, 0);
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

  return (
    <>
      <audio
        ref={audioRef}
        src={`/api/audiobooks/stream/${book.filename}`}
        preload="metadata"
      />

      {/* Fixed Player Bar */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t border-gray-200 z-50 transition-all duration-300 ${isExpanded ? 'h-screen' : 'h-20'}`}>
        {isExpanded ? (
          /* Expanded Player */
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <button onClick={() => setIsExpanded(false)} className="text-gray-600 hover:text-gray-800">
                <FontAwesomeIcon icon={faCompress} className="text-lg" />
              </button>
              <h3 className="font-semibold text-gray-800 truncate mx-4">{book.title}</h3>
              <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
                <FontAwesomeIcon icon={faTimes} className="text-lg" />
              </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:flex-row">
              {/* Left Panel - Cover and Info */}
              <div className="md:w-1/3 p-6 bg-gradient-to-br from-[#0A2342] to-[#2C4A7F] text-white">
                <div className="text-center">
                  <div className="w-48 h-48 mx-auto mb-4 bg-gradient-to-br from-[#84B9EF] to-[#6AA6E8] rounded-lg flex items-center justify-center shadow-xl">
                    <FontAwesomeIcon icon={faPlay} className="text-6xl text-white opacity-80" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">{book.title}</h2>
                  <p className="text-[#84B9EF] mb-4">{book.author}</p>
                  {currentChapterInfo && (
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-sm text-[#84B9EF]">Chapter {currentChapterInfo.chapter}</p>
                      <p className="font-medium">{currentChapterInfo.title}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel - Chapters */}
              <div className="md:w-2/3 flex flex-col">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-lg">Chapters</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {book.chapters.map((chapter, index) => (
                    <div
                      key={chapter.chapter}
                      onClick={() => handleChapterJump(index)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        index === currentChapter ? 'bg-[#84B9EF]/10 border-l-4 border-[#84B9EF]' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{chapter.title}</p>
                          <p className="text-sm text-gray-500">Chapter {chapter.chapter}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {chapter.start_time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="p-6 bg-gray-50 border-t">
              {/* Progress Bar */}
              <div className="mb-4">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #84B9EF 0%, #84B9EF ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center space-x-6">
                <button
                  onClick={previousChapter}
                  disabled={currentChapter === 0}
                  className="text-gray-600 hover:text-[#2C4A7F] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon icon={faStepBackward} className="text-xl" />
                </button>
                
                <button onClick={skipBackward} className="text-gray-600 hover:text-[#2C4A7F]">
                  <FontAwesomeIcon icon={faBackward} className="text-xl" />
                </button>

                <button
                  onClick={isPlaying ? onPause : onPlay}
                  disabled={isLoading}
                  className="bg-[#84B9EF] text-white p-4 rounded-full hover:bg-[#6AA6E8] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon 
                    icon={isLoading ? faPlay : (isPlaying ? faPause : faPlay)} 
                    className="text-2xl" 
                  />
                </button>

                <button onClick={skipForward} className="text-gray-600 hover:text-[#2C4A7F]">
                  <FontAwesomeIcon icon={faForward} className="text-xl" />
                </button>

                <button
                  onClick={nextChapter}
                  disabled={currentChapter === book.chapters.length - 1}
                  className="text-gray-600 hover:text-[#2C4A7F] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon icon={faStepForward} className="text-xl" />
                </button>
              </div>

              {/* Additional Controls */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-gray-600 hover:text-[#2C4A7F]"
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
                      className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Speed:</span>
                  <select
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
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
          <div className="h-20 flex items-center px-4">
            <div className="flex items-center flex-1 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-br from-[#84B9EF] to-[#6AA6E8] rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                <FontAwesomeIcon icon={faPlay} className="text-white text-lg" />
              </div>
              
              <div className="flex-1 min-w-0 mr-4">
                <h4 className="font-medium text-gray-800 truncate">{book.title}</h4>
                <p className="text-sm text-gray-500 truncate">{book.author}</p>
              </div>

              {/* Mobile Controls */}
              <div className="flex items-center space-x-2 md:space-x-4">
                <button onClick={skipBackward} className="text-gray-600 hover:text-[#2C4A7F] md:inline hidden">
                  <FontAwesomeIcon icon={faBackward} />
                </button>
                
                <button
                  onClick={isPlaying ? onPause : onPlay}
                  disabled={isLoading}
                  className="bg-[#84B9EF] text-white p-2 rounded-full hover:bg-[#6AA6E8] disabled:opacity-50"
                >
                  <FontAwesomeIcon 
                    icon={isLoading ? faPlay : (isPlaying ? faPause : faPlay)} 
                    className="text-lg" 
                  />
                </button>

                <button onClick={skipForward} className="text-gray-600 hover:text-[#2C4A7F] md:inline hidden">
                  <FontAwesomeIcon icon={faForward} />
                </button>

                <button onClick={() => setIsExpanded(true)} className="text-gray-600 hover:text-[#2C4A7F]">
                  <FontAwesomeIcon icon={faExpand} />
                </button>

                <button onClick={onClose} className="text-gray-600 hover:text-[#2C4A7F]">
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar (minimized view) */}
        {!isExpanded && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
            <div
              className="h-full bg-[#84B9EF] transition-all duration-300"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        )}
      </div>
    </>
  );
} 