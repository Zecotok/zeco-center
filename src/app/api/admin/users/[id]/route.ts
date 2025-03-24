import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/libs/mongodb';
import User from '@/models/user';
import { withPermission } from '@/libs/apiAuth';
import { PERMISSIONS } from '@/libs/rolesConfig';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermission(PERMISSIONS.ANALYTICS)(request, async (req) => {
    try {
      const { role } = await req.json();
      
      // Validate role
      if (!['ADMIN', 'USER', 'TEAM_MEMBER'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      
      await connectDB();
      
      const updatedUser = await User.findByIdAndUpdate(
        params.id,
        { 
          role,
          // Update isAdmin field to maintain backward compatibility
          isAdmin: role === 'ADMIN' 
        },
        { new: true }
      );
      
      if (!updatedUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      return NextResponse.json({
        id: updatedUser._id,
        email: updatedUser.email,
        fullname: updatedUser.fullname,
        role: updatedUser.role,
        isAdmin: updatedUser.isAdmin
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  });
} 