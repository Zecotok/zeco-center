import { dbConnect } from '@/libs/dbConnect';
import { connectDB } from '@/libs/mongodb';
import TaskComment from '@/models/TaskComment';
import Video from '@/models/Video';
import { TASK_MEDIA_DIR } from '@/constants/paths';

/**
 * Script to update media URLs from direct paths to API routes
 * 
 * Run this script with:
 * npx ts-node -r tsconfig-paths/register src/scripts/fix-media-urls.ts
 */
async function fixMediaUrls() {
  console.log('Starting media URL update...');
  
  try {
    // Connect to the database
    await dbConnect();
    await connectDB();
    
    // Fix TaskComment mediaUrls
    if (TaskComment) {
      const taskComments = await TaskComment.find({ 
        mediaUrl: { $regex: '^/uploads/' } 
      });
      
      console.log(`Found ${taskComments.length} task comments with old media URLs`);
      
      for (const comment of taskComments) {
        const oldUrl = comment.mediaUrl;
        if (!oldUrl) continue;
        
        // Format: /uploads/task-media/filename.webm -> /api/uploads/task-media/filename.webm
        const relativePath = oldUrl.replace(/^\/uploads\//, '');
        const newUrl = `/api/uploads/${relativePath}`;
        
        comment.mediaUrl = newUrl;
        await comment.save();
        console.log(`Updated task comment ${comment._id}: ${oldUrl} -> ${newUrl}`);
      }
    } else {
      console.log('TaskComment model not available, skipping task comment updates');
    }
    
    // Fix Video filePaths
    if (Video) {
      const videos = await Video.find({
        filePath: { $regex: '^uploads/' }
      });
      
      console.log(`Found ${videos.length} videos with old file paths`);
      
      for (const video of videos) {
        const oldPath = video.filePath;
        if (!oldPath) continue;
        
        // Format: uploads/filename.webm -> /api/uploads/filename.webm
        const fileName = oldPath.replace(/^uploads\//, '');
        const newPath = `/api/uploads/${fileName}`;
        
        video.filePath = newPath;
        await video.save();
        console.log(`Updated video ${video.id}: ${oldPath} -> ${newPath}`);
      }
    } else {
      console.log('Video model not available, skipping video updates');
    }
    
    console.log('Media URL update completed successfully!');
  } catch (error) {
    console.error('Error updating media URLs:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
fixMediaUrls(); 