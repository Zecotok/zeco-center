import { NextRequest, NextResponse } from 'next/server';
import { stat, readFile } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authConfig';

/**
 * GET handler to serve static files from the uploads directory
 * This handles media files uploaded for tasks and other content
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get the user session to check authentication
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Construct the file path from the path params
    const filePath = join(process.cwd(), 'uploads', ...params.path);
    
    // Check if the file exists
    try {
      await stat(filePath);
    } catch (error) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Read file content
    const fileBuffer = await readFile(filePath);
    
    // Determine content type based on file extension
    const fileName = params.path[params.path.length - 1];
    const fileExt = fileName.split('.').pop()?.toLowerCase();
    
    let contentType = 'application/octet-stream'; // Default content type
    
    if (fileExt === 'webm') {
      contentType = 'video/webm';
    } else if (fileExt === 'mp4') {
      contentType = 'video/mp4';
    } else if (fileExt === 'mp3') {
      contentType = 'audio/mpeg';
    } else if (fileExt === 'ogg') {
      contentType = 'audio/ogg';
    } else if (fileExt === 'wav') {
      contentType = 'audio/wav';
    } else if (fileExt === 'jpg' || fileExt === 'jpeg') {
      contentType = 'image/jpeg';
    } else if (fileExt === 'png') {
      contentType = 'image/png';
    }
    
    // Handle range requests for video/audio streaming
    const rangeHeader = request.headers.get('range');
    if (rangeHeader && (contentType.startsWith('video/') || contentType.startsWith('audio/'))) {
      const fileSize = fileBuffer.length;
      
      // Parse the range header
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      // Ensure valid ranges
      const chunkSize = end - start + 1;
      if (start >= fileSize || end >= fileSize) {
        return NextResponse.json(
          { error: 'Range Not Satisfiable' },
          { status: 416 }
        );
      }
      
      // Slice the file to the requested range
      const chunk = fileBuffer.slice(start, end + 1);
      
      // Return the chunk with appropriate headers
      const response = new NextResponse(chunk, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': contentType
        }
      });
      
      return response;
    }
    
    // Return the full file if no range is requested
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString()
      }
    });
    
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 