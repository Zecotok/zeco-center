import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/authConfig';
import fs from 'fs-extra';
import path from 'path';
import Video from '@/models/Video';
import { dbConnect } from '@/libs/dbConnect';

// GET endpoint to retrieve a specific video
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { id } = params;
    const video = await Video.findOne({ id });
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    
    return NextResponse.json({ video }, { status: 200 });
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 });
  }
}

// DELETE endpoint to delete a video
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    const video = await Video.findOne({ id });
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    
    // Check if the user owns this video
    if (video.userId && video.userId.toString() !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: 'You are not authorized to delete this video' }, { status: 403 });
    }
    
    // Delete the video file from the uploads folder
    const filePath = path.join(process.cwd(), video.filePath);
    if (fs.existsSync(filePath)) {
      await fs.unlink(filePath);
    }
    
    // Delete the video metadata from the database
    await Video.deleteOne({ id });
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
  }
}

// PATCH endpoint to update video details
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    const data = await req.json();
    const { title, description } = data;
    
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    // Get the video to check ownership
    const video = await Video.findOne({ id });
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    
    // Check if the user owns this video
    if (video.userId && video.userId.toString() !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: 'You are not authorized to update this video' }, { status: 403 });
    }
    
    const updatedVideo = await Video.findOneAndUpdate(
      { id },
      { title, description, updatedAt: new Date() },
      { new: true }
    );
    
    return NextResponse.json({ success: true, video: updatedVideo }, { status: 200 });
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
  }
} 