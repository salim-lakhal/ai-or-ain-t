import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const videoSchema = new mongoose.Schema({
  url: String,
  label: String,
  description: String,
  source: String,
  filename: String,
  tiktok_url: String,
  uploaded_at: { type: Date, default: Date.now }
});

const Video = mongoose.model('Video', videoSchema, 'VideosDATA');

const SEED_VIDEOS = [
  {
    url: 'http://localhost:3001/videos/tiboinshape_first.mp4',
    label: 'ai',
    description: "TikTok video from @tiboinshvpe. Download using: bash scripts/download_tiktok.sh",
    source: "tiktok",
    filename: "tiboinshape_first.mp4",
    tiktok_url: "https://www.tiktok.com/@tiboinshvpe/video/7577882261924629782"
  },
  {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4',
    label: 'real',
    description: "Natural movement of flowers in the wind is chaotic and hard for AI to replicate perfectly. Real footage captures the organic randomness of nature with consistent lighting and physics.",
    source: "mixkit"
  },
  {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-ink-swirling-in-water-286-large.mp4',
    label: 'ai',
    description: "AI generation often struggles with fluid dynamics, sometimes creating morphing shapes. Watch for unnatural patterns or temporal inconsistencies in how the ink disperses.",
    source: "mixkit_simulated"
  },
  {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-man-runs-past-ground-level-shot-32809-large.mp4',
    label: 'real',
    description: "Complex interactions between feet and uneven ground, plus consistent shadow casting. Real footage shows proper physics with natural weight distribution and realistic shadows.",
    source: "mixkit"
  },
  {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
    label: 'ai',
    description: "Water textures in AI video often loop unnaturally or have 'shimmering' artifacts. Look for repeating patterns or inconsistent wave physics that don't match real ocean behavior.",
    source: "mixkit_simulated"
  },
  {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-white-cat-lying-among-the-grasses-seen-up-close-22732-large.mp4',
    label: 'real',
    description: "Animal fur is a high-detail texture. Real video maintains hair consistency across frames with proper lighting reflection and natural movement patterns.",
    source: "mixkit"
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const count = await Video.countDocuments();
    console.log(`📊 Found ${count} existing videos`);

    if (count === 0) {
      await Video.insertMany(SEED_VIDEOS);
      console.log('🌱 Database seeded with', SEED_VIDEOS.length, 'videos');
    } else {
      console.log('⚠️ Database already has videos. Delete them first if you want to reseed.');
    }

    await mongoose.connection.close();
    console.log('✅ Done!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

seedDatabase();
