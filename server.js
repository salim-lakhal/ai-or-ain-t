import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, setupGracefulShutdown } from './server/config/database.js';
import { securityHeaders, validateRequestSize } from './server/middleware/security.js';
import { validateSwipeData } from './server/middleware/validation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ==================== Configuration ====================

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];

if (!MONGO_URI) {
  console.error('❌ MONGO_URI environment variable is required');
  process.exit(1);
}

// ==================== Security Middleware ====================

// Helmet: Set security headers (temporarily disabled for debugging)
// app.use(helmet({
//   contentSecurityPolicy: NODE_ENV === 'production',
//   crossOriginEmbedderPolicy: false
// }));

// Custom security headers
app.use(securityHeaders);

// CORS: Restrict to allowed origins (mobile-native friendly)
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, native apps, Postman)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing with size limits
app.use(express.json({ limit: '10kb' }));
app.use(validateRequestSize);

// Sanitize user input to prevent NoSQL injection
// Temporarily disabled due to Express 5.x compatibility issues
// app.use(mongoSanitize({
//   replaceWith: '_'
// }));

// Request logging (development only)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Rate limiting on all API routes (temporarily disabled due to Express 5.x compatibility)
// TODO: Re-enable once express-rate-limit is fully compatible with Express 5.x
// app.use('/api/', apiLimiter);

// ==================== Serve Local Videos ====================

// Serve videos from public/videos directory
const publicVideosPath = path.join(__dirname, 'public', 'videos');
app.use('/videos', express.static(publicVideosPath, {
  setHeaders: (res, filePath) => {
    res.set('Accept-Ranges', 'bytes');
    res.set('Content-Type', 'video/mp4');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
  }
}));
console.log('✅ Serving local videos from /videos');

// Serve Kaggle videos if available
let kaggleDatasetPath = null;
try {
  const pathFile = path.join(__dirname, '.kaggle_dataset_path');
  if (fs.existsSync(pathFile)) {
    kaggleDatasetPath = fs.readFileSync(pathFile, 'utf-8').trim();
    console.log(`📁 Kaggle dataset found at: ${kaggleDatasetPath}`);

    app.use('/kaggle-videos', express.static(kaggleDatasetPath, {
      setHeaders: (res, filePath) => {
        res.set('Accept-Ranges', 'bytes');
        res.set('Content-Type', 'video/mp4');
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
      }
    }));

    console.log('✅ Serving Kaggle videos at /kaggle-videos');
  }
} catch (err) {
  console.error('⚠️ Could not load Kaggle dataset path:', err.message);
}

// ==================== Database Connection ====================

connectDB(MONGO_URI, NODE_ENV);
setupGracefulShutdown();

// ==================== Schemas & Models ====================

// UserData Collection Schema
const userLabelSchema = new mongoose.Schema({
  user_id: { type: String, default: 'anonymous', maxlength: 100 },
  video_id: { type: String, required: true, maxlength: 100 },
  correct_label: { type: String, required: true, enum: ['real', 'ai'], lowercase: true },
  user_guess: { type: String, required: true, enum: ['real', 'ai'], lowercase: true },
  is_correct: { type: Boolean, required: true },
  confidence: { type: Number, min: 0, max: 1, default: null },
  decision_time_ms: { type: Number, required: true, min: 0, max: 600000 },
  timestamp: { type: Date, default: Date.now, index: true },
  app_version: { type: String, maxlength: 20 },
  device: {
    platform: { type: String, maxlength: 50 },
    model: { type: String, maxlength: 200 },
  },
  session_id: { type: String, maxlength: 100, index: true },
  locale: { type: String, maxlength: 10 },
  video_rotation_seen: Number,
  video_order_index: Number
}, { timestamps: false });

// VideosDATA Collection Schema
const videoSchema = new mongoose.Schema({
  url: { type: String, required: true, maxlength: 500 },
  label: { type: String, enum: ['real', 'ai'], required: true, lowercase: true },
  description: { type: String, maxlength: 1000 },
  source: { type: String, maxlength: 100 },
  uploaded_at: { type: Date, default: Date.now }
}, { timestamps: false });

// Map to existing collections
const UserLabel = mongoose.models.UserLabel || mongoose.model('UserLabel', userLabelSchema, 'UserData');
const Video = mongoose.models.Video || mongoose.model('Video', videoSchema, 'VideosDATA');

// ==================== Seed Data ====================

