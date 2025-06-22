import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Path to audiobooks metadata
    const metaPath = path.join(process.cwd(), 'uploads', 'media', 'audiobooks', 'meta');
    
    if (!fs.existsSync(metaPath)) {
      return NextResponse.json([]);
    }

    const metaFiles = fs.readdirSync(metaPath).filter(file => file.endsWith('.json'));
    const audiobooks = [];

    for (const metaFile of metaFiles) {
      try {
        const metaFilePath = path.join(metaPath, metaFile);
        const metadata = JSON.parse(fs.readFileSync(metaFilePath, 'utf8'));
        
        // Generate unique ID from filename
        const id = path.basename(metaFile, '.json');
        
        // Get user progress from database (you'll need to implement this)
        const progress = await getUserProgress(session.user.id, id);
        
        audiobooks.push({
          id,
          ...metadata,
          progress
        });
      } catch (error) {
        console.error(`Error processing metadata file ${metaFile}:`, error);
      }
    }

    // Sort by recently played or alphabetically
    audiobooks.sort((a, b) => {
      if (a.progress?.last_played && b.progress?.last_played) {
        return new Date(b.progress.last_played).getTime() - new Date(a.progress.last_played).getTime();
      }
      if (a.progress?.last_played) return -1;
      if (b.progress?.last_played) return 1;
      return a.title.localeCompare(b.title);
    });

    return NextResponse.json(audiobooks);
  } catch (error) {
    console.error('Error fetching audiobooks:', error);
    return NextResponse.json({ error: 'Failed to fetch audiobooks' }, { status: 500 });
  }
}

// Function to get user progress (implement based on your database)
async function getUserProgress(userId: string, bookId: string) {
  // This is a placeholder - implement with your actual database
  // For now, return null to indicate no progress
  return null;
  
  // Example implementation with MongoDB:
  /*
  try {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db('zecocenter');
    const progress = await db.collection('audiobook_progress').findOne({
      userId,
      bookId
    });
    
    await client.close();
    
    return progress ? {
      current_time: progress.currentTime,
      completed: progress.completed,
      last_played: progress.lastPlayed.toISOString()
    } : null;
  } catch (error) {
    console.error('Error fetching progress:', error);
    return null;
  }
  */
} 