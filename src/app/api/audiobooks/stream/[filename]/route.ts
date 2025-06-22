import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename } = params;
    
    // Security: Prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // Path to audiobook file
    const audioPath = path.join(process.cwd(), 'uploads', 'media', 'audiobooks', 'files', filename);
    
    if (!fs.existsSync(audioPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const stat = fs.statSync(audioPath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

    if (range) {
      // Handle range requests for seeking
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const stream = fs.createReadStream(audioPath, { start, end });

      const headers = new Headers({
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize.toString(),
        'Content-Type': getContentType(filename),
        'Cache-Control': 'public, max-age=31536000',
      });

      return new Response(stream as any, {
        status: 206,
        headers
      });
    } else {
      // Handle full file requests
      const stream = fs.createReadStream(audioPath);

      const headers = new Headers({
        'Content-Length': fileSize.toString(),
        'Content-Type': getContentType(filename),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
      });

      return new Response(stream as any, {
        status: 200,
        headers
      });
    }
  } catch (error) {
    console.error('Error streaming audio file:', error);
    return NextResponse.json({ error: 'Failed to stream audio' }, { status: 500 });
  }
}

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  
  switch (ext) {
    case '.mp3':
      return 'audio/mpeg';
    case '.m4a':
      return 'audio/mp4';
    case '.wav':
      return 'audio/wav';
    case '.ogg':
      return 'audio/ogg';
    case '.flac':
      return 'audio/flac';
    case '.aac':
      return 'audio/aac';
    default:
      return 'application/octet-stream';
  }
} 