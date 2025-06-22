import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    console.log('🎵 Audio stream request:', {
      filename: params.filename,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      range: request.headers.get('range'),
      origin: request.headers.get('origin')
    });

    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log('❌ Unauthorized request for:', params.filename);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename } = params;
    
    // Security: Prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      console.log('🚫 Invalid filename detected:', filename);
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // Path to audiobook file
    const audioPath = path.join(process.cwd(), 'uploads', 'media', 'audiobooks', 'files', filename);
    
    console.log('📁 Looking for file at:', audioPath);
    
    if (!fs.existsSync(audioPath)) {
      console.log('📂 File not found:', audioPath);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const stat = fs.statSync(audioPath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

    console.log('📊 File stats:', {
      size: fileSize,
      hasRange: !!range,
      range: range
    });

    // Common headers for all responses
    const commonHeaders = {
      'Content-Type': getContentType(filename),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600', // Reduced cache time for debugging
      'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Type',
      'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
    };

    if (range) {
      // Handle range requests for seeking
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      console.log('📦 Range request:', { start, end, chunksize });
      
      const stream = fs.createReadStream(audioPath, { start, end });

      const headers = new Headers({
        ...commonHeaders,
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunksize.toString(),
      });

      return new Response(stream as any, {
        status: 206,
        headers
      });
    } else {
      // Handle full file requests
      console.log('📄 Full file request');
      const stream = fs.createReadStream(audioPath);

      const headers = new Headers({
        ...commonHeaders,
        'Content-Length': fileSize.toString(),
      });

      return new Response(stream as any, {
        status: 200,
        headers
      });
    }
  } catch (error) {
    console.error('💥 Error streaming audio file:', error);
    return NextResponse.json({ error: 'Failed to stream audio' }, { status: 500 });
  }
}

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  
  switch (ext) {
    case '.mp3':
      return 'audio/mpeg; codecs="mp3"';
    case '.m4a':
      return 'audio/mp4; codecs="mp4a.40.2"';
    case '.wav':
      return 'audio/wav; codecs="1"';
    case '.ogg':
      return 'audio/ogg; codecs="vorbis"';
    case '.flac':
      return 'audio/flac';
    case '.aac':
      return 'audio/aac; codecs="mp4a.40.2"';
    default:
      return 'application/octet-stream';
  }
} 