"use client";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, 
  faPause, 
  faClock, 
  faUser, 
  faBookmark,
  faTag
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

  const formatFileSize = (sizeGb: number) => {
    if (sizeGb >= 1) {
      return `${sizeGb.toFixed(1)} GB`;
    }
    return `${(sizeGb * 1024).toFixed(0)} MB`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-[#0A2342] to-[#2C4A7F] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#84B9EF] to-[#6AA6E8] opacity-80"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <FontAwesomeIcon 
            icon={faBookmark} 
            className="text-6xl text-white opacity-60" 
          />
        </div>
        
        {/* Progress Bar */}
        {progressPercentage > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div 
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button
            onClick={onPlay}
            className="bg-white/20 backdrop-blur-sm border border-white/30 text-white p-4 rounded-full hover:bg-white/30 transition-all duration-300 transform hover:scale-110"
          >
            <FontAwesomeIcon 
              icon={isCurrentlyPlaying ? faPause : faPlay} 
              className="text-2xl" 
            />
          </button>
        </div>

        {/* Status Badge */}
        {book.progress?.completed && (
          <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Completed
          </div>
        )}
        {isCurrentlyPlaying && (
          <div className="absolute top-3 right-3 bg-[#84B9EF] text-white px-2 py-1 rounded-full text-xs font-medium animate-pulse">
            Playing
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title and Author */}
        <div className="mb-4">
          <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-2 leading-tight">
            {book.title}
          </h3>
          <div className="flex items-center text-gray-600 mb-2">
            <FontAwesomeIcon icon={faUser} className="w-4 h-4 mr-2" />
            <span className="text-sm">{book.author}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {book.description}
        </p>

        {/* Meta Information */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faClock} className="w-4 h-4 mr-1" />
            <span>{book.duration}</span>
          </div>
          <div className="flex items-center">
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">
              {book.file_info.format} • {formatFileSize(book.file_info.size_gb)}
            </span>
          </div>
        </div>

        {/* Genre and Categories */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            <span className="bg-[#84B9EF]/10 text-[#2C4A7F] px-2 py-1 rounded-full text-xs font-medium">
              {book.genre}
            </span>
            {book.categories.slice(0, 2).map((category, index) => (
              <span 
                key={index}
                className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs"
              >
                {category}
              </span>
            ))}
            {book.categories.length > 2 && (
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                +{book.categories.length - 2}
              </span>
            )}
          </div>
        </div>

        {/* Progress Information */}
        {book.progress && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#84B9EF] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            {book.progress.last_played && (
              <p className="text-xs text-gray-500 mt-1">
                Last played: {new Date(book.progress.last_played).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={onPlay}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
            isCurrentlyPlaying
              ? 'bg-[#84B9EF] text-white hover:bg-[#6AA6E8]'
              : 'bg-gray-100 text-gray-700 hover:bg-[#84B9EF] hover:text-white'
          }`}
        >
          <FontAwesomeIcon 
            icon={isCurrentlyPlaying ? faPause : faPlay} 
            className="w-4 h-4" 
          />
          <span>{isCurrentlyPlaying ? 'Pause' : 'Play'}</span>
        </button>
      </div>
    </div>
  );
} 