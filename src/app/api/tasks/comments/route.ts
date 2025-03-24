import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/libs/mongodb';
import Task from '@/models/Task';
import TaskComment, { CommentType } from '@/models/TaskComment';

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

// POST /api/tasks/comments - Add comment to task
export async function POST(req: NextRequest) {
  try {
    // Get authentication session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    
    const userId = session.user.id;
    const { content, taskId, commentType = CommentType.TEXT } = await req.json();
    
    // Validate required fields
    if (!content || !taskId) {
      return NextResponse.json({ error: 'Content and task ID are required' }, { status: 400 });
    }
    
    // Validate comment type
    if (!Object.values(CommentType).includes(commentType as CommentType)) {
      return NextResponse.json({ error: 'Invalid comment type' }, { status: 400 });
    }
    
    // Check if Task model is available (server-side)
    if (!Task) {
      return NextResponse.json({ error: 'Database model not available' }, { status: 500 });
    }
    
    // Check if user has access to the task
    const hasAccess = await hasTaskAccess(taskId, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
    }
    
    // Check if TaskComment model is available (server-side)
    if (!TaskComment) {
      return NextResponse.json({ error: 'Comment model not available' }, { status: 500 });
    }
    
    // Create comment
    const comment = new TaskComment({
      task: taskId,
      author: userId,
      content,
      commentType
    });
    
    await comment.save();
    
    // Return comment with populated author
    const populatedComment = await TaskComment.findById(comment._id)
      .populate('author', 'fullname email');
    
    return NextResponse.json({ comment: populatedComment });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: `Failed to create comment: ${error.message}` }, { status: 500 });
  }
}; 