"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSave, 
  faTimes, 
  faCalendarAlt,
  faExclamationTriangle,
  faVideo,
  faCamera,
  faMicrophone,
  faDesktop,
  faCog,
  faUserPlus,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { VideoRecorder } from '@/components/video';
import { RecordingMode, RecordedVideo, RecordingStatus } from '@/types/videoRecording';

enum TaskPageView {
  FORM = 'form',
  RECORDING = 'recording'
}

export default function NewTaskPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<TaskPageView>(TaskPageView.FORM);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>(RecordingMode.VIDEO);
  const [showRecordingOptions, setShowRecordingOptions] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    assignedTo: [] as string[],
    dueDate: '',
    priority: 'MEDIUM',
    status: 'NOT_GROOMED',
    recordingId: '' // To store the video recording ID
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchUsers();
    }
  }, [status, router]);

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  // Set up preview when switching to recording view
  useEffect(() => {
    if (currentView === TaskPageView.RECORDING && recordingMode !== RecordingMode.AUDIO_ONLY) {
      setupPreviewStream();
    } else {
      stopPreviewStream();
    }
  }, [currentView, recordingMode]);

  const setupPreviewStream = async () => {
    try {
      // Stop any existing stream
      stopPreviewStream();
      
      // Get new stream based on selected mode
      let stream: MediaStream;
      if (recordingMode === RecordingMode.SCREEN_SHARE) {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
      } else { // VIDEO mode
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      }
      
      // Store and display the stream
      mediaStreamRef.current = stream;
      
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.muted = true; // Prevent feedback
        await videoPreviewRef.current.play().catch(err => 
          console.error("Error playing preview:", err)
        );
      }
    } catch (err) {
      console.error("Error setting up preview stream:", err);
    }
  };

  const stopPreviewStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTaskData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setTaskData(prev => ({
      ...prev,
      assignedTo: selectedOptions
    }));
  };

  const handleUserToggle = (userId: string) => {
    setTaskData(prev => {
      const currentAssignees = [...prev.assignedTo];
      
      // Check if user is already assigned
      if (currentAssignees.includes(userId)) {
        // Remove user
        return {
          ...prev,
          assignedTo: currentAssignees.filter(id => id !== userId)
        };
      } else {
        // Add user
        return {
          ...prev,
          assignedTo: [...currentAssignees, userId]
        };
      }
    });
  };

  const handleVideoSaved = (video: RecordedVideo) => {
    setTaskData(prev => ({
      ...prev,
      recordingId: video.id
    }));
    setCurrentView(TaskPageView.FORM);
    stopPreviewStream();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create task');
      }
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/tasks/taskboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the task');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (mode: RecordingMode) => {
    setRecordingMode(mode);
    setShowRecordingOptions(false);
    
    // If we're already in recording view, update the preview
    if (currentView === TaskPageView.RECORDING) {
      if (mode !== RecordingMode.AUDIO_ONLY) {
        setupPreviewStream();
      } else {
        stopPreviewStream();
      }
    }
  };

  const renderRecordingView = () => {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Record Video/Audio</h2>
          <div className="flex space-x-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRecordingOptions(!showRecordingOptions)}
                className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <FontAwesomeIcon icon={faCog} className="mr-2" />
                Options
              </button>
              {showRecordingOptions && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      type="button"
                      className={`flex items-center px-4 py-2 text-sm w-full text-left ${recordingMode === RecordingMode.VIDEO ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                      onClick={() => handleModeChange(RecordingMode.VIDEO)}
                    >
                      <FontAwesomeIcon icon={faCamera} className="mr-2" />
                      Camera Video
                    </button>
                    <button
                      type="button"
                      className={`flex items-center px-4 py-2 text-sm w-full text-left ${recordingMode === RecordingMode.AUDIO_ONLY ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                      onClick={() => handleModeChange(RecordingMode.AUDIO_ONLY)}
                    >
                      <FontAwesomeIcon icon={faMicrophone} className="mr-2" />
                      Audio Only
                    </button>
                    <button
                      type="button"
                      className={`flex items-center px-4 py-2 text-sm w-full text-left ${recordingMode === RecordingMode.SCREEN_SHARE ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                      onClick={() => handleModeChange(RecordingMode.SCREEN_SHARE)}
                    >
                      <FontAwesomeIcon icon={faDesktop} className="mr-2" />
                      Screen Recording
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setCurrentView(TaskPageView.FORM)}
              className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-150"
            >
              <FontAwesomeIcon icon={faTimes} className="mr-2" />
              Cancel
            </button>
          </div>
        </div>
        
        {recordingMode !== RecordingMode.AUDIO_ONLY && (
          <div className="mb-4 bg-gray-800 rounded-lg overflow-hidden shadow-lg relative">
            {mediaStreamRef.current && (
              <div className="absolute top-2 right-2 z-10 bg-green-500 text-white px-2 py-1 text-xs rounded-full">
                LIVE
              </div>
            )}
            <video 
              ref={videoPreviewRef}
              className="w-full h-auto max-h-[200px] object-contain" 
              autoPlay 
              muted 
              playsInline
            />
            <div className="bg-black bg-opacity-70 text-white text-xs p-2">
              {recordingMode === RecordingMode.VIDEO ? 'Camera Preview' : 'Screen Preview'}
            </div>
          </div>
        )}
        
        <VideoRecorder onVideoSaved={handleVideoSaved} />
      </div>
    );
  };

  const renderFormView = () => {
    return (
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        {taskData.recordingId && (
          <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faVideo} className="text-blue-500 mr-2" />
              <span className="font-medium text-blue-700">Recording attached to this task</span>
            </div>
          </div>
        )}
      
        <div className="mb-6">
          <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={taskData.title}
            onChange={handleInputChange}
            className="shadow-sm text-2xl font-semibold border border-gray-200 rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-colors duration-200"
            placeholder="Task title"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={taskData.description}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Task description"
            rows={4}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="dueDate" className="block text-gray-700 text-sm font-bold mb-2">
              Due Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
              </div>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={taskData.dueDate}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 pl-10 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="assignedTo">
              Assigned To
            </label>
            <div className="mb-2">
              {taskData.assignedTo.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-3">
                  {taskData.assignedTo.map(userId => {
                    const user = users.find(u => u.id === userId);
                    const userEmail = user?.email || 'Unknown';
                    const initial = userEmail.charAt(0).toUpperCase();
                    
                    return (
                      <div 
                        key={userId} 
                        className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-100"
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-medium mr-2">
                          {initial}
                        </div>
                        <span className="text-sm max-w-[150px] truncate">{userEmail}</span>
                        <button 
                          type="button"
                          onClick={() => handleUserToggle(userId)}
                          className="ml-1.5 text-blue-400 hover:text-blue-700 transition-colors"
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 italic text-sm mb-3">No users assigned</p>
              )}
            </div>
            
            <div className="relative">
              <div className="border border-gray-200 rounded-lg p-2 bg-white shadow-sm">
                <div className="flex items-center text-gray-600 p-1">
                  <FontAwesomeIcon icon={faUserPlus} className="mr-2 text-gray-400" />
                  <span className="text-sm font-medium">Add users</span>
                </div>
                
                <div className="mt-2 max-h-40 overflow-y-auto">
                  {users.map(user => {
                    const isAssigned = taskData.assignedTo.includes(user.id);
                    
                    return (
                      <div 
                        key={user.id}
                        onClick={() => handleUserToggle(user.id)}
                        className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
                          isAssigned 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full ${isAssigned ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-700'} flex items-center justify-center font-medium mr-2`}>
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.email}</p>
                        </div>
                        {isAssigned && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            Assigned
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="priority" className="block text-gray-700 text-sm font-bold mb-2">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={taskData.priority}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={taskData.status}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="NOT_GROOMED">Not Groomed</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">Review</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-gray-700 text-sm font-bold">
              Recording
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRecordingOptions(!showRecordingOptions)}
                className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <FontAwesomeIcon icon={faCog} className="mr-2" />
                Options
              </button>
              {showRecordingOptions && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      type="button"
                      className={`flex items-center px-4 py-2 text-sm w-full text-left ${recordingMode === RecordingMode.VIDEO ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                      onClick={() => setRecordingMode(RecordingMode.VIDEO)}
                    >
                      <FontAwesomeIcon icon={faCamera} className="mr-2" />
                      Camera Video
                    </button>
                    <button
                      type="button"
                      className={`flex items-center px-4 py-2 text-sm w-full text-left ${recordingMode === RecordingMode.AUDIO_ONLY ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                      onClick={() => setRecordingMode(RecordingMode.AUDIO_ONLY)}
                    >
                      <FontAwesomeIcon icon={faMicrophone} className="mr-2" />
                      Audio Only
                    </button>
                    <button
                      type="button"
                      className={`flex items-center px-4 py-2 text-sm w-full text-left ${recordingMode === RecordingMode.SCREEN_SHARE ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                      onClick={() => setRecordingMode(RecordingMode.SCREEN_SHARE)}
                    >
                      <FontAwesomeIcon icon={faDesktop} className="mr-2" />
                      Screen Recording
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentView(TaskPageView.RECORDING)}
              className="flex items-center justify-center px-4 py-2 w-full border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              {recordingMode === RecordingMode.VIDEO && (
                <>
                  <FontAwesomeIcon icon={faCamera} className="mr-2" />
                  Record Video
                </>
              )}
              {recordingMode === RecordingMode.AUDIO_ONLY && (
                <>
                  <FontAwesomeIcon icon={faMicrophone} className="mr-2" />
                  Record Audio
                </>
              )}
              {recordingMode === RecordingMode.SCREEN_SHARE && (
                <>
                  <FontAwesomeIcon icon={faDesktop} className="mr-2" />
                  Record Screen
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="flex justify-between">
          <Link href="/tasks/taskboard">
            <button 
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-150 flex items-center"
            >
              <FontAwesomeIcon icon={faTimes} className="mr-2" />
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200 flex items-center"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faSave} className="mr-2" />
            Create Task
          </button>
        </div>
      </form>
    );
  };

  if (loading && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow">
          <div className="text-center">
            <div className="rounded-full bg-green-100 p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Task Created Successfully!</h2>
            <p className="text-gray-600 mb-4">Your task has been created. Redirecting to taskboard...</p>
            <Link href="/tasks/taskboard">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200">
                Go to Taskboard
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Create New Task</h1>
          
          {currentView === TaskPageView.RECORDING ? (
            <button
              onClick={() => {
                setCurrentView(TaskPageView.FORM);
                stopPreviewStream();
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-150 flex items-center"
            >
              <FontAwesomeIcon icon={faTimes} className="mr-2" />
              Cancel Recording
            </button>
          ) : (
            <Link href="/tasks/taskboard">
              <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-150 flex items-center">
                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                Cancel
              </button>
            </Link>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
              <span className="font-medium">Error:</span>
              <span className="ml-1">{error}</span>
            </div>
          </div>
        )}

        {currentView === TaskPageView.RECORDING ? renderRecordingView() : renderFormView()}
      </div>
    </div>
  );
} 