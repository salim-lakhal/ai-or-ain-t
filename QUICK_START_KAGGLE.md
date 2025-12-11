# 🚀 Quick Start: Kaggle Videos (Lightweight!)

This guide shows you how to use Kaggle videos **without storing them in MongoDB** - only URLs are stored!

## ✅ What This Does

1. **Downloads** Kaggle dataset to your disk (~2.8GB)
2. **Extracts** video metadata
3. **Uploads ONLY URLs** to MongoDB (~0.5KB per video!)
4. **Serves videos** directly from disk via HTTP
5. **No conversion needed** - Videos work as-is

## 📦 Step 1: Install Python Dependencies

```bash
pip install kagglehub pymongo
```

## 🔑 Step 2: Setup Kaggle API

Set your Kaggle API token:

```bash
export KAGGLE_API_TOKEN=your_token_here
```

**⚠️ SECURITY NOTE:** After using your token, consider regenerating it at https://www.kaggle.com/settings

## ▶️ Step 3: Run the Script

```bash
python scripts/process_kaggle_dataset.py
```

### What You'll See:

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

⚠️ About to upload video URLs to MongoDB (NOT the videos themselves).
Clear existing Kaggle videos? (y/n): y

📤 Uploading URLs to MongoDB (NOT video files)...
✅ Uploaded 230 video URLs to MongoDB
💾 Total size in MongoDB: ~115KB (just metadata!)

💡 Dataset path saved to .kaggle_dataset_path
✅ Dataset processing complete!
```

## 🖥️ Step 4: Restart Backend

The backend will automatically detect and serve the videos:

```bash
node server.js
```

You should see:

```
📁 Kaggle dataset found at: /home/user/.cache/kagglehub/...
✅ Serving Kaggle videos at /kaggle-videos
🚀 Server running on port 3001
```

## 🎮 Step 5: Test It!

1. **Start frontend:**
   ```bash
   npm run dev
   ```

2. **Open browser:** `http://localhost:5173`

3. **Swipe away!** Videos stream directly from disk

## 📱 Portrait Mode (No Conversion Needed!)

Videos will automatically be cropped to portrait using CSS:

```css
/* Already in your app */
video {
  object-fit: cover;  /* Center-crops to portrait */
  width: 100%;
  height: 100%;
}
```

**No FFmpeg or conversion required!** 🎉

## 🌐 How It Works

### MongoDB Stores:
```javascript
{
  url: "http://localhost:3001/kaggle-videos/real/video.mp4",  // Just URL!
  label: "real",
  description: "...",
  filename: "video.mp4"
}
// Size: ~500 bytes per video
```

### Backend Serves:
```javascript
app.use('/kaggle-videos', express.static(kaggleDatasetPath));
// Videos stream directly from disk
```

### Frontend Plays:
```html
<video src="http://localhost:3001/kaggle-videos/real/video.mp4" />
<!-- Browser fetches video from backend -->
```

## 💡 Benefits

✅ **Lightweight MongoDB** - Only URLs stored (~100KB for 200 videos)
✅ **No upload time** - Videos stay on disk
✅ **No storage limits** - MongoDB stays small
✅ **Fast processing** - Only metadata extracted
✅ **Direct streaming** - Videos served from disk
✅ **No conversion** - CSS handles portrait cropping

## 🔄 Add More Videos

To add more videos later:

1. Run the script again: `python scripts/process_kaggle_dataset.py`
2. Choose "n" when asked to clear existing videos
3. New videos will be added to MongoDB
4. Restart backend to reload paths

## 📊 Check What's in MongoDB

```bash
# See videos in MongoDB
mongosh "your_connection_string"
> use AIorAINT
> db.VideosDATA.find({source: "kaggle_realai_dataset"}).limit(5)
```

You'll see URLs like:
```javascript
{
  url: "http://localhost:3001/kaggle-videos/real/video1.mp4",
  label: "real",
  source: "kaggle_realai_dataset"
}
```

## 🐛 Troubleshooting

### Videos Not Loading

1. **Check backend started:**
   ```bash
   node server.js
   # Should show: "✅ Serving Kaggle videos at /kaggle-videos"
   ```

2. **Check file exists:**
   ```bash
   cat .kaggle_dataset_path
   # Should show path to dataset
   ls /path/to/dataset  # Verify videos are there
   ```

3. **Check MongoDB:**
   ```bash
   mongosh
   > db.VideosDATA.findOne({source: "kaggle_realai_dataset"})
   ```

### 404 Errors on Videos

- Verify the path in `.kaggle_dataset_path` is correct
- Check backend has read permissions for the directory
- Restart backend after running the Python script

### Python Script Fails

- Verify Kaggle token: `echo $KAGGLE_API_TOKEN`
- Check internet connection (downloads 2.8GB)
- Ensure MongoDB connection string is correct in script

## 📱 Mobile Access

To access from phone:

1. Find your IP:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Update `.env`:
   ```env
   ALLOWED_ORIGINS=http://localhost:5173,http://192.168.1.X:5173
   ```

3. Access from phone: `http://192.168.1.X:5173`

## 🎯 Summary

- ✅ **Kaggle videos**: Downloaded locally (~2.8GB on disk)
- ✅ **MongoDB**: Only URLs (~100KB total)
- ✅ **Backend**: Serves videos via HTTP
- ✅ **Frontend**: Plays videos directly
- ✅ **Portrait mode**: CSS auto-crops
- ✅ **Mobile-ready**: Works on any device

**That's it! Your app now has hundreds of videos without bloating MongoDB!** 🎉

---

**Questions?** Check the main README or KAGGLE_SETUP.md for more details.
