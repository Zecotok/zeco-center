import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/authConfig';
import { connectDB } from '@/libs/mongodb';
import Task from '@/models/Task';
import TaskComment from '@/models/TaskComment';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { TASK_MEDIA_DIR } from '@/constants/paths';


// POST /api/tasks/comments/media - Add media comment to task
export async function POST(req: NextRequest) {
  try {
    // Get authentication session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    
    const userId = session.user.id;
    
    // Parse the form data
    const formData = await req.formData();
    const taskId = formData.get('taskId') as string;
    const commentType = formData.get('commentType') as 'audio' | 'video' | 'screenshare';
    const mediaFile = formData.get('mediaFile') as File;
    
    // Validate required fields
    if (!taskId || !commentType || !mediaFile) {
      return NextResponse.json({ 
        error: 'TaskId, commentType, and mediaFile are required' 
      }, { status: 400 });
    }
    
    // Check if Task model is available (server-side)
    if (!Task) {
      return NextResponse.json({ error: 'Database model not available' }, { status: 500 });
    }
    
    // Check if TaskComment model is available (server-side)
    if (!TaskComment) {
      return NextResponse.json({ error: 'Comment model not available' }, { status: 500 });
    }
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), TASK_MEDIA_DIR);
    await mkdir(uploadsDir, { recursive: true });
    
    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `${commentType}-${userId}-${timestamp}-${mediaFile.name}`;
    const filepath = join(uploadsDir, filename);
    
    // Save the file
    const bytes = await mediaFile.arrayBuffer();
    await writeFile(filepath, new Uint8Array(bytes));
    
    // Create comment with media URL - use the API route instead of direct path
    const mediaUrl = `/api/uploads/${TASK_MEDIA_DIR.replace('uploads/', '')}/${filename}`;
    const comment = new TaskComment({
      task: taskId,
      author: userId,
      commentType,
      mediaUrl,
      content: `${commentType} comment` // Default text description
    });
    
    await comment.save();
    
    // Return comment with populated author
    const populatedComment = await TaskComment.findById(comment._id)
      .populate('author', 'fullname email');
    
    return NextResponse.json({ comment: populatedComment });
  } catch (error: any) {
    console.error('Error creating media comment:', error);
    return NextResponse.json({ error: `Failed to create media comment: ${error.message}` }, { status: 500 });
  }
}; 