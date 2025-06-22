"use client";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, 
  faPause, 
  faClock, 
  faUser, 
  faBookmark,
  faDownload
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

interface BookListProps {
  book: AudioBook;
  onPlay: () => void;
  isCurrentlyPlaying: boolean;
}

export default function BookList({ book, onPlay, isCurrentlyPlaying }: BookListProps) {
  const progressPercentage = book.progress 
    ? (book.progress.current_time / book.duration_seconds) * 100 
    : 0;

  const formatFileSize = (sizeGb: number) => {
    if (sizeGb >= 1) {
      return `${sizeGb.toFixed(1)} GB`;
    }
    return `${(sizeGb * 1024).toFixed(0)} MB`;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      onClick={onPlay}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group hover:scale-[1.01]"
    >
      <div className="flex items-center p-6">
        {/* Cover Thumbnail */}
        <div className="relative w-20 h-20 bg-gradient-to-br from-[#0A2342] to-[#2C4A7F] rounded-lg flex-shrink-0 mr-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#84B9EF] to-[#6AA6E8] opacity-80"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <FontAwesomeIcon 
              icon={faBookmark} 
              className="text-2xl text-white opacity-60" 
            />
          </div>
          
          {/* Progress Indicator */}
          {progressPercentage > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
              <div 
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}

          {/* Status Badge */}
          {isCurrentlyPlaying && (
            <div className="absolute top-1 right-1 bg-[#84B9EF] text-white rounded-full w-4 h-4 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          )}

          {/* Play Icon Overlay */}
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-white/20 backdrop-blur-sm border border-white/30 text-white p-2 rounded-full">
              <FontAwesomeIcon 
                icon={isCurrentlyPlaying ? faPause : faPlay} 
                className="text-sm" 
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Author */}
          <div className="mb-2">
            <h3 className="font-bold text-lg text-gray-800 truncate">
              {book.title}
            </h3>
            <div className="flex items-center text-gray-600">
              <FontAwesomeIcon icon={faUser} className="w-4 h-4 mr-2" />
              <span className="text-sm">{book.author}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {book.description}
          </p>

          {/* Tags and Meta */}
          <div className="flex items-center flex-wrap gap-2 mb-3">
            {/* Only show genre if it's meaningful */}
            {book.genre && book.genre !== 'General' && book.genre !== 'Uncategorized' && (
              <span className="bg-[#84B9EF]/10 text-[#2C4A7F] px-2 py-1 rounded-full text-xs font-medium">
                {book.genre}
              </span>
            )}
            {/* Show only first meaningful category */}
            {book.categories.filter(cat => 
              !cat.toLowerCase().includes('business') && 
              !cat.toLowerCase().includes('development') &&
              !cat.toLowerCase().includes('general') &&
              cat.length > 2
            ).slice(0, 1).map((category, index) => (
              <span 
                key={index}
                className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs"
              >
                {category}
              </span>
            ))}
          </div>

          {/* Progress Bar */}
          {book.progress && progressPercentage > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress: {Math.round(progressPercentage)}%</span>
                <span>
                  {formatTime(book.progress.current_time)} / {book.duration}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-[#84B9EF] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Meta Information */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faClock} className="w-4 h-4 mr-1" />
                <span>{book.duration}</span>
              </div>
              <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                {book.file_info.format} • {book.file_info.quality} • {formatFileSize(book.file_info.size_gb)}
              </span>
              {book.progress?.completed && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                  Completed
                </span>
              )}
            </div>
            
            {book.progress?.last_played && (
              <span className="text-xs">
                Last played: {new Date(book.progress.last_played).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="ml-6 flex-shrink-0 flex items-center justify-center w-12 h-12">
          {isCurrentlyPlaying ? (
            <div className="bg-[#84B9EF] text-white p-3 rounded-full">
              <FontAwesomeIcon icon={faPause} className="text-lg" />
            </div>
          ) : (
            <div className="bg-gray-100 text-gray-600 p-3 rounded-full group-hover:bg-[#84B9EF] group-hover:text-white transition-colors">
              <FontAwesomeIcon icon={faPlay} className="text-lg" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 