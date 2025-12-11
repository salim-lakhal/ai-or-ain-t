# Kaggle Dataset Integration Guide

This guide shows you how to use videos from the Kaggle REAL/AI Video Dataset without downloading or converting them manually.

## Prerequisites

1. **Kaggle Account**: Create a free account at [kaggle.com](https://www.kaggle.com)
2. **Kaggle API Key**: Download from [kaggle.com/settings](https://www.kaggle.com/settings) → "API" → "Create New Token"
3. **Python 3.8+**: Required for the processing script

## Setup Kaggle API

1. Place your downloaded `kaggle.json` in the correct location:
   ```bash
   # Linux/Mac
   mkdir -p ~/.kaggle
   mv ~/Downloads/kaggle.json ~/.kaggle/
   chmod 600 ~/.kaggle/kaggle.json

   # Windows
   mkdir %USERPROFILE%\.kaggle
   move %USERPROFILE%\Downloads\kaggle.json %USERPROFILE%\.kaggle\
   ```

## Install Python Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `kagglehub` - Downloads Kaggle datasets
- `pymongo` - MongoDB connection
- `python-dotenv` - Environment variable management

## Process the Dataset

Run the processing script:

```bash
python scripts/process_kaggle_dataset.py
```

### What This Script Does:

1. **Downloads** the Kaggle dataset (~2.8GB) to your local machine
2. **Scans** all video files in the dataset
3. **Extracts** metadata (label: real/ai, filename, path)
4. **Uploads** metadata to MongoDB (NOT the video files themselves)
5. **Keeps videos** in their original location - no conversion needed!

### Script Output:

```
🚀 Kaggle Dataset Processor for AI or Ain't
==================================================
📥 Downloading Kaggle dataset...
✅ Dataset downloaded to: /home/user/.cache/kagglehub/...
🔍 Scanning dataset at: /home/user/.cache/kagglehub/...
📊 Found 250 video files
⚙️ Processing videos...
✅ Processed 230 videos

📊 Dataset Statistics:
Total videos: 230
Real videos: 115
AI videos: 115
Balance: 50.0% real, 50.0% AI

⚠️ About to upload videos to MongoDB.
Clear existing Kaggle videos? (y/n): y
📤 Uploading to MongoDB...
✅ Uploaded 230 videos to MongoDB
```

## Video Orientation Handling

The dataset likely contains **landscape videos**, but your app needs **portrait mode**.

### Solution Options:

#### Option 1: CSS/Player Cropping (Recommended - No Conversion)
The video player can automatically crop landscape videos to portrait using CSS:

```css
/* Already implemented in your app */
video {
  object-fit: cover;
  width: 100%;
  height: 100%;
}
```

Videos will be **center-cropped** to fit portrait screens. Works in real-time, no pre-processing!

#### Option 2: Server-Side Video Conversion (If needed)
If you need perfectly formatted portrait videos, add this to your backend:

```javascript
// Install: npm install fluent-ffmpeg
const ffmpeg = require('fluent-ffmpeg');

app.get('/api/videos/:id/portrait', async (req, res) => {
  const video = await Video.findById(req.params.id);
  const inputPath = video.url.replace('file://', '');

  // Convert to portrait (9:16 aspect ratio)
  ffmpeg(inputPath)
    .outputOptions([
      '-vf', 'crop=ih*9/16:ih',  // Crop to 9:16
      '-c:v', 'libx264',
      '-preset', 'fast'
    ])
    .pipe(res);
});
```

## Serving Videos from Local Files

Update your backend to serve videos from the local filesystem:

```javascript
// Add to server.js
import express from 'express';
import path from 'path';

// Serve video files statically
app.use('/videos', express.static('/path/to/kaggle/dataset', {
  setHeaders: (res, filePath) => {
    res.set('Accept-Ranges', 'bytes');
    res.set('Content-Type', 'video/mp4');
  }
}));

// Update video URLs endpoint
app.get('/api/videos', async (req, res) => {
  const videos = await Video.aggregate([{ $sample: { size: 10 } }]);

  const formattedVideos = videos.map(v => ({
    id: v._id.toString(),
    // Convert file:// URL to HTTP URL
    url: v.url.replace('file://', 'http://localhost:3001/videos/'),
    label: v.label.toUpperCase(),
    description: v.description,
    source: v.source
  }));

  res.json(formattedVideos);
});
```

## Testing

1. **Start backend**: `node server.js`
2. **Start frontend**: `npm run dev`
3. **Open mobile browser** or desktop
4. **Videos should play** directly from local storage

## Mobile Access

To access from your phone:

1. Find your computer's local IP:
   ```bash
   # Linux/Mac
   ifconfig | grep inet

   # Windows
   ipconfig
   ```

2. Update `.env`:
   ```env
   ALLOWED_ORIGINS=http://localhost:5173,http://192.168.1.XXX:5173
   ```

3. Access from phone: `http://192.168.1.XXX:5173`

## Troubleshooting

### Videos Not Loading
- Check MongoDB has video documents: `mongosh` → `db.VideosDATA.find().limit(5)`
- Verify file paths are correct
- Ensure backend has read permissions for video files

### Portrait Mode Issues
- CSS `object-fit: cover` handles cropping automatically
- For perfect results, use FFmpeg conversion (Option 2 above)

### CORS Errors on Mobile
- Add your phone's IP to `ALLOWED_ORIGINS` in `.env`
- Restart backend server

## Dataset Structure

After processing, MongoDB will contain:

```javascript
{
  "_id": ObjectId("..."),
  "url": "file:///home/user/.cache/kagglehub/datasets/.../video.mp4",
  "label": "real",  // or "ai"
  "description": "Educational description about the video",
  "source": "kaggle_realai_dataset",
  "filename": "video.mp4",
  "relative_path": "real/video.mp4",
  "needs_portrait_crop": true,
  "original_orientation": "unknown"
}
```

## Benefits of This Approach

✅ **No manual downloading** - Script handles it
✅ **No video conversion** - CSS handles portrait cropping
✅ **Original quality preserved**
✅ **Fast processing** - Only metadata uploaded
✅ **Flexible** - Can add more videos anytime
✅ **Mobile-friendly** - Works on any device

## Resources

- [Kaggle Dataset](https://www.kaggle.com/datasets/kanzeus/realai-video-dataset)
- [KaggleHub Docs](https://github.com/Kaggle/kagglehub)
- [MongoDB Python Driver](https://pymongo.readthedocs.io/)

---

**Questions?** Check the main README or open an issue on GitHub!
