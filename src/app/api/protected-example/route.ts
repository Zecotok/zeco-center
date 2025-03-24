import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/libs/apiAuth';
import { PERMISSIONS } from '@/libs/rolesConfig';

export async function GET(req: NextRequest) {
  return withPermission(PERMISSIONS.ANALYTICS)(req, async (request) => {
    // This code will only run if the user has ANALYTICS permission
    return NextResponse.json({ 
      success: true, 
      message: 'You have access to analytics data' 
    });
  });
}

export async function POST(req: NextRequest) {
  return withPermission(PERMISSIONS.MEDITATION)(req, async (request) => {
    // This code will only run if the user has MEDITATION permission
    // Example of handling a meditation session creation
    try {
      const data = await request.json();
      
      // Process meditation data here
      
      return NextResponse.json({ 
        success: true, 
        message: 'Meditation session recorded' 
      });
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to process meditation data' 
      }, { status: 400 });
    }
  });
} 