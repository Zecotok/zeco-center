import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/authConfig';
import { connectDB } from '@/libs/mongodb';
import Task from '@/models/Task';
import { TaskPriority, TaskStatus } from '@/models/Task';

// GET /api/tasks - Get all tasks for current user
export const GET = async (req: NextRequest) => {
  try {
    // Get authentication session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();

    const userId = session.user.id;
    const searchParams = new URL(req.url).searchParams;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const limit = searchParams.get('limit');
    const sort = searchParams.get('sort');
    
    // Build query based on parameters
    const query: any = {
      $or: [
        { assignedTo: { $in: [userId] } },
        { createdBy: userId }
      ]
    };
    
    // Apply status filter if provided
    if (status) {
      query.status = status;
    }
    
    // Apply priority filter if provided
    if (priority) {
      query.priority = priority;
    }
    
    // Build sort options
    let sortOptions: any = { dueDate: 1 };
    if (sort) {
      const [field, direction] = sort.split(':');
      sortOptions = { [field]: direction === 'desc' ? -1 : 1 };
    }
    
    // Check if Task model is available (server-side)
    if (!Task) {
      return NextResponse.json({ error: 'Database model not available' }, { status: 500 });
    }
    
    // Build the query with limits if provided
    let taskQuery = Task.find(query)
      .populate('assignedTo', 'fullname email')
      .populate('createdBy', 'fullname email')
      .sort(sortOptions);
    
    if (limit) {
      taskQuery = taskQuery.limit(parseInt(limit));
    }
    
    // Get tasks with populated fields
    const tasks = await taskQuery;
    
    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: `Failed to fetch tasks: ${error.message}` }, { status: 500 });
  }
};

// POST /api/tasks - Create a new task
export const POST = async (req: NextRequest) => {
  try {
    // Get authentication session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();

    const body = await req.json();
    const userId = session.user.id;
    
    // Validate required fields - only title is required now
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    // Check if Task model is available (server-side)
    if (!Task) {
      return NextResponse.json({ error: 'Database model not available' }, { status: 500 });
    }
    
    // Create new task
    const newTask = await Task.create({
      title: body.title,
      description: body.description || '',
      assignedTo: body.assignedTo || [], // Assignee is now optional
      createdBy: userId,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined, // Due date is now optional
      priority: body.priority || TaskPriority.MEDIUM,
      status: body.status || TaskStatus.NOT_GROOMED, // Default to NOT_GROOMED
      attachments: body.attachments || [],
      videoIds: body.videoIds || []
    });
    
    // Return the new task with populated fields
    const populatedTask = await Task.findById(newTask._id)
      .populate('assignedTo', 'fullname email')
      .populate('createdBy', 'fullname email');
      
    return NextResponse.json({ task: populatedTask }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: `Failed to create task: ${error.message}` }, { status: 500 });
  }
}; 