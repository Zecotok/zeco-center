"use client";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, 
  faPause
} from '@fortawesome/free-solid-svg-icons';

interface AudioBook {
  id: string;
  title: string;
  author: string;
  filename: string;
  duration: string;
  duration_seconds: number;
  description: string;
  genre: string;
  categories: string[];
  tags: string[];
  file_info: {
    format: string;
    quality: string;
    size_gb: number;
  };
  progress?: {
    current_time: number;
    completed: boolean;
    last_played: string;
  };
}

interface BookCardProps {
  book: AudioBook;
  onPlay: () => void;
  isCurrentlyPlaying: boolean;
}

export default function BookCard({ book, onPlay, isCurrentlyPlaying }: BookCardProps) {
  const progressPercentage = book.progress 
    ? (book.progress.current_time / book.duration_seconds) * 100 
    : 0;

  return (
    <div 
      onClick={onPlay}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer group border border-gray-100 hover:border-gray-200"
    >
      {/* Content */}
      <div className="p-3">
        {/* Title */}
        <h3 className="font-medium text-xs text-gray-800 mb-1 line-clamp-2 leading-tight group-hover:text-[#2C4A7F] transition-colors">
          {book.title}
        </h3>
        
        {/* Author */}
        <p className="text-xs text-gray-500 mb-2 truncate">
          {book.author}
        </p>
        
        {/* Progress Bar */}
        <div className="relative">
          {progressPercentage > 0 ? (
            <>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div 
                  className="bg-[#84B9EF] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">{Math.round(progressPercentage)}%</span>
                {isCurrentlyPlaying && (
                  <div className="flex items-center text-xs text-[#84B9EF]">
                    <FontAwesomeIcon icon={faPause} className="w-3 h-3 mr-1" />
                    <span>Playing</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-gray-200 h-1.5 rounded-full w-0"></div>
              </div>
              {isCurrentlyPlaying && (
                <div className="flex items-center text-xs text-[#84B9EF] ml-2">
                  <FontAwesomeIcon icon={faPause} className="w-3 h-3 mr-1" />
                  <span>Playing</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Play Icon - Only visible on hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-6 h-6 bg-[#84B9EF] text-white rounded-full flex items-center justify-center">
            <FontAwesomeIcon 
              icon={isCurrentlyPlaying ? faPause : faPlay} 
              className="text-xs" 
            />
          </div>
        </div>
      </div>
    </div>
  );
} 