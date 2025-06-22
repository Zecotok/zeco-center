import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/libs/mongodb';
import fs from 'fs';
import path from 'path';

// MongoDB collection for audiobook progress
async function getProgressCollection() {
  await connectDB();
  const { MongoClient } = require('mongodb');
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('zecocenter');
  return { collection: db.collection('audiobook_progress'), client };
}

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

    // Get all user progress at once for efficiency
    const userProgress = await getAllUserProgress(session.user.id);

    for (const metaFile of metaFiles) {
      try {
        const metaFilePath = path.join(metaPath, metaFile);
        const metadata = JSON.parse(fs.readFileSync(metaFilePath, 'utf8'));
        
        // Generate unique ID from filename
        const id = path.basename(metaFile, '.json');
        
        // Get progress for this book from the fetched progress map
        const progress = userProgress[id] || null;
        
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

// Enhanced function to get all user progress at once
async function getAllUserProgress(userId: string) {
  let client;
  
  try {
    const { collection, client: dbClient } = await getProgressCollection();
    client = dbClient;
    
    const progressRecords = await collection.find({ userId }).toArray();
    
    // Convert to a map for quick lookup
    const progressMap: { [bookId: string]: any } = {};
    
    progressRecords.forEach(progress => {
      progressMap[progress.bookId] = {
        current_time: progress.currentTime,
        completed: progress.completed,
        last_played: progress.lastPlayed.toISOString(),
        progress_percentage: progress.progressPercentage,
        updated_at: progress.updatedAt.toISOString()
      };
    });
    
    return progressMap;
    
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return {};
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Function to get user progress (legacy - kept for compatibility)
async function getUserProgress(userId: string, bookId: string) {
  let client;
  
  try {
    const { collection, client: dbClient } = await getProgressCollection();
    client = dbClient;
    
    const progress = await collection.findOne({
      userId,
      bookId
    });
    
    if (!progress) {
      return null;
    }
    
    return {
      current_time: progress.currentTime,
      completed: progress.completed,
      last_played: progress.lastPlayed.toISOString(),
      progress_percentage: progress.progressPercentage,
      updated_at: progress.updatedAt.toISOString()
    };
    
  } catch (error) {
    console.error('Error fetching progress:', error);
    return null;
  } finally {
    if (client) {
      await client.close();
    }
  }
} 