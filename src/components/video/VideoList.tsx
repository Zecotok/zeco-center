'use client';

import React, { useState, useEffect } from 'react';
import { RecordedVideo } from '@/types/videoRecording';
import { getQualityById } from '@/libs/videoQualityConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faPlay, faSearch, faClock, faVideo } from '@fortawesome/free-solid-svg-icons';

interface VideoListProps {
  onVideoSelect: (video: RecordedVideo) => void;
}

const VideoList: React.FC<VideoListProps> = ({ onVideoSelect }) => {
  const [videos, setVideos] = useState<RecordedVideo[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<RecordedVideo | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchVideos = async (query: string = '') => {
    if (!isMounted) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const url = `/api/videos${query ? `?search=${encodeURIComponent(query)}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      
      const data = await response.json();
      setVideos(data.videos || []);
    } catch (err: any) {
      console.error('Error fetching videos:', err);
      setError(err.message || 'Error fetching videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      fetchVideos();
    }
  }, [isMounted]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVideos(searchQuery);
  };

  const handleEdit = (video: RecordedVideo) => {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditDescription(video.description || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editingVideo) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/videos/${editingVideo.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update video');
      }
      
      // Refresh videos list
      fetchVideos(searchQuery);
      setIsEditing(false);
      setEditingVideo(null);
    } catch (err: any) {
      console.error('Error updating video:', err);
      setError(err.message || 'Error updating video');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/videos/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete video');
      }
      
      // Refresh videos list
      fetchVideos(searchQuery);
    } catch (err: any) {
      console.error('Error deleting video:', err);
      setError(err.message || 'Error deleting video');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours > 0 ? String(hours).padStart(2, '0') : null,
      String(minutes).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex flex-col space-y-4">
        <h2 className="text-xl font-bold">Recorded Videos</h2>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex space-x-2">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Search
          </button>
        </form>
        
        {/* Edit Modal */}
        {isEditing && editingVideo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Edit Video</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter description"
                  />
                </div>
              </div>
              
              <div className="mt-5 flex justify-end space-x-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={!editTitle.trim()}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Videos List */}
        {loading ? (
          <div className="p-4 text-center">Loading videos...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-600">{error}</div>
        ) : videos.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No videos found. Start recording!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="border rounded-md overflow-hidden hover:shadow-md transition-shadow"
              >
                <div
                  className="aspect-video bg-gray-100 cursor-pointer"
                  onClick={() => onVideoSelect(video)}
                >
                  {/* Video Thumbnail - We're using a placeholder */}
                  <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                    <FontAwesomeIcon icon={faVideo} size="3x" />
                  </div>
                </div>
                
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 truncate" title={video.title}>
                    {video.title}
                  </h3>
                  
                  {video.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2" title={video.description}>
                      {video.description}
                    </p>
                  )}
                  
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <div className="flex items-center mr-3">
                      <FontAwesomeIcon icon={faClock} className="mr-1" />
                      {formatDuration(video.duration)}
                    </div>
                    <div>
                      {formatFileSize(video.fileSize)}
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-between">
                    <button
                      onClick={() => onVideoSelect(video)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <FontAwesomeIcon icon={faPlay} className="mr-1" />
                      Play
                    </button>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(video)}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDelete(video.id)}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoList;