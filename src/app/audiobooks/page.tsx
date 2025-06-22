"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faPlay, 
  faPause, 
  faForward, 
  faBackward,
  faVolumeUp,
  faBook,
  faClock,
  faUser,
  faBookmark,
  faFilter,
  faList,
  faThLarge
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import AudioPlayer from '@/components/audiobooks/AudioPlayer';
import BookCard from '@/components/audiobooks/BookCard';
import BookList from '@/components/audiobooks/BookList';

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
  chapters: Array<{
    chapter: number;
    title: string;
    start_time: string;
    start_seconds: number;
  }>;
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

export default function AudiobooksPage() {
  const { data: session, status } = useSession();
  const [audiobooks, setAudiobooks] = useState<AudioBook[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<AudioBook[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [currentBook, setCurrentBook] = useState<AudioBook | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  // Fetch audiobooks from API
  useEffect(() => {
    const fetchAudiobooks = async () => {
      try {
        const response = await fetch('/api/audiobooks');
        const data = await response.json();
        setAudiobooks(data);
        setFilteredBooks(data);
      } catch (error) {
        console.error('Error fetching audiobooks:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchAudiobooks();
    }
  }, [session]);

  // Filter books based on search and genre
  useEffect(() => {
    let filtered = audiobooks;

    if (searchTerm) {
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedGenre !== 'all') {
      filtered = filtered.filter(book => book.genre === selectedGenre);
    }

    setFilteredBooks(filtered);
  }, [searchTerm, selectedGenre, audiobooks]);

  // Get unique genres for filter
  const genres = [...new Set(audiobooks.map(book => book.genre))];

  const handlePlayBook = (book: AudioBook) => {
    setCurrentBook(book);
    setIsPlaying(true);
  };

  const handlePauseBook = () => {
    setIsPlaying(false);
  };

  const updateProgress = async (bookId: string, currentTime: number) => {
    try {
      await fetch('/api/audiobooks/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, currentTime })
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#2C4A7F]"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A2342] to-[#2C4A7F]">
        <div className="text-center text-white">
          <FontAwesomeIcon icon={faBook} className="text-6xl mb-4" />
          <h1 className="text-2xl font-bold mb-4">Access Audiobooks</h1>
          <p className="mb-6">Please log in to access your audiobook library</p>
          <Link href="/login" className="bg-[#84B9EF] text-white px-6 py-3 rounded-lg hover:bg-[#6AA6E8] transition-colors">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#0A2342] mb-2 flex items-center">
            <FontAwesomeIcon icon={faBook} className="mr-3 text-[#2C4A7F]" />
            Audiobook Library
          </h1>
          <p className="text-gray-600">Discover and listen to your favorite audiobooks</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <input
                type="text"
                placeholder="Search audiobooks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#84B9EF] focus:border-transparent"
              />
            </div>

            {/* Genre Filter */}
            <div className="relative">
              <FontAwesomeIcon 
                icon={faFilter} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#84B9EF] focus:border-transparent bg-white"
              >
                <option value="all">All Genres</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-3 ${viewMode === 'grid' ? 'bg-[#84B9EF] text-white' : 'bg-white text-gray-600'} hover:bg-[#6AA6E8] hover:text-white transition-colors`}
              >
                <FontAwesomeIcon icon={faThLarge} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-3 ${viewMode === 'list' ? 'bg-[#84B9EF] text-white' : 'bg-white text-gray-600'} hover:bg-[#6AA6E8] hover:text-white transition-colors`}
              >
                <FontAwesomeIcon icon={faList} />
              </button>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-gray-600">
            {filteredBooks.length} audiobook{filteredBooks.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#2C4A7F]"></div>
          </div>
        )}

        {/* No Results */}
        {!loading && filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faBook} className="text-6xl text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No audiobooks found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        )}

        {/* Audiobooks Grid/List */}
        {!loading && filteredBooks.length > 0 && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            {filteredBooks.map((book) => (
              viewMode === 'grid' ? (
                <BookCard 
                  key={book.id} 
                  book={book} 
                  onPlay={() => handlePlayBook(book)}
                  isCurrentlyPlaying={currentBook?.id === book.id && isPlaying}
                />
              ) : (
                <BookList 
                  key={book.id} 
                  book={book} 
                  onPlay={() => handlePlayBook(book)}
                  isCurrentlyPlaying={currentBook?.id === book.id && isPlaying}
                />
              )
            ))}
          </div>
        )}
      </div>

      {/* Audio Player */}
      {currentBook && (
        <AudioPlayer
          book={currentBook}
          isPlaying={isPlaying}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onProgressUpdate={(time) => updateProgress(currentBook.id, time)}
          onClose={() => {
            setCurrentBook(null);
            setIsPlaying(false);
          }}
        />
      )}
    </div>
  );
} 