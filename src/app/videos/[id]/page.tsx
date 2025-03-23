'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { VideoPlayer } from '@/components/video';
import { RecordedVideo } from '@/types/videoRecording';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function VideoPlayerPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [video, setVideo] = useState<RecordedVideo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const videoId = params?.id?.toString();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch video data when component loads
  useEffect(() => {
    if (status === "authenticated" && videoId) {
      const fetchVideo = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const response = await fetch(`/api/videos/${videoId}`);
          
          if (!response.ok) {
            throw new Error(response.status === 404 ? 'Video not found' : 'Failed to load video');
          }
          
          const data = await response.json();
          setVideo(data.video);
        } catch (err: any) {
          console.error('Error loading video:', err);
          setError(err.message || 'Failed to load video');
        } finally {
          setLoading(false);
        }
      };

      fetchVideo();
    }
  }, [videoId, status]);

  // Handle back button click
  const handleBack = () => {
    router.push('/videos');
  };

  // Show loading state while checking authentication
  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated
  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Video Player</h1>
        
        <button
          onClick={handleBack}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Back to Videos
        </button>
      </div>
      
      {error ? (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : (
        <VideoPlayer 
          video={video} 
          onClose={handleBack}
        />
      )}
    </div>
  );
} 