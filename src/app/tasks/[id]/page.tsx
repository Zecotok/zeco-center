"use client";

import { useState, useEffect } from 'react';
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
  faSave,
  faUserEdit,
  faUserPlus
} from '@fortawesome/free-solid-svg-icons';
import { MediaRecorder } from '@/components/video';
import { RecordingMode } from '@/types/videoRecording';

// Task status component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'NOT_STARTED': return 'bg-gray-100 text-gray-800';
      case 'BLOCKED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`text-sm font-medium px-2.5 py-0.5 rounded ${getStatusColor(status)}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

// Priority badge component
const PriorityBadge = ({ priority }: { priority: string }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`text-sm font-medium px-2.5 py-0.5 rounded ${getPriorityColor(priority)}`}>
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
    setEditedTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setEditedTask(prev => ({
      ...prev,
      assignedTo: selectedOptions.map(id => ({
        _id: id,
        email: users.find(user => user.id === id)?.email || ''
      }))
    }));
  };

  const handleSubmitEdit = async () => {
    if (!editedTask) return;
    
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch(`/api/tasks/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedTask)
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
          <div className="flex justify-center">
            <video controls className="w-1/2 rounded" style={{ maxHeight: '50vh' }}>
              <source src={mediaUrl} type="video/webm" />
              Your browser does not support the video element.
            </video>
          </div>
        );
        
      default:
        return <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>;
    }
  };

  // Priority badge styling helper
  const renderPriorityBadge = (priority: string) => {
    let colorClasses = '';
    
    switch (priority) {
      case 'LOW':
        colorClasses = 'bg-blue-100 text-blue-800';
        break;
      case 'MEDIUM':
        colorClasses = 'bg-yellow-100 text-yellow-800';
        break;
      case 'HIGH':
        colorClasses = 'bg-orange-100 text-orange-800';
        break;
      case 'URGENT':
        colorClasses = 'bg-red-100 text-red-800';
        break;
      default:
        colorClasses = 'bg-gray-100 text-gray-800';
    }
    
    return (
      <div className={`px-3 py-1 rounded-full text-sm font-medium ${colorClasses}`}>
        {priority}
      </div>
    );
  };

  if (loading && !task) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          <p>{successMessage}</p>
        </div>
      )}
      
      {/* Task Header */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            {isEditing ? (
              <div className="flex-grow">
                <input
                  type="text"
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  className="w-full text-xl font-semibold p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-gray-800">{task.title}</h1>
            )}
            
            <div className="flex gap-2 mt-3 md:mt-0">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSubmitEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                  >
                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition duration-200"
                  >
                    <FontAwesomeIcon icon={faTimes} className="mr-2" />
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 flex items-center"
                  >
                    <FontAwesomeIcon icon={faEdit} className="mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200 flex items-center"
                  >
                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            <div className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              {task.status || 'NOT GROOMED'}
            </div>
            {renderPriorityBadge(task.priority || 'MEDIUM')}
          </div>
        </div>
        
        {/* Task Description */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Description</h2>
          {isEditing ? (
            <textarea
              value={editedTask.description}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              className="w-full h-32 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Add a description..."
            />
          ) : (
            <div className="prose max-w-none text-gray-600">
              {task.description || <span className="text-gray-400 italic">No description provided</span>}
            </div>
          )}
        </div>
        
        {/* Task Details and People */}
        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Details Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Details</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="text-gray-500 w-10">
                  <FontAwesomeIcon icon={faCalendarAlt} size="lg" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Due Date</div>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                      className="border border-gray-300 rounded p-1 text-sm"
                    />
                  ) : (
                    <div className="text-gray-800">{task.dueDate ? formatDate(task.dueDate) : 'Not set'}</div>
                  )}
                </div>
              </div>

              <div className="flex items-start">
                <div className="text-gray-500 w-10">
                  <FontAwesomeIcon icon={faFlag} size="lg" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Priority</div>
                  {isEditing ? (
                    <select
                      value={editedTask.priority}
                      onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
                      className="border border-gray-300 rounded p-1 text-sm"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  ) : (
                    <div className="text-gray-800">{task.priority || 'MEDIUM'}</div>
                  )}
                </div>
              </div>

              <div className="flex items-start">
                <div className="text-gray-500 w-10">
                  <FontAwesomeIcon icon={faClock} size="lg" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Status</div>
                  {isEditing ? (
                    <select
                      value={editedTask.status}
                      onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
                      className="border border-gray-300 rounded p-1 text-sm"
                    >
                      <option value="NOT GROOMED">Not Groomed</option>
                      <option value="BACKLOG">Backlog</option>
                      <option value="TO DO">To Do</option>
                      <option value="IN PROGRESS">In Progress</option>
                      <option value="IN REVIEW">In Review</option>
                      <option value="DONE">Done</option>
                    </select>
                  ) : (
                    <div className="text-gray-800">{task.status || 'NOT GROOMED'}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* People Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">People</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="text-gray-500 w-10">
                  <FontAwesomeIcon icon={faUserEdit} size="lg" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Created By</div>
                  <div className="text-gray-800">
                    {task.createdBy && typeof task.createdBy === 'object' && task.createdBy.email 
                      ? task.createdBy.email 
                      : 'Unknown'}
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <div className="text-gray-500 w-10">
                  <FontAwesomeIcon icon={faUserPlus} size="lg" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Assigned To</div>
                  {isEditing ? (
                    <select
                      value={editedTask.assignedTo}
                      onChange={(e) => setEditedTask({ ...editedTask, assignedTo: e.target.value })}
                      className="border border-gray-300 rounded p-1 text-sm"
                    >
                      <option value="">None</option>
                      {users.map((user: any) => (
                        <option key={user._id} value={user._id}>
                          {user.email}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-gray-800">
                      {task.assignedTo && task.assignedTo.length > 0 && 
                      typeof task.assignedTo[0] === 'object' && task.assignedTo[0].email
                        ? task.assignedTo[0].email
                        : 'No assignees'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Comments Section */}
        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center mb-4">
            <FontAwesomeIcon icon={faComment} className="text-gray-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">
              Comments ({task?.comments?.length || 0})
            </h2>
          </div>
          
          {/* Comment form */}
          <div className="mb-6">
            {/* Comment type selector */}
            <div className="flex flex-wrap mb-3 gap-2 border-b pb-3">
              <button
                type="button"
                onClick={() => setCommentType('text')}
                className={`px-3 py-2 rounded-md flex items-center ${commentType === 'text' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <FontAwesomeIcon icon={faFont} className="mr-2" />
                Text
              </button>
              <button
                type="button"
                onClick={() => setCommentType('audio')}
                className={`px-3 py-2 rounded-md flex items-center ${commentType === 'audio' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <FontAwesomeIcon icon={faMicrophone} className="mr-2" />
                Audio
              </button>
              <button
                type="button"
                onClick={() => setCommentType('video')}
                className={`px-3 py-2 rounded-md flex items-center ${commentType === 'video' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <FontAwesomeIcon icon={faVideo} className="mr-2" />
                Video
              </button>
              <button
                type="button"
                onClick={() => setCommentType('screenshare')}
                className={`px-3 py-2 rounded-md flex items-center ${commentType === 'screenshare' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <FontAwesomeIcon icon={faDesktop} className="mr-2" />
                Screen
              </button>
            </div>
            
            <form onSubmit={handleSubmitComment}>
              {/* Text comment input */}
              {commentType === 'text' && (
                <div className="flex items-start space-x-2">
                  <div className="flex-grow">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      rows={2}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingComment || !comment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FontAwesomeIcon icon={faPaperPlane} />
                  </button>
                </div>
              )}
              
              {/* Media comment input (audio, video, screenshare) */}
              {(commentType === 'audio' || commentType === 'video' || commentType === 'screenshare') && (
                <div className="space-y-3">
                  {recordedMediaUrl ? (
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">Preview</h3>
                        <button
                          type="button"
                          onClick={discardRecording}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                      
                      {commentType === 'audio' ? (
                        <audio controls className="w-full mb-3">
                          <source src={recordedMediaUrl} type="audio/webm" />
                        </audio>
                      ) : (
                        <div className="flex justify-center mb-3">
                          <video controls className="w-1/2 rounded" style={{ maxHeight: '50vh' }}>
                            <source src={recordedMediaUrl} type="video/webm" />
                          </video>
                        </div>
                      )}
                      
                      <button
                        type="submit"
                        disabled={submittingComment}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200 disabled:opacity-50"
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
                      className="border-0 shadow"
                    />
                  )}
                </div>
              )}
            </form>
          </div>
          
          {/* Comments list */}
          {task?.comments?.length > 0 ? (
            <ul className="space-y-4">
              {task.comments.map((comment: any) => (
                <li key={comment._id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="mr-2 bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center">
                        {comment.author?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <span className="font-medium">{comment.author?.email || 'Unknown'}</span>
                        {comment.commentType && comment.commentType !== 'text' && (
                          <span className="ml-2 text-xs px-2 py-1 bg-gray-200 rounded-full">
                            {comment.commentType === 'audio' ? 'Audio' : 
                             comment.commentType === 'video' ? 'Video' : 
                             comment.commentType === 'screenshare' ? 'Screen Recording' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{formatDateTime(comment.createdAt)}</span>
                  </div>
                  <div className="mt-2">
                    {comment.commentType && comment.commentType !== 'text' 
                      ? renderMediaComment(comment)
                      : <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    }
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic text-center">No comments yet</p>
          )}
        </div>
      </div>
    </div>
  );
} 