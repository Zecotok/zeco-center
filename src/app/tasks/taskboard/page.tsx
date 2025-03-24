"use client";

import { useState, useEffect } from 'react';
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
  faSort
} from '@fortawesome/free-solid-svg-icons';

// Task status indicator component
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
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${getStatusColor(status)}`}>
      {status.replace('_', ' ')}
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
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${getPriorityColor(priority)}`}>
      {priority}
    </span>
  );
};

export default function TaskBoard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchTaskData();
    }
  }, [status, router]);

  useEffect(() => {
    if (tasks.length > 0) {
      applyFilters();
    }
  }, [tasks, filter]);

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
    
    // Apply sorting
    result.sort((a: any, b: any) => {
      if (filter.sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (filter.sortBy === 'priority') {
        const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return priorityOrder[a.priority as keyof typeof priorityOrder] - 
               priorityOrder[b.priority as keyof typeof priorityOrder];
      } else {
        return 0;
      }
    });
    
    setFilteredTasks(result);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No due date';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faFilter} className="text-gray-500 mr-2" />
            <span className="text-gray-700 font-medium">Filters:</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={filter.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={filter.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <option value="">All Priorities</option>
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
      
      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Your Tasks</h3>
        </div>
        
        {filteredTasks.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No tasks match your filters.</p>
            {filter.status || filter.priority ? (
              <button 
                onClick={() => setFilter({ status: '', priority: '', sortBy: 'dueDate' })}
                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150"
              >
                Clear Filters
              </button>
            ) : (
              <Link href="/tasks/new">
                <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition ease-in-out duration-150">
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  Create Task
                </button>
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredTasks.map((task: any) => (
              <li key={task._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <Link href={`/tasks/${task._id}`} className="block">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-600 truncate">{task.title}</p>
                    <div className="flex space-x-2">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {task.description && task.description.length > 100
                          ? task.description.substring(0, 100) + '...'
                          : task.description || 'No description'}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <FontAwesomeIcon icon={faCalendarAlt} className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      <p>
                        {task.dueDate ? (
                          <span className={isOverdue(task.dueDate) ? 'text-red-500 font-medium' : ''}>
                            Due {formatDate(task.dueDate)}
                          </span>
                        ) : (
                          'No due date'
                        )}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 