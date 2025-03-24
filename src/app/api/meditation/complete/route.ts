import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import MeditationSession from '@/models/MeditationSession';
import { connectDB } from "@/libs/mongodb";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await req.json();

    const meditationSession = new MeditationSession({
      userId: session.user.id,
      guideId: data.guideId,
      programName: data.programName,
      guideName: data.guideName,
      duration: data.duration,
      sceneUsed: data.sceneUsed
    });

    await meditationSession.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording meditation session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    const query: any = {};
    if (startDate && endDate) {
      query.completedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (userId) {
      const mongoose = require('mongoose');
      query.userId = new mongoose.Types.ObjectId(userId);
    }

    const stats = await MeditationSession.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
            programName: "$programName"
          },
          totalDuration: { $sum: "$duration" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching meditation stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 