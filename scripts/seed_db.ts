import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI environment variable is required');
  process.exit(1);
}

const videoSchema = new mongoose.Schema({
  url: String,
  label: String,
  description: String,
  source: String,
  filename: String,
  tiktok_url: String,
  uploaded_at: { type: Date, default: Date.now },
});

const Video = mongoose.model('Video', videoSchema, 'VideosDATA');

const SEED_VIDEOS = [
  {
    url: 'http://localhost:3001/videos/tiboinshape_first.mp4',
    label: 'ai',
    description: 'TikTok video from @tiboinshvpe',
    source: 'tiktok',
    filename: 'tiboinshape_first.mp4',
    tiktok_url: 'https://www.tiktok.com/@tiboinshvpe/video/7577882261924629782',
  },
  {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4',
    label: 'real',
    description:
      'Natural movement of flowers in the wind is chaotic and hard for AI to replicate perfectly.',
    source: 'mixkit',
  },
  {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-ink-swirling-in-water-286-large.mp4',
    label: 'ai',
    description:
      'AI generation often struggles with fluid dynamics, sometimes creating morphing shapes.',
    source: 'mixkit_simulated',
  },
  {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-man-runs-past-ground-level-shot-32809-large.mp4',
    label: 'real',
    description:
      'Complex interactions between feet and uneven ground, plus consistent shadow casting.',
    source: 'mixkit',
  },
  {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
    label: 'ai',
    description: 'Water textures in AI video often loop unnaturally or have shimmering artifacts.',
    source: 'mixkit_simulated',
  },
  {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-white-cat-lying-among-the-grasses-seen-up-close-22732-large.mp4',
    label: 'real',
    description:
      'Animal fur is a high-detail texture. Real video maintains hair consistency across frames.',
    source: 'mixkit',
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI!);
    console.log('Connected to MongoDB');

    const count = await Video.countDocuments();
    console.log(`Found ${count} existing videos`);

    if (count === 0) {
      await Video.insertMany(SEED_VIDEOS);
      console.log('Database seeded with', SEED_VIDEOS.length, 'videos');
    } else {
      console.log('Database already has videos. Delete them first to reseed.');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

seedDatabase();
