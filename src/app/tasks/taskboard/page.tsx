"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faTasks, 
  faCheckCircle, 
  faHourglassHalf, 
  faExclamationCircle,
  faCalendarAlt,
  faFilter,
  faSort,
  faUser,
  faUserCircle,
  faGripLines
} from '@fortawesome/free-solid-svg-icons';

// Task status indicator component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'TODO': return 'bg-gray-100 text-gray-800';
      case 'REVIEW': return 'bg-purple-100 text-purple-800';
      case 'NOT_GROOMED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${getStatusColor(status)}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

// Priority indicator component
const PriorityBadge = ({ priority }: { priority: string }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'URGENT': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${getPriorityColor(priority)}`}>
      {priority}
    </span>
  );
};

// User avatar component
const UserAvatar = ({ user, isSelected, onClick }: { user: any, isSelected: boolean, onClick: () => void }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  console.log('user ------------',user);
  const initials = user.fullname 
    ? user.fullname.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user.email.substring(0, 2).toUpperCase();
  
  const displayName = user.fullname || user.email;
  
  return (
    <div className="relative">
      <div 
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer border-2 transition-all ${
          isSelected ? 'border-blue-500 transform scale-110' : 'border-gray-200'
        }`}
        style={{ 
          backgroundColor: isSelected ? '#EBF4FF' : '#F9FAFB',
          color: isSelected ? '#2563EB' : '#6B7280'
        }}
      >
        {initials}
      </div>
      
      {showTooltip && (
        <div className="absolute z-10 left-1/2 -translate-x-1/2 -bottom-8 px-3 py-1 text-sm bg-black rounded text-white whitespace-nowrap">
          {displayName}
        </div>
      )}
    </div>
  );
};

// First, update the task-card-wrapper styles
const taskCardWrapperStyles = `
  .task-card-wrapper {
    position: relative;
    display: block;
  }
  
  .task-card-wrapper.dragging {
    opacity: 0.6;
  }
  
  .task-card {
    cursor: pointer;
  }

  .task-card .drag-handle {
    cursor: grab;
  }
  
  /* Prevent interactions during dragging */
  .task-card-wrapper.dragging .task-card {
    pointer-events: none;
  }
`;

