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