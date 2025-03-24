"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faEdit, 
  faTrash, 
  faClock,
  faFlag,
  faUser,
  faCalendarAlt,
  faComment,
  faPaperPlane,
  faCheckCircle,
  faExclamationTriangle,
  faFont,
  faMicrophone,
  faVideo,
  faDesktop,
  faTimes,
  faUserPlus,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import { MediaRecorder } from '@/components/video';
import { RecordingMode } from '@/types/videoRecording';

// Task status component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 border border-green-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'NOT_STARTED': return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'BLOCKED': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  return (
    <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusColor(status)}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

// Priority badge component
const PriorityBadge = ({ priority }: { priority: string }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border border-green-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  return (
    <span className={`text-sm font-medium px-3 py-1 rounded-full ${getPriorityColor(priority)}`}>
      {priority}
    </span>
  );
};

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [comment, setComment] = useState('');
  const [commentType, setCommentType] = useState<'text' | 'audio' | 'video' | 'screenshare'>('text');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedMediaUrl, setRecordedMediaUrl] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [mediaDuration, setMediaDuration] = useState(0);
  const [mediaFileSize, setMediaFileSize] = useState(0);

  // Fetch task data when component mounts
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    } else if (sessionStatus === 'authenticated') {
      fetchTaskData();
      fetchUsers();
    }
  }, [sessionStatus, params.id, router]);

  const fetchTaskData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch(`/api/tasks/${params.id}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Task not found');
        } else {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch task');
        }
      }
      
      const data = await res.json();
      setTask(data.task);
      setEditedTask(data.task);
    } catch (err: any) {
      console.error('Error fetching task:', err);
      setError(err.message || 'Failed to load task');
    } finally {
      setLoading(false);
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
    setEditedTask((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setEditedTask((prev: any) => ({
      ...prev,
      assignedTo: selectedOptions.map(id => ({
        _id: id,
        email: users.find(user => user.id === id)?.email || ''
      }))
    }));
  };

  const handleUserToggle = (userId: string) => {
    setEditedTask((prev: any) => {
      const currentAssignees = prev.assignedTo || [];
      const isUserAssigned = currentAssignees.some((user: any) => user._id === userId);
      
      if (isUserAssigned) {
        // Remove user
        return {
          ...prev,
          assignedTo: currentAssignees.filter((user: any) => user._id !== userId)
        };
      } else {
        // Add user
        return {
          ...prev,
          assignedTo: [
            ...currentAssignees,
            {
              _id: userId,
              email: users.find(user => user.id === userId)?.email || ''
            }
          ]
        };
      }
    });
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const dataToSend = {
        ...editedTask,
        assignedTo: editedTask.assignedTo.map((user: any) => user._id || user)
      };
      
      const res = await fetch(`/api/tasks/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update task');
      }
      
      const data = await res.json();
      setTask(data.task);
      setIsEditing(false);
      setSuccessMessage('Task updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err: any) {
      console.error('Error updating task:', err);
      setError(err.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch(`/api/tasks/${params.id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete task');
      }
      
      router.push('/tasks/taskboard');
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task');
      setLoading(false);
      setConfirmDelete(false);
    }
  };

  // Function to handle capturing media from the MediaRecorder component
  const handleMediaCaptured = (blob: Blob, duration: number, fileSize: number) => {
    setRecordedBlob(blob);
    setMediaDuration(duration);
    setMediaFileSize(fileSize);
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    setRecordedMediaUrl(url);
  };
  
  // Function to handle canceling the recording
  const handleCancelRecording = () => {
    if (recordedMediaUrl) {
      URL.revokeObjectURL(recordedMediaUrl);
      setRecordedMediaUrl(null);
    }
    
    setRecordedBlob(null);
  };
  
  // Function to discard the recording
  const discardRecording = () => {
    if (recordedMediaUrl) {
      URL.revokeObjectURL(recordedMediaUrl);
      setRecordedMediaUrl(null);
    }
    
    setRecordedBlob(null);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that we have either text content or media content
    if (commentType === 'text' && !comment.trim()) return;
    if (commentType !== 'text' && !recordedBlob) return;
    
    try {
      setSubmittingComment(true);
      setError('');
      
      let commentData: any = {
        taskId: params.id,
        commentType
      };
      
      // Handle text comments
      if (commentType === 'text') {
        commentData.content = comment;
        
        const res = await fetch('/api/tasks/comments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(commentData)
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to add comment');
        }
        
        const data = await res.json();
        
        // Update comments in the task
        setTask((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: [...(prev.comments || []), data.comment]
          };
        });
        
        setComment('');
      } 
      // Handle media comments (audio, video, screenshare)
      else if (recordedBlob) {
        // Create a FormData object to send the file
        const formData = new FormData();
        formData.append('taskId', params.id);
        formData.append('commentType', commentType);
        formData.append('mediaFile', recordedBlob, `${commentType}-${Date.now()}.webm`);
        
        const res = await fetch('/api/tasks/comments/media', {
          method: 'POST',
          body: formData
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to add media comment');
        }
        
        const data = await res.json();
        
        // Update comments in the task
        setTask((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: [...(prev.comments || []), data.comment]
          };
        });
        
        // Clean up media recording
        if (recordedMediaUrl) {
          URL.revokeObjectURL(recordedMediaUrl);
        }
        setRecordedMediaUrl(null);
        setRecordedBlob(null);
      }
      
    } catch (err: any) {
      console.error('Error adding comment:', err);
      setError(err.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };
  
  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  };

  // Render media comment based on type
  const renderMediaComment = (comment: any) => {
    const mediaUrl = comment.mediaUrl;
    
    if (!mediaUrl) {
      return <p className="text-gray-500 italic">Media not available</p>;
    }
    
    switch (comment.commentType) {
      case 'audio':
        return (
          <audio controls className="w-full">
            <source src={mediaUrl} type="audio/webm" />
            Your browser does not support the audio element.
          </audio>
        );
      
      case 'video':
      case 'screenshare':
        return (
          <video controls className="w-full rounded">
            <source src={mediaUrl} type="video/webm" />
            Your browser does not support the video element.
          </video>
        );
        
      default:
        return <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>;
    }
  };

  if (loading && !task) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
              <span className="font-medium">Error:</span>
              <span className="ml-1">{error}</span>
            </div>
            <div className="mt-4">
              <Link href="/tasks/taskboard">
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200">
                  Return to Taskboard
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <div className="mb-6">
          <Link href="/tasks/taskboard">
            <button className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium">
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Back to Taskboard
            </button>
          </Link>
        </div>
        
        {/* Success message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-r shadow-sm" role="alert">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCheckCircle} className="mr-2 text-green-500" />
              <span className="font-medium">{successMessage}</span>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r shadow-sm" role="alert">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-red-500" />
              <span className="font-medium">Error:</span>
              <span className="ml-1">{error}</span>
            </div>
          </div>
        )}
        
        {/* Task details card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all duration-200 hover:shadow-md">
          {/* Task header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {task?.title}
                </h1>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <StatusBadge status={task?.status} />
                  <PriorityBadge priority={task?.priority} />
                </div>
              </div>
              
              {!isEditing && (
                <div className="flex space-x-3">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center shadow-sm"
                  >
                    <FontAwesomeIcon icon={faEdit} className="mr-2" />
                    Edit
                  </button>
                  
                  <button 
                    onClick={handleDeleteTask}
                    className={`px-4 py-2 ${confirmDelete ? 'bg-red-600' : 'bg-gray-600'} text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center shadow-sm`}
                  >
                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                    {confirmDelete ? 'Confirm Delete' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Task details */}
          <div className="p-6">
            {isEditing ? (
              <form onSubmit={handleSubmitEdit}>
                {/* Description section - Jira style */}
                <div className="mb-5">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={editedTask.description || ''}
                    onChange={handleInputChange}
                    className="shadow-sm border border-gray-200 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-colors duration-200"
                    rows={4}
                    placeholder="Add a description..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().split('T')[0] : ''}
                      onChange={handleInputChange}
                      className="shadow-sm border border-gray-200 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-colors duration-200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Assigned To
                    </label>
                    <div className="mb-2">
                      {editedTask.assignedTo && editedTask.assignedTo.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {editedTask.assignedTo.map((user: any) => {
                            const userEmail = user.email || 'Unknown';
                            const initial = userEmail.charAt(0).toUpperCase();
                            
                            return (
                              <div 
                                key={user._id} 
                                className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-100"
                              >
                                <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-medium mr-2">
                                  {initial}
                                </div>
                                <span className="text-sm max-w-[150px] truncate">{userEmail}</span>
                                <button 
                                  type="button"
                                  onClick={() => handleUserToggle(user._id)}
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
                            const isAssigned = editedTask.assignedTo ? 
                              editedTask.assignedTo.some((assigned: any) => assigned._id === user.id) : 
                              false;
                            
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
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={editedTask.status}
                      onChange={handleInputChange}
                      className="shadow-sm border border-gray-200 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-colors duration-200"
                    >
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={editedTask.priority}
                      onChange={handleInputChange}
                      className="shadow-sm border border-gray-200 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-colors duration-200"
                    >
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedTask(task);
                    }}
                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm font-medium"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                {/* Description section - Jira style */}
                <div className="mb-8 group relative">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-semibold text-gray-800">Description</h2>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-600 hover:text-blue-800 text-sm bg-white border border-gray-200 rounded px-2 py-1 flex items-center shadow-sm"
                    >
                      <FontAwesomeIcon icon={faEdit} className="mr-1" />
                      Edit
                    </button>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 hover:bg-white transition-colors duration-200">
                    {task?.description ? (
                      <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {task.description}
                      </div>
                    ) : (
                      <div className="text-gray-500 italic flex items-center">
                        <FontAwesomeIcon icon={faEdit} className="mr-2 text-gray-400" />
                        No description provided. Click &apos;Edit&apos; to add a description for this task.
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Details</h2>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <div className="bg-blue-50 p-2 rounded-full mr-3">
                          <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Due Date</p>
                          <p className={`${isOverdue(task?.dueDate) && task?.status !== 'COMPLETED' ? 'text-red-600 font-semibold' : 'text-gray-800'}`}>
                            {formatDate(task?.dueDate)}
                          </p>
                        </div>
                      </li>
                      
                      <li className="flex items-start">
                        <div className="bg-blue-50 p-2 rounded-full mr-3">
                          <FontAwesomeIcon icon={faFlag} className="text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Priority</p>
                          <p className="text-gray-800">{task?.priority}</p>
                        </div>
                      </li>
                      
                      <li className="flex items-start">
                        <div className="bg-blue-50 p-2 rounded-full mr-3">
                          <FontAwesomeIcon icon={faClock} className="text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Status</p>
                          <p className="text-gray-800">{task?.status?.replace('_', ' ')}</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">People</h2>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <div className="bg-blue-50 p-2 rounded-full mr-3">
                          <FontAwesomeIcon icon={faUser} className="text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Created By</p>
                          <p className="text-gray-800">{task?.createdBy?.email || 'Unknown'}</p>
                        </div>
                      </li>
                      
                      <li className="flex items-start">
                        <div className="bg-blue-50 p-2 rounded-full mr-3">
                          <FontAwesomeIcon icon={faUser} className="text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Assigned To</p>
                          {task?.assignedTo?.length > 0 ? (
                            <ul className="list-none">
                              {task.assignedTo.map((user: any) => (
                                <li key={user._id} className="text-gray-800 py-1 border-b border-gray-100 last:border-0">
                                  {user.email || user.fullname || 'Unknown'}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500 italic">No assignees</p>
                          )}
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="border-t border-gray-100 pt-6">
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-semibold text-gray-800">
                      <FontAwesomeIcon icon={faComment} className="mr-2 text-blue-500" />
                      Comments ({task?.comments?.length || 0})
                    </h2>
                  </div>
                  
                  {/* Comment form */}
                  <div className="mb-8">
                    {/* Comment type selector */}
                    <div className="flex mb-4 space-x-2 border-b border-gray-100 pb-4">
                      <button
                        type="button"
                        onClick={() => setCommentType('text')}
                        className={`px-4 py-2 rounded-lg flex items-center transition-colors duration-200 ${commentType === 'text' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                      >
                        <FontAwesomeIcon icon={faFont} className="mr-2" />
                        Text
                      </button>
                      <button
                        type="button"
                        onClick={() => setCommentType('audio')}
                        className={`px-4 py-2 rounded-lg flex items-center transition-colors duration-200 ${commentType === 'audio' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                      >
                        <FontAwesomeIcon icon={faMicrophone} className="mr-2" />
                        Audio
                      </button>
                      <button
                        type="button"
                        onClick={() => setCommentType('video')}
                        className={`px-4 py-2 rounded-lg flex items-center transition-colors duration-200 ${commentType === 'video' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                      >
                        <FontAwesomeIcon icon={faVideo} className="mr-2" />
                        Video
                      </button>
                      <button
                        type="button"
                        onClick={() => setCommentType('screenshare')}
                        className={`px-4 py-2 rounded-lg flex items-center transition-colors duration-200 ${commentType === 'screenshare' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                      >
                        <FontAwesomeIcon icon={faDesktop} className="mr-2" />
                        Screen
                      </button>
                    </div>
                    
                    <form onSubmit={handleSubmitComment}>
                      {/* Text comment input */}
                      {commentType === 'text' && (
                        <div className="flex items-start space-x-3">
                          <div className="flex-grow">
                            <textarea
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              placeholder="Add a comment..."
                              className="shadow-sm border border-gray-200 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-colors duration-200"
                              rows={2}
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={submittingComment || !comment.trim()}
                            className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          >
                            <FontAwesomeIcon icon={faPaperPlane} />
                          </button>
                        </div>
                      )}
                      
                      {/* Media comment input (audio, video, screenshare) */}
                      {(commentType === 'audio' || commentType === 'video' || commentType === 'screenshare') && (
                        <div className="space-y-4">
                          {recordedMediaUrl ? (
                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm">
                              <div className="flex justify-between items-center mb-3">
                                <h3 className="font-medium text-gray-800">Preview</h3>
                                <button
                                  type="button"
                                  onClick={discardRecording}
                                  className="text-gray-500 hover:text-gray-700 bg-white p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                                >
                                  <FontAwesomeIcon icon={faTimes} />
                                </button>
                              </div>
                              
                              {commentType === 'audio' ? (
                                <audio controls className="w-full mb-4">
                                  <source src={recordedMediaUrl} type="audio/webm" />
                                </audio>
                              ) : (
                                <video controls className="w-full mb-4 rounded-lg">
                                  <source src={recordedMediaUrl} type="video/webm" />
                                </video>
                              )}
                              
                              <button
                                type="submit"
                                disabled={submittingComment}
                                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 font-medium shadow-sm"
                              >
                                {submittingComment ? 'Sending...' : `Send ${commentType === 'audio' ? 'Audio' : commentType === 'video' ? 'Video' : 'Screen Recording'}`}
                              </button>
                            </div>
                          ) : (
                            <MediaRecorder 
                              key={`media-recorder-${commentType}`}
                              onMediaCaptured={handleMediaCaptured}
                              onCancel={handleCancelRecording}
                              uploadDirectory="/task-media"
                              initialMode={
                                commentType === 'audio' 
                                  ? RecordingMode.AUDIO_ONLY 
                                  : commentType === 'video' 
                                    ? RecordingMode.VIDEO 
                                    : RecordingMode.SCREEN_SHARE
                              }
                              showModeSelector={false}
                              className="border-0 shadow-sm rounded-lg overflow-hidden"
                            />
                          )}
                        </div>
                      )}
                    </form>
                  </div>
                  
                  {/* Comments list */}
                  {task?.comments?.length > 0 ? (
                    <ul className="space-y-5">
                      {task.comments.map((comment: any) => (
                        <li key={comment._id} className="bg-gray-50 rounded-lg p-5 border border-gray-100 shadow-sm transition-all duration-200 hover:shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              <div className="mr-3 bg-blue-100 text-blue-800 rounded-full w-10 h-10 flex items-center justify-center font-medium">
                                {comment.author?.email?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div>
                                <span className="font-medium text-gray-800">{comment.author?.email || 'Unknown'}</span>
                                {comment.commentType && comment.commentType !== 'text' && (
                                  <span className="ml-2 text-xs px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                                    {comment.commentType === 'audio' ? 'Audio' : 
                                     comment.commentType === 'video' ? 'Video' : 
                                     comment.commentType === 'screenshare' ? 'Screen Recording' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">{formatDateTime(comment.createdAt)}</span>
                          </div>
                          <div className="mt-3 pl-13">
                            {comment.commentType && comment.commentType !== 'text' 
                              ? renderMediaComment(comment)
                              : <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                            }
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-gray-500 italic">No comments yet</p>
                      <p className="text-sm text-gray-400 mt-1">Be the first to add a comment!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 