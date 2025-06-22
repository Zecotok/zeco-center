"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faBook
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import SimpleAudioPlayer from '@/components/audiobooks/SimpleAudioPlayer';
import BookCard from '@/components/audiobooks/BookCard';

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
    title: string;
    start_time: number;
    duration: number;
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
  const [currentBook, setCurrentBook] = useState<AudioBook | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shouldAutoExpand, setShouldAutoExpand] = useState(false);

  // Apply overflow hidden to body to prevent page scrollbars
  useEffect(() => {
    document.body.classList.add('overflow-hidden-page');
    return () => {
      document.body.classList.remove('overflow-hidden-page');
    };
  }, []);

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

  // Filter books based on search only
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

    setFilteredBooks(filtered);
  }, [searchTerm, audiobooks]);

  const handlePlayBook = (book: AudioBook) => {
    setCurrentBook(book);
    setIsPlaying(false);
    setShouldAutoExpand(true);
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
    <div className="h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col overflow-hidden">
      {/* Search Bar - Fixed at top */}
      <div className="bg-white shadow-sm border-b flex-shrink-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="relative max-w-md mx-auto">
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
        </div>
      </div>

      {/* Scrollable Grid Container - Takes remaining height */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 h-full">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#2C4A7F]"></div>
            </div>
          )}

          {/* No Results */}
          {!loading && filteredBooks.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FontAwesomeIcon icon={faBook} className="text-6xl text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No audiobooks found</h3>
                <p className="text-gray-500">Try adjusting your search criteria</p>
              </div>
            </div>
          )}

          {/* Audiobooks Grid with Scroll */}
          {!loading && filteredBooks.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-max">
              {filteredBooks.map((book) => (
                <BookCard 
                  key={book.id} 
                  book={book} 
                  onPlay={() => handlePlayBook(book)}
                  isCurrentlyPlaying={currentBook?.id === book.id && isPlaying}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Audio Player */}
      {currentBook && (
        <SimpleAudioPlayer
          book={currentBook}
          isPlaying={isPlaying}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onProgressUpdate={(time) => updateProgress(currentBook.id, time)}
          onClose={() => {
            setCurrentBook(null);
            setIsPlaying(false);
            setShouldAutoExpand(false);
          }}
          autoExpand={shouldAutoExpand}
          onAutoExpandHandled={() => setShouldAutoExpand(false)}
        />
      )}
    </div>
  );
} 