// Update the TaskCard component to include the link properly
const TaskCard = ({ task, onDragStart }: { task: any, onDragStart?: (e: React.DragEvent, taskId: string, status: string) => void }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  };

  const handleDragStart = (e: React.DragEvent) => {
    // Only handle drag if initiated from the grip icon
    if (!(e.target as HTMLElement).closest('.drag-handle') && onDragStart) {
      e.preventDefault();
      return false;
    }
    
    if (onDragStart) {
      e.stopPropagation();
      
      // Add dragging class to parent
      const wrapper = (e.target as HTMLElement).closest('.task-card-wrapper');
      if (wrapper) {
        wrapper.classList.add('dragging');
      }

      // Set drag data
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify({
        taskId: task._id,
        currentStatus: task.status
      }));
      
      onDragStart(e, task._id, task.status);
    }
  };

  return (
    <Link 
      href={`/tasks/${task._id}`}
      className="no-underline hover:no-underline block"
      draggable={false}
    >
      <div 
        draggable={true}
        onDragStart={handleDragStart}
        className="task-card bg-white p-3 rounded-lg shadow hover:shadow-md transition-shadow mb-3 border-l-4 border-blue-500 group"
      >
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-sm text-gray-900 mb-1 truncate no-underline">{task.title}</h3>
          <div 
            className="drag-handle p-1 rounded hover:bg-gray-100" 
            onClick={(e) => e.preventDefault()}
          >
            <FontAwesomeIcon icon={faGripLines} className="text-gray-300 group-hover:text-gray-500" />
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mb-2 line-clamp-2 no-underline">
          {task.description || 'No description'}
        </p>
        
        <div className="flex justify-between items-center">
          <PriorityBadge priority={task.priority} />
          
          {task.dueDate && (
            <div className={`text-xs ${isOverdue(task.dueDate) ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
              {formatDate(task.dueDate)}
            </div>
          )}
        </div>
        
        {task.assignedTo && task.assignedTo.length > 0 && (
          <div className="mt-2 flex -space-x-2 overflow-hidden">
            {task.assignedTo.map((user: any, index: number) => (
              <div key={index} className="inline-block h-6 w-6 rounded-full bg-gray-200 text-xs flex items-center justify-center border border-white">
                {user.fullname ? user.fullname.charAt(0) : user.email.charAt(0)}
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default function TaskBoard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<{[key: string]: boolean}>({});
  const [analytics, setAnalytics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0
  });
  const [filter, setFilter] = useState({
    status: '',
    priority: '',
    sortBy: 'dueDate'
  });
  const [error, setError] = useState('');
  const [draggingTask, setDraggingTask] = useState<string | null>(null);
  const [draggingStatus, setDraggingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchTaskData();
      fetchUsers();
    }
  }, [status, router]);

  useEffect(() => {
    if (tasks.length > 0) {
      applyFilters();
    }
  }, [tasks, filter, selectedUsers]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        console.log('Fetched users:', data);
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchTaskData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch all tasks
      const tasksRes = await fetch('/api/tasks');
      if (!tasksRes.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const tasksData = await tasksRes.json();
      const allTasks = tasksData.tasks || [];
      setTasks(allTasks);
      
      // Calculate analytics
      let completed = 0;
      let pending = 0;
      let overdue = 0;
      
      allTasks.forEach((task: any) => {
        if (task.status === 'COMPLETED') {
          completed++;
        } else {
          pending++;
          if (isOverdue(task.dueDate)) {
            overdue++;
          }
        }
      });
      
      setAnalytics({
        totalTasks: allTasks.length,
        completedTasks: completed,
        pendingTasks: pending,
        overdueTasks: overdue
      });
    } catch (err: any) {
      console.error('Error fetching task data:', err);
      setError(err.message || 'Failed to load task data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...tasks];
    
    // Apply status filter
    if (filter.status) {
      result = result.filter((task: any) => task.status === filter.status);
    }
    
    // Apply priority filter
    if (filter.priority) {
      result = result.filter((task: any) => task.priority === filter.priority);
    }

    // Apply user filter
    const activeUserIds = Object.keys(selectedUsers).filter(id => selectedUsers[id]);
    if (activeUserIds.length > 0) {
      result = result.filter((task: any) => {
        if (!task.assignedTo || task.assignedTo.length === 0) return false;
        return task.assignedTo.some((user: any) => activeUserIds.includes(user.id || user._id));
      });
    }
    
    // Apply sorting
    result.sort((a: any, b: any) => {
      if (filter.sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (filter.sortBy === 'priority') {
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return priorityOrder[a.priority as keyof typeof priorityOrder] - 
               priorityOrder[b.priority as keyof typeof priorityOrder];
      } else {
        return 0;
      }
    });
    
    setFilteredTasks(result);
  };
  
  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter((task: any) => task.status === status);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string, status: string) => {
    setDraggingTask(taskId);
    setDraggingStatus(status);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // Get the data
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) {
        console.error('No data found in drop event');
        return;
      }
      
      const data = JSON.parse(dataStr);
      const { taskId, currentStatus } = data;
      
      if (currentStatus === newStatus || !taskId) return;
      
      // Find the task in the current list
      const taskToUpdate = tasks.find((t: any) => t._id === taskId);
      if (!taskToUpdate) return;
      
      console.log(`Moving task ${taskId} from ${currentStatus} to ${newStatus}`);
      
      // Optimistically update the UI first (no waiting)
      setTasks(prevTasks => 
        prevTasks.map((t: any) => 
          t._id === taskId ? { ...t, status: newStatus } : t
        )
      );
      
      // Remove dragging class from all task cards
      document.querySelectorAll('.task-card-wrapper.dragging').forEach(el => {
        el.classList.remove('dragging');
      });
      
      // Update on the server
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus
        })
      });
      
      if (!res.ok) {
        // If the update fails, revert the UI
        console.error('Failed to update task status on server');
        setTasks(prevTasks => 
          prevTasks.map((t: any) => 
            t._id === taskId ? { ...t, status: currentStatus } : t
          )
        );
        return;
      }
      
      // Just fetch the tasks again without page reload
      const tasksRes = await fetch('/api/tasks');
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    } finally {
      setDraggingTask(null);
      setDraggingStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button 
            onClick={fetchTaskData}
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Task Board</h1>
          <p className="text-gray-600">Manage and track all your tasks</p>
        </div>
        <div className="flex mt-4 md:mt-0 space-x-2">
          <Link href="/tasks/new">
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-150 ease-in-out">
              <FontAwesomeIcon icon={faPlus} className="mr-2" /> 
              New Task
            </button>
          </Link>
        </div>
      </div>
      
      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-start">
            <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
              <FontAwesomeIcon icon={faTasks} className="h-6 w-6" />
            </div>
            <div>
              <p className="text-gray-500 font-medium">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.totalTasks}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-start">
            <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
              <FontAwesomeIcon icon={faCheckCircle} className="h-6 w-6" />
            </div>
            <div>
              <p className="text-gray-500 font-medium">Completed</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.completedTasks}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-start">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
              <FontAwesomeIcon icon={faHourglassHalf} className="h-6 w-6" />
            </div>
            <div>
              <p className="text-gray-500 font-medium">Pending</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.pendingTasks}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-start">
            <div className="p-3 rounded-full bg-red-100 text-red-500 mr-4">
              <FontAwesomeIcon icon={faExclamationCircle} className="h-6 w-6" />
            </div>
            <div>
              <p className="text-gray-500 font-medium">Overdue</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.overdueTasks}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* User Filters */}
      {users.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faUser} className="text-gray-500 mr-2" />
              <span className="text-gray-700 font-medium">Team Members:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {users.map((user: any) => {
                const userId = user.id || user._id;
                return (
                  <UserAvatar 
                    key={userId}
                    user={user} 
                    isSelected={!!selectedUsers[userId]}
                    onClick={() => toggleUserSelection(userId)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faFilter} className="text-gray-500 mr-2" />
            <span className="text-gray-700 font-medium">Filters:</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={filter.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={filter.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Not Groomed Column */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-yellow-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <span className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
              Not Groomed
              <span className="ml-2 text-sm text-gray-500 font-normal">
                ({getTasksByStatus('NOT_GROOMED').length})
              </span>
            </h3>
          </div>
          <div 
            className="p-3 h-[calc(100vh-380px)] overflow-y-auto"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => handleDrop(e, 'NOT_GROOMED')}
          >
            {getTasksByStatus('NOT_GROOMED').length === 0 ? (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                <p>No tasks</p>
              </div>
            ) : (
              getTasksByStatus('NOT_GROOMED').map((task: any) => (
                <div key={task._id} className="task-card-wrapper">
                  <TaskCard task={task} onDragStart={handleDragStart} />
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* To Do Column */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <span className="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
              To Do
              <span className="ml-2 text-sm text-gray-500 font-normal">
                ({getTasksByStatus('TODO').length})
              </span>
            </h3>
          </div>
          <div 
            className="p-3 h-[calc(100vh-380px)] overflow-y-auto"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => handleDrop(e, 'TODO')}
          >
            {getTasksByStatus('TODO').length === 0 ? (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                <p>No tasks</p>
              </div>
            ) : (
              getTasksByStatus('TODO').map((task: any) => (
                <div key={task._id} className="task-card-wrapper">
                  <TaskCard task={task} onDragStart={handleDragStart} />
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* In Progress Column */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-blue-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
              In Progress
              <span className="ml-2 text-sm text-gray-500 font-normal">
                ({getTasksByStatus('IN_PROGRESS').length})
              </span>
            </h3>
          </div>
          <div 
            className="p-3 h-[calc(100vh-380px)] overflow-y-auto"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => handleDrop(e, 'IN_PROGRESS')}
          >
            {getTasksByStatus('IN_PROGRESS').length === 0 ? (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                <p>No tasks</p>
              </div>
            ) : (
              getTasksByStatus('IN_PROGRESS').map((task: any) => (
                <div key={task._id} className="task-card-wrapper">
                  <TaskCard task={task} onDragStart={handleDragStart} />
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Review & Completed Column */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-purple-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <span className="w-3 h-3 bg-purple-400 rounded-full mr-2"></span>
              Review
              <span className="ml-2 text-sm text-gray-500 font-normal">
                ({getTasksByStatus('REVIEW').length})
              </span>
            </h3>
          </div>
          <div 
            className="p-3 h-[calc(50vh-230px)] overflow-y-auto"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => handleDrop(e, 'REVIEW')}
          >
            {getTasksByStatus('REVIEW').length === 0 ? (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                <p>No tasks</p>
              </div>
            ) : (
              getTasksByStatus('REVIEW').map((task: any) => (
                <div key={task._id} className="task-card-wrapper">
                  <TaskCard task={task} onDragStart={handleDragStart} />
                </div>
              ))
            )}
          </div>
          
          <div className="px-4 py-3 border-b border-gray-200 bg-green-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <span className="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
              Completed
              <span className="ml-2 text-sm text-gray-500 font-normal">
                ({getTasksByStatus('COMPLETED').length})
              </span>
            </h3>
          </div>
          <div 
            className="p-3 h-[calc(50vh-230px)] overflow-y-auto"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => handleDrop(e, 'COMPLETED')}
          >
            {getTasksByStatus('COMPLETED').length === 0 ? (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                <p>No tasks</p>
              </div>
            ) : (
              getTasksByStatus('COMPLETED').map((task: any) => (
                <div key={task._id} className="task-card-wrapper">
                  <TaskCard task={task} onDragStart={handleDragStart} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 