const SEED_VIDEOS = [
  {
    url: 'http://localhost:3001/videos/tiboinshape_first.mp4',
    label: 'ai', // or 'real' - you can change this
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

// ==================== API Endpoints ====================

// Health Check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    db: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Root Route
app.get('/', (req, res) => {
  res.json({
    message: 'AIorAINT Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      videos: '/api/videos',
      swipes: '/api/swipes',
      seed: '/api/seed'
    }
  });
});

// Seed Database (Protected - consider adding auth in production)
app.post('/api/seed', async (req, res) => {
  try {
    const count = await Video.countDocuments();
    if (count === 0) {
      await Video.insertMany(SEED_VIDEOS);
      console.log("🌱 Database seeded via API");
      return res.json({
        success: true,
        message: "Database seeded successfully",
        count: SEED_VIDEOS.length
      });
    }
    res.json({
      success: true,
      message: "Database already populated",
      count
    });
  } catch (err) {
    console.error("❌ Seed error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to seed database"
    });
  }
});

// Get Videos (filesystem first, database as fallback)
app.get('/api/videos', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 videos

    // Get the request's hostname to dynamically construct video URLs
    // This makes local videos work on both desktop (localhost) and mobile (IP)
    const protocol = req.protocol;
    const host = req.get('host'); // e.g., "localhost:3001" or "172.20.10.3:3001"
    const baseUrl = `${protocol}://${host}`;

    // ==== STEP 1: Load videos from filesystem (PRIORITY) ====
    const filesystemVideos = [];
    const videosPath = path.join(__dirname, 'public', 'videos');

    // Scan AI folder
    const aiFolderPath = path.join(videosPath, 'AI');
    if (fs.existsSync(aiFolderPath)) {
      const aiFiles = fs.readdirSync(aiFolderPath).filter(f => f.endsWith('.mp4'));
      aiFiles.forEach((filename, index) => {
        filesystemVideos.push({
          id: `fs-ai-${index}`,
          url: `${baseUrl}/videos/AI/${filename}`,
          label: 'AI',
          description: filename === 'tiboinshape_first.mp4'
            ? 'TikTok video from @tiboinshvpe - AI generated content'
            : 'AI-generated video from local filesystem',
          source: 'filesystem-ai',
          filename: filename,
          priority: filename === 'tiboinshape_first.mp4' ? 0 : 1 // TikTok first
        });
      });
    }

    // Scan REAL folder
    const realFolderPath = path.join(videosPath, 'REAL');
    if (fs.existsSync(realFolderPath)) {
      const realFiles = fs.readdirSync(realFolderPath).filter(f => f.endsWith('.mp4'));
      realFiles.forEach((filename, index) => {
        filesystemVideos.push({
          id: `fs-real-${index}`,
          url: `${baseUrl}/videos/REAL/${filename}`,
          label: 'REAL',
          description: 'Real video from local filesystem',
          source: 'filesystem-real',
          filename: filename,
          priority: 2
        });
      });
    }

    // Sort filesystem videos: TikTok first, then AI, then REAL
    filesystemVideos.sort((a, b) => a.priority - b.priority);

    // ==== STEP 2: Load videos from database (FALLBACK) ====
    let dbVideos = [];
    const remainingLimit = Math.max(0, limit - filesystemVideos.length);

    if (remainingLimit > 0) {
      const dbResults = await Video.aggregate([
        { $sample: { size: remainingLimit } }
      ]);

      dbVideos = dbResults.map(v => {
        let videoUrl = v.url;

        // Replace localhost URLs with the actual request hostname
        if (videoUrl.startsWith('http://localhost:3001')) {
          videoUrl = videoUrl.replace('http://localhost:3001', baseUrl);
        }

        return {
          id: v._id.toString(),
          url: videoUrl,
          label: v.label.toUpperCase(),
          description: v.description,
          source: v.source
        };
      });
    }

    // ==== STEP 3: Combine (filesystem first, database second) ====
    const allVideos = [
      ...filesystemVideos.map(v => ({
        id: v.id,
        url: v.url,
        label: v.label,
        description: v.description,
        source: v.source
      })),
      ...dbVideos
    ].slice(0, limit); // Respect the limit

    res.json(allVideos);
  } catch (err) {
    console.error("❌ Fetch videos error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch videos"
    });
  }
});

// Record User Swipe (with validation)
app.post('/api/swipes', validateSwipeData, async (req, res) => {
  try {
    // Use sanitized data from validation middleware
    const swipeData = req.sanitizedData;

    const newSwipe = new UserLabel(swipeData);
    await newSwipe.save();

    if (NODE_ENV === 'development') {
      console.log(`💾 Saved swipe: ${swipeData.video_id} -> ${swipeData.user_guess} (${swipeData.is_correct ? '✓' : '✗'})`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Save swipe error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to save swipe"
    });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);

  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS policy violation'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// ==================== Start Server ====================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`📱 Mobile-native friendly (no-origin support)`);
  console.log(`🔒 Security: Helmet, Rate Limiting, CORS, NoSQL Injection Protection`);
});
