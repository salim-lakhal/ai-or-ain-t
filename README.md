# AI or Ain't - Video Classification Game

Test your ability to distinguish real videos from AI-generated content!

## Features

- 📱 **Mobile-Native Friendly**: CORS configured to support mobile apps with no-origin requests
- 🎮 **Swipe-based Interface**: Intuitive swipe left (AI) or right (REAL) to classify videos
- 💾 **MongoDB Integration**: Persistent storage for user data and video collections
- 📊 **Real-time Feedback**: Educational descriptions pulled directly from database
- 🏆 **Score Tracking**: Track your accuracy, streaks, and performance
- 🔒 **Enterprise Security**:
  - Helmet security headers
  - Rate limiting (100 requests/15min, 30 swipes/min)
  - NoSQL injection protection
  - Input validation and sanitization
  - CORS protection with whitelisted origins
  - Request size limits (10KB max)

## Run Locally

**Prerequisites:** Node.js 18+

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**

   Copy `.env.example` to `.env` and update with your MongoDB connection string:
   ```bash
   cp .env.example .env
   ```

   Edit `.env`:
   ```env
   MONGO_URI=your_mongodb_connection_string
   PORT=3001
   NODE_ENV=development
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

3. **Start the backend server:**
   ```bash
   node server.js
   ```

   You should see:
   ```
   🚀 Server running on port 3001
   🌍 Environment: development
   📱 Mobile-native friendly (no-origin support)
   🔒 Security: Helmet, Rate Limiting, CORS, NoSQL Injection Protection
   ✅ MongoDB Connected to AIorAINT
   ```

4. **Start the frontend (in another terminal):**
   ```bash
   npm run dev
   ```

5. **Open your browser:** `http://localhost:5173`

6. **Seed the database (first time only):**
   - The app will automatically seed the database when you first load it
   - Or manually seed via: `POST http://localhost:3001/api/seed`

## MongoDB Collections

The app uses two MongoDB collections with predefined schemas:

### UserData Collection
Stores user swipe data for analytics:
```javascript
{
  user_id: String,           // Default: 'anonymous'
  video_id: String,          // Required
  correct_label: 'real'|'ai', // Required
  user_guess: 'real'|'ai',    // Required
  is_correct: Boolean,        // Required
  decision_time_ms: Number,   // Required
  confidence: Number,         // Optional: 0-1
  timestamp: Date,
  app_version: String,
  device: { platform, model },
  session_id: String,
  locale: String,
  video_rotation_seen: Number,
  video_order_index: Number
}
```

### VideosDATA Collection
Contains video information:
```javascript
{
  url: String,              // Required
  label: 'real'|'ai',       // Required
  description: String,      // Educational text
  source: String,           // Video source
  uploaded_at: Date
}
```

## API Endpoints

- `GET /` - API info and available endpoints
- `GET /api/health` - Health check and DB status
- `GET /api/videos?limit=10` - Get random videos (max 50)
- `POST /api/swipes` - Record user swipe (rate limited)
- `POST /api/seed` - Seed database with initial videos

## Project Structure

```
ai-or-ain't/
├── server.js                    # Main server file
├── server/
│   ├── config/
│   │   └── database.js         # Database connection & shutdown
│   └── middleware/
│       ├── security.js          # Rate limiting, security headers
│       └── validation.js        # Input validation for swipes
├── components/                  # React components
├── services/
│   └── apiService.ts           # API communication
├── .env                        # Environment variables (gitignored)
├── .env.example                # Template for environment variables
└── package.json
```

## Security Features

1. **Helmet**: Sets secure HTTP headers
2. **Rate Limiting**: Prevents API abuse
3. **CORS**: Whitelisted origins only (configurable for mobile)
4. **NoSQL Injection Protection**: Sanitizes all user input
5. **Input Validation**: Strict validation on all endpoints
6. **Request Size Limits**: Max 10KB payload
7. **Environment Variables**: Sensitive data in .env (never committed)

## Development vs Production

- **Development**: Full error messages, request logging
- **Production**: Generic error messages, no verbose logging

Set `NODE_ENV=production` in your `.env` for production deployments.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT
