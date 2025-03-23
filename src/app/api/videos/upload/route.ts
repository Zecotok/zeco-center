import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs-extra';
import path from 'path';

// Create the uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
fs.ensureDirSync(uploadDir);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the request is multipart/form-data
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content type must be multipart/form-data' }, { status: 400 });
    }

    // Generate a unique filename
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueId = uuidv4();
    const fileExtension = path.extname(file.name);
    const fileName = `${uniqueId}${fileExtension}`;
    const filePath = path.join('uploads', fileName);
    const fullPath = path.join(process.cwd(), filePath);

    // Save the file to the uploads directory
    await fs.writeFile(fullPath, buffer);

    return NextResponse.json({ 
      success: true, 
      fileName,
      filePath,
      fileSize: file.size
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 });
  }
}

// Configure the Next.js API route to accept large file uploads
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '50mb',
  },
}; 