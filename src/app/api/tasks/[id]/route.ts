import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/authConfig';
import { connectDB } from '@/libs/mongodb';
import Task from '@/models/Task';
import TaskComment from '@/models/TaskComment';
import { TaskStatus } from '@/models/Task';

// Helper function to check if a user has access to a task
async function hasTaskAccess(taskId: string, userId: string) {
  if (!Task) return false;
  
  // Check if task exists and user has access
  const task = await Task.findById(taskId);
  
  if (!task) {
    return false;
  }
  
  // User has access if they created the task or are assigned to it
  return task.createdBy.toString() === userId || 
         task.assignedTo.some((id: any) => id.toString() === userId);
}

// GET /api/tasks/[id] - Get task by id with comments
export const GET = async (req: NextRequest, context: { params: { id: string } }) => {
  try {
    // Get authentication session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    
    const taskId = context.params.id;
    const userId = session.user.id;
    
    // Check if Task model is available (server-side)
    if (!Task) {
      return NextResponse.json({ error: 'Database model not available' }, { status: 500 });
    }
    
    // Check if task exists and user has access
    const hasAccess = await hasTaskAccess(taskId, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
    }
    
    // Get task with populated fields
    const task = await Task.findById(taskId)
      .populate('assignedTo', 'fullname email')
      .populate('createdBy', 'fullname email');
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Get comments for the task if TaskComment model is available
    let comments: any[] = [];
    
    if (TaskComment) {
      comments = await TaskComment.find({ task: taskId })
        .populate('author', 'fullname email')
        .sort({ createdAt: 1 });
    }
    
    // Convert task to object and add fields
    const taskObj = task.toObject();
    
    return NextResponse.json({ 
      task: {
        ...taskObj,
        comments
      }
    });
  } catch (error: any) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: `Failed to fetch task: ${error.message}` }, { status: 500 });
  }
};

// PUT /api/tasks/[id] - Update task
export const PUT = async (req: NextRequest, context: { params: { id: string } }) => {
  try {
    // Get authentication session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    
    const taskId = context.params.id;
    const userId = session.user.id;
    const body = await req.json();
    
    // Check if Task model is available (server-side)
    if (!Task) {
      return NextResponse.json({ error: 'Database model not available' }, { status: 500 });
    }
    
    // Check if task exists and user has access
    const hasAccess = await hasTaskAccess(taskId, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
    }
    
    // Find the task
    const task = await Task.findById(taskId);
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Check if task is being marked as completed
    const isCompletionStatusChange = body.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED;
    
    // Update task
    const updateData: any = {
      title: body.title,
      description: body.description,
      assignedTo: body.assignedTo,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      priority: body.priority,
      status: body.status
    };
    
    // Add completedAt if task is being marked as completed
    if (isCompletionStatusChange) {
      updateData.completedAt = new Date();
    } else if (body.status !== TaskStatus.COMPLETED) {
      // Clear completedAt if task is being marked as not completed
      updateData.completedAt = null;
    }
    
    // Update attachments if provided
    if (body.attachments) {
      updateData.attachments = body.attachments;
    }
    
    // Update videoIds if provided
    if (body.videoIds) {
      updateData.videoIds = body.videoIds;
    }
    
    // Remove any undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
    
    // Update task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true }
    )
      .populate('assignedTo', 'fullname email')
      .populate('createdBy', 'fullname email');
    
    return NextResponse.json({ task: updatedTask });
  } catch (error: any) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: `Failed to update task: ${error.message}` }, { status: 500 });
  }
};

// DELETE /api/tasks/[id] - Delete task
export const DELETE = async (req: NextRequest, context: { params: { id: string } }) => {
  try {
    // Get authentication session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    
    const taskId = context.params.id;
    const userId = session.user.id;
    
    // Check if Task model is available (server-side)
    if (!Task) {
      return NextResponse.json({ error: 'Database model not available' }, { status: 500 });
    }
    
    // Find task
    const task = await Task.findById(taskId);
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Only task creator can delete task
    if (task.createdBy.toString() !== userId) {
      return NextResponse.json({ error: 'You do not have permission to delete this task' }, { status: 403 });
    }
    
    // First get all comments for the task to find media files
    if (TaskComment) {
      const comments = await TaskComment.find({ task: taskId });
      
      // Delete media files associated with comments
      if (comments.length > 0) {
        const fs = require('fs');
        const { unlink } = require('fs/promises');
        const { join } = require('path');
        
        for (const comment of comments) {
          if (comment.mediaUrl) {
            try {
              // Convert relative URL to absolute file path
              // mediaUrl is something like "/uploads/task-media/filename.webm"
              const relativePath = comment.mediaUrl.replace(/^\//, ''); // Remove leading slash
              const filePath = join(process.cwd(), relativePath);
              
              // Check if file exists before attempting to delete
              if (fs.existsSync(filePath)) {
                await unlink(filePath);
                console.log(`Deleted media file: ${filePath}`);
              }
            } catch (fileError) {
              console.error(`Error deleting media file: ${comment.mediaUrl}`, fileError);
              // Continue with deletion even if file deletion fails
            }
          }
        }
      }
      
      // Now delete all comments
      await TaskComment.deleteMany({ task: taskId });
    }
    
    // Finally delete the task
    await Task.findByIdAndDelete(taskId);
    
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: `Failed to delete task: ${error.message}` }, { status: 500 });
  }
}; 