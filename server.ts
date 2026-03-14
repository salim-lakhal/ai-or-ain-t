import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, setupGracefulShutdown } from './server/config/database.ts';
import {
  securityHeaders,
  validateRequestSize,
  apiLimiter,
  swipeLimiter,
} from './server/middleware/security.ts';
import { validateSwipeData } from './server/middleware/validation.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;
const NODE_ENV = process.env.NODE_ENV || 'development';
const SEED_SECRET = process.env.SEED_SECRET;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];

if (!MONGO_URI) {
  console.error('MONGO_URI environment variable is required');
  process.exit(1);
}

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(securityHeaders);

app.use(
  cors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);

app.use(express.json({ limit: '10kb' }));
app.use(validateRequestSize);

app.use(
  mongoSanitize({
    replaceWith: '_',
  }),
);

app.use('/api/', apiLimiter);

if (NODE_ENV === 'development') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Serve local videos
const publicVideosPath = path.join(__dirname, 'public', 'videos');
app.use(
  '/videos',
  express.static(publicVideosPath, {
    setHeaders: (res) => {
      res.set('Accept-Ranges', 'bytes');
      res.set('Content-Type', 'video/mp4');
      res.set('Cache-Control', 'public, max-age=86400');
    },
  }),
);

// Serve Kaggle videos if available
try {
  const pathFile = path.join(__dirname, '.kaggle_dataset_path');
  if (fs.existsSync(pathFile)) {
    const kaggleDatasetPath = fs.readFileSync(pathFile, 'utf-8').trim();
    app.use(
      '/kaggle-videos',
      express.static(kaggleDatasetPath, {
        setHeaders: (res) => {
          res.set('Accept-Ranges', 'bytes');
          res.set('Content-Type', 'video/mp4');
          res.set('Cache-Control', 'public, max-age=86400');
        },
      }),
    );
  }
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error('Could not load Kaggle dataset path:', message);
}

// Database
connectDB(MONGO_URI, NODE_ENV);
setupGracefulShutdown();

// Schemas
const userLabelSchema = new mongoose.Schema(
  {
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
    video_order_index: Number,
  },
  { timestamps: false },
);

const videoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, maxlength: 500 },
    label: { type: String, enum: ['real', 'ai'], required: true, lowercase: true },
    description: { type: String, maxlength: 1000 },
    source: { type: String, maxlength: 100 },
    uploaded_at: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

const UserLabel =
  mongoose.models.UserLabel || mongoose.model('UserLabel', userLabelSchema, 'UserData');
const Video = mongoose.models.Video || mongoose.model('Video', videoSchema, 'VideosDATA');

// Seed data
const SEED_VIDEOS = [
  {
    url: 'http://localhost:3001/videos/tiboinshape_first.mp4',
    label: 'ai',
    description: 'TikTok video from @tiboinshvpe',
    source: 'tiktok',
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

// API endpoints

app.get('/api/health', (_req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    db: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'AIorAINT Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      videos: '/api/videos',
      swipes: '/api/swipes',
      seed: '/api/seed',
    },
  });
});

app.post('/api/seed', async (req: Request, res: Response) => {
  if (NODE_ENV === 'production' && req.headers['x-seed-secret'] !== SEED_SECRET) {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return;
  }

  try {
    const count = await Video.countDocuments();
    if (count === 0) {
      await Video.insertMany(SEED_VIDEOS);
      res.json({ success: true, message: 'Database seeded', count: SEED_VIDEOS.length });
      return;
    }
    res.json({ success: true, message: 'Database already populated', count });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to seed database' });
  }
});

app.get('/api/videos', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    const filesystemVideos: Array<{
      id: string;
      url: string;
      label: string;
      description: string;
      source: string;
      priority: number;
    }> = [];

    const videosPath = path.join(__dirname, 'public', 'videos');

    const aiFolderPath = path.join(videosPath, 'AI');
    if (fs.existsSync(aiFolderPath)) {
      const aiFiles = fs.readdirSync(aiFolderPath).filter((f) => f.endsWith('.mp4'));
      aiFiles.forEach((filename, index) => {
        filesystemVideos.push({
          id: `fs-ai-${index}`,
          url: `${baseUrl}/videos/AI/${filename}`,
          label: 'ai',
          description:
            filename === 'tiboinshape_first.mp4'
              ? 'TikTok video from @tiboinshvpe - AI generated content'
              : 'AI-generated video from local filesystem',
          source: 'filesystem-ai',
          priority: filename === 'tiboinshape_first.mp4' ? 0 : 1,
        });
      });
    }

    const realFolderPath = path.join(videosPath, 'REAL');
    if (fs.existsSync(realFolderPath)) {
      const realFiles = fs.readdirSync(realFolderPath).filter((f) => f.endsWith('.mp4'));
      realFiles.forEach((filename, index) => {
        filesystemVideos.push({
          id: `fs-real-${index}`,
          url: `${baseUrl}/videos/REAL/${filename}`,
          label: 'real',
          description: 'Real video from local filesystem',
          source: 'filesystem-real',
          priority: 2,
        });
      });
    }

    filesystemVideos.sort((a, b) => a.priority - b.priority);

    let dbVideos: Array<{
      id: string;
      url: string;
      label: string;
      description: string;
      source: string;
    }> = [];
    const remainingLimit = Math.max(0, limit - filesystemVideos.length);

    if (remainingLimit > 0) {
      const dbResults = await Video.aggregate([{ $sample: { size: remainingLimit } }]);
      dbVideos = dbResults.map(
        (v: {
          _id: mongoose.Types.ObjectId;
          url: string;
          label: string;
          description?: string;
          source?: string;
        }) => {
          let videoUrl = v.url;
          if (videoUrl.startsWith('http://localhost:3001')) {
            videoUrl = videoUrl.replace('http://localhost:3001', baseUrl);
          }
          return {
            id: v._id.toString(),
            url: videoUrl,
            label: v.label.toLowerCase(),
            description: v.description || '',
            source: v.source || '',
          };
        },
      );
    }

    const allVideos = [
      ...filesystemVideos.map((v) => ({
        id: v.id,
        url: v.url,
        label: v.label,
        description: v.description,
        source: v.source,
      })),
      ...dbVideos,
    ].slice(0, limit);

    res.json(allVideos);
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch videos' });
  }
});

app.post('/api/swipes', swipeLimiter, validateSwipeData, async (req: Request, res: Response) => {
  try {
    const swipeData = req.sanitizedData;
    const newSwipe = new UserLabel(swipeData);
    await newSwipe.save();
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to save swipe' });
  }
});

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({ success: false, error: 'CORS policy violation' });
    return;
  }
  res.status(500).json({
    success: false,
    error: NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${NODE_ENV}]`);
});

export default app;
