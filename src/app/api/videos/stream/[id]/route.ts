import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs-extra';
import path from 'path';
import Video from '@/models/Video';
import { dbConnect } from '@/libs/dbConnect';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { id } = params;
    const video = await Video.findOne({ id });
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    
    const filePath = path.join(process.cwd(), video.filePath);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Video file not found' }, { status: 404 });
    }
    
    const stat = await fs.stat(filePath);
    const fileSize = stat.size;
    const range = req.headers.get('range');
    
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      
      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize.toString(),
        'Content-Type': 'video/mp4',
      };
      
      return new NextResponse(file as any, {
        status: 206,
        headers,
      });
    } else {
      const headers = {
        'Content-Length': fileSize.toString(),
        'Content-Type': 'video/mp4',
      };
      
      const file = fs.createReadStream(filePath);
      return new NextResponse(file as any, {
        status: 200,
        headers,
      });
    }
  } catch (error) {
    console.error('Error streaming video:', error);
    return NextResponse.json({ error: 'Failed to stream video' }, { status: 500 });
  }
} 