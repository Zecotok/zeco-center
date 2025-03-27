import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/authConfig';
import { connectDB } from '@/libs/mongodb';
import Task from '@/models/Task';
import TaskComment, { CommentType } from '@/models/TaskComment';
import { PERMISSIONS } from '@/libs/rolesConfig';
import { withPermission } from '@/libs/apiAuth';

// POST /api/tasks/comments - Add comment to task
export const POST = async (req: NextRequest) => {
  return withPermission(PERMISSIONS.TASKS)(req, async (request) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      await connectDB();
      
      const { content, taskId, commentType = CommentType.TEXT } = await request.json();
      
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
      const task = await Task.findById(taskId);
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      // Check if user is creator or assignee
      const userId = session.user.id;
      const isCreator = task.createdBy.toString() === userId;
      const isAssignee = task.assignedTo.some((id: any) => id.toString() === userId);
      
      if (!isCreator && !isAssignee && !session.user.isAdmin) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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
  });
};

// DELETE /api/tasks/comments - Delete a comment
export const DELETE = async (req: NextRequest) => {
  return withPermission(PERMISSIONS.TASKS)(req, async (request) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { commentId } = await request.json();
      
      if (!commentId) {
        return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
      }
      
      await connectDB();
      
      // Check if models are available
      if (!TaskComment) {
        return NextResponse.json({ error: 'Comment model not available' }, { status: 500 });
      }
      
      if (!Task) {
        return NextResponse.json({ error: 'Task model not available' }, { status: 500 });
      }
      
      // Find the comment
      const comment = await TaskComment.findById(commentId);
      
      if (!comment) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }
      
      // Check if the user is authorized to delete the comment
      // Only comment author, task creator, or admin can delete comments
      const userId = session.user.id;
      const isAuthor = comment.author.toString() === userId;
      const task = await Task.findById(comment.task);
      
      if (!task) {
        return NextResponse.json({ error: 'Associated task not found' }, { status: 404 });
      }
      
      const isTaskCreator = task.createdBy.toString() === userId;
      const isAdmin = session.user.isAdmin;
      
      if (!isAuthor && !isTaskCreator && !isAdmin) {
        return NextResponse.json({ error: 'Not authorized to delete this comment' }, { status: 403 });
      }
      
      // Delete associated media file if exists
      if (comment.mediaUrl) {
        try {
          const { unlink } = require('fs/promises');
          const { join } = require('path');
          
          // Extract filename from mediaUrl
          const urlPath = comment.mediaUrl.split('/');
          const filename = urlPath[urlPath.length - 1];
          
          // Form the file path
          const mediaDir = join(process.cwd(), 'uploads', 'task-media');
          const filePath = join(mediaDir, filename);
          
          // Check if file exists before deleting
          const { existsSync } = require('fs');
          if (existsSync(filePath)) {
            await unlink(filePath);
            console.log(`Deleted media file: ${filePath}`);
          }
        } catch (fileError) {
          console.error(`Error deleting media file: ${comment.mediaUrl}`, fileError);
          // Continue with comment deletion even if file deletion fails
        }
      }
      
      // Delete the comment
      await TaskComment.findByIdAndDelete(commentId);
      
      return NextResponse.json({ message: 'Comment deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      return NextResponse.json({ error: `Failed to delete comment: ${error.message}` }, { status: 500 });
    }
  });
}; 