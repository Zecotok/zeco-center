'use client';

import React, { useState } from 'react';
import { VideoRecorder, VideoList, VideoPlayer } from '@/components/video';
import { RecordedVideo } from '@/types/videoRecording';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faList, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

enum VideoPageView {
  LIST = 'list',
  RECORD = 'record',
  PLAY = 'play'
}

export default function VideosPage() {
  const [currentView, setCurrentView] = useState<VideoPageView>(VideoPageView.LIST);
  const [selectedVideo, setSelectedVideo] = useState<RecordedVideo | null>(null);

  const handleVideoSaved = (video: RecordedVideo) => {
    setCurrentView(VideoPageView.LIST);
  };

  const handleVideoSelect = (video: RecordedVideo) => {
    setSelectedVideo(video);
    setCurrentView(VideoPageView.PLAY);
  };

  const renderContent = () => {
    switch (currentView) {
      case VideoPageView.RECORD:
        return <VideoRecorder onVideoSaved={handleVideoSaved} />;
      case VideoPageView.PLAY:
        return (
          <VideoPlayer 
            video={selectedVideo} 
            onClose={() => {
              setSelectedVideo(null);
              setCurrentView(VideoPageView.LIST);
            }} 
          />
        );
      case VideoPageView.LIST:
      default:
        return <VideoList onVideoSelect={handleVideoSelect} />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Video Management</h1>
        
        <div className="flex space-x-2">
          {currentView !== VideoPageView.LIST ? (
            <button
              onClick={() => setCurrentView(VideoPageView.LIST)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Back to List
            </button>
          ) : (
            <button
              onClick={() => setCurrentView(VideoPageView.RECORD)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FontAwesomeIcon icon={faVideo} className="mr-2" />
              Record New Video
            </button>
          )}
        </div>
      </div>
      
      {renderContent()}
    </div>
  );
} 