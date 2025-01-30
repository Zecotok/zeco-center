import mongoose from 'mongoose';

const MeditationSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  guideId: {
    type: String,
    required: true
  },
  programName: {
    type: String,
    required: true
  },
  guideName: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  sceneUsed: {
    type: String
  }
});

export default mongoose.models.MeditationSession || 
  mongoose.model('MeditationSession', MeditationSessionSchema); 