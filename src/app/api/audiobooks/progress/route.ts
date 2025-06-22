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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookId, currentTime } = await request.json();

    if (!bookId || currentTime === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate currentTime is a number
    if (typeof currentTime !== 'number' || currentTime < 0) {
      return NextResponse.json({ error: 'Invalid currentTime value' }, { status: 400 });
    }

    // Save progress to database
    await saveUserProgress(session.user.id, bookId, currentTime);

    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      currentTime 
    });
  } catch (error) {
    console.error('Error saving progress:', error);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');

    if (!bookId) {
      return NextResponse.json({ error: 'Missing bookId' }, { status: 400 });
    }

    const progress = await getUserProgress(session.user.id, bookId);
    return NextResponse.json(progress || { current_time: 0, completed: false });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

// Enhanced function to save user progress with MongoDB
async function saveUserProgress(userId: string, bookId: string, currentTime: number) {
  let client;
  
  try {
    const { collection, client: dbClient } = await getProgressCollection();
    client = dbClient;
    
    // Get book metadata to check if completed and validate duration
    const metaPath = path.join(process.cwd(), 'uploads', 'media', 'audiobooks', 'meta', `${bookId}.json`);
    
    if (!fs.existsSync(metaPath)) {
      throw new Error(`Metadata file not found for book: ${bookId}`);
    }
    
    const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    const completed = currentTime >= (metadata.duration_seconds * 0.95); // 95% completion
    
    // Validate currentTime doesn't exceed book duration
    if (currentTime > metadata.duration_seconds) {
      currentTime = metadata.duration_seconds;
    }
    
    const progressData = {
      userId,
      bookId,
      currentTime,
      completed,
      lastPlayed: new Date(),
      updatedAt: new Date(),
      bookTitle: metadata.title,
      bookAuthor: metadata.author,
      totalDuration: metadata.duration_seconds,
      progressPercentage: Math.round((currentTime / metadata.duration_seconds) * 100)
    };

    await collection.updateOne(
      { userId, bookId },
      {
        $set: progressData,
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );

    console.log(`Progress saved: User ${userId}, Book ${bookId}, Time ${currentTime}s (${progressData.progressPercentage}%)`);
    
  } catch (error) {
    console.error('Error saving progress to database:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Enhanced function to get user progress with MongoDB
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
    console.error('Error fetching progress from database:', error);
    return null;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// New endpoint to get all progress for a user (for dashboard/stats)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let client;
    
    try {
      const { collection, client: dbClient } = await getProgressCollection();
      client = dbClient;
      
      const allProgress = await collection.find({ userId: session.user.id })
        .sort({ lastPlayed: -1 })
        .toArray();
      
      return NextResponse.json(allProgress);
      
    } finally {
      if (client) {
        await client.close();
      }
    }
    
  } catch (error) {
    console.error('Error fetching all progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
} 