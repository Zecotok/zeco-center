import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs-extra';
import path from 'path';
import Video from '@/models/Video';
import { dbConnect } from '@/libs/dbConnect';

// GET endpoint to retrieve all videos
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get('search') || '';
    
    let query = {};
    if (searchQuery) {
      query = {
        $or: [
          { title: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } }
        ]
      };
    }
    
    const videos = await Video.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ videos }, { status: 200 });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}

// POST endpoint to save video metadata
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await req.json();
    const { title, description, fileName, filePath, fileSize, duration, quality } = data;
    
    if (!title || !fileName || !filePath || !fileSize || !duration || !quality) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const newVideo = new Video({
      id: uuidv4(),
      title,
      description,
      fileName,
      filePath,
      fileSize,
      duration,
      quality
    });
    
    await newVideo.save();
    return NextResponse.json({ success: true, video: newVideo }, { status: 201 });
  } catch (error) {
    console.error('Error saving video metadata:', error);
    return NextResponse.json({ error: 'Failed to save video metadata' }, { status: 500 });
  }
} 