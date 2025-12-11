"""
Script to process Kaggle REAL/AI Video Dataset and upload ONLY URLs to MongoDB.
Videos stay on disk, accessed via HTTP URLs.

Usage:
    pip install kagglehub pymongo
    export KAGGLE_API_TOKEN=your_token
    python scripts/process_kaggle_dataset.py
"""

import kagglehub
import os
from pathlib import Path
from pymongo import MongoClient

# MongoDB connection
MONGO_URI = "REDACTED_MONGO_URI"
client = MongoClient(MONGO_URI)
db = client['AIorAINT']
videos_collection = db['VideosDATA']

# Server base URL where videos will be served
SERVER_BASE_URL = "http://localhost:3001/kaggle-videos"

def download_dataset():
    """Download the Kaggle dataset"""
    print("📥 Downloading Kaggle dataset...")
    path = kagglehub.dataset_download("kanzeus/realai-video-dataset")
    print(f"✅ Dataset downloaded to: {path}")
    return path

def is_video_file(filename):
    """Check if file is a video"""
    video_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv'}
    return Path(filename).suffix.lower() in video_extensions

def determine_label_from_path(filepath):
    """Determine if video is 'real' or 'ai' based on folder structure"""
    path_lower = str(filepath).lower()

    # Check folder names
    if '/ai/' in path_lower or '/fake/' in path_lower or '/generated/' in path_lower:
        return 'ai'
    elif '/real/' in path_lower or '/authentic/' in path_lower or '/genuine/' in path_lower:
        return 'real'

    # Check filename
    filename_lower = Path(filepath).name.lower()
    if 'ai' in filename_lower or 'fake' in filename_lower:
        return 'ai'
    elif 'real' in filename_lower:
        return 'real'

    return 'unknown'

def get_video_description(label, filename):
    """Generate description based on video type"""
    if label == 'real':
        return "Real footage from authentic source. Look for natural physics, consistent lighting, and organic movement patterns."
    elif label == 'ai':
        return "AI-generated video. Watch for temporal inconsistencies, unnatural physics, or morphing artifacts."
    else:
        return "Video classification needs manual review."

def scan_dataset(dataset_path):
    """Scan dataset and extract video metadata"""
    print(f"🔍 Scanning dataset at: {dataset_path}")

    video_files = []
    for root, dirs, files in os.walk(dataset_path):
        for file in files:
            if is_video_file(file):
                full_path = os.path.join(root, file)
                video_files.append(full_path)

    print(f"📊 Found {len(video_files)} video files")
    return video_files

def process_videos(video_files, dataset_path):
    """Process videos and prepare metadata for MongoDB"""
    print("⚙️ Processing videos...")

    video_documents = []

    for video_path in video_files:
        # Get relative path from dataset root
        rel_path = os.path.relpath(video_path, dataset_path)

        # Determine label
        label = determine_label_from_path(video_path)

        if label == 'unknown':
            print(f"⚠️ Unknown label for: {rel_path}")
            # Still add it, can be reviewed later

        # Create HTTP URL (NOT file:// URL)
        # The backend will serve files from the dataset directory
        http_url = f"{SERVER_BASE_URL}/{rel_path.replace(os.sep, '/')}"

        # Create document - ONLY metadata, no large files
        doc = {
            "url": http_url,  # HTTP URL to stream video
            "label": label,
            "description": get_video_description(label, os.path.basename(video_path)),
            "source": "kaggle_realai_dataset",
            "filename": os.path.basename(video_path),
            "relative_path": rel_path,
            "local_path": video_path  # For backend to find the file
        }

        video_documents.append(doc)

    print(f"✅ Processed {len(video_documents)} videos")
    return video_documents, dataset_path

def upload_to_mongodb(video_documents, clear_existing=False):
    """Upload ONLY video metadata (URLs) to MongoDB - NOT the videos themselves"""
    print("📤 Uploading URLs to MongoDB (NOT video files)...")

    if clear_existing:
        print("🗑️ Clearing existing Kaggle videos...")
        videos_collection.delete_many({"source": "kaggle_realai_dataset"})

    if video_documents:
        result = videos_collection.insert_many(video_documents)
        print(f"✅ Uploaded {len(result.inserted_ids)} video URLs to MongoDB")
        print(f"💾 Total size in MongoDB: ~{len(result.inserted_ids) * 0.5}KB (just metadata!)")
    else:
        print("⚠️ No videos to upload")

def generate_stats(video_documents):
    """Generate statistics about the dataset"""
    print("\n📊 Dataset Statistics:")
    print(f"Total videos: {len(video_documents)}")

    real_count = sum(1 for v in video_documents if v['label'] == 'real')
    ai_count = sum(1 for v in video_documents if v['label'] == 'ai')
    unknown_count = sum(1 for v in video_documents if v['label'] == 'unknown')

    print(f"Real videos: {real_count}")
    print(f"AI videos: {ai_count}")
    if unknown_count > 0:
        print(f"Unknown videos: {unknown_count} (needs review)")

    if len(video_documents) > 0:
        print(f"Balance: {real_count/len(video_documents)*100:.1f}% real, {ai_count/len(video_documents)*100:.1f}% AI")

def save_dataset_path(dataset_path):
    """Save dataset path for backend to use"""
    config = {
        "kaggle_dataset_path": dataset_path,
        "server_base_url": SERVER_BASE_URL
    }

    with open('.kaggle_dataset_path', 'w') as f:
        f.write(dataset_path)

    print(f"\n💡 Dataset path saved to .kaggle_dataset_path")
    print(f"💡 Add this to your backend to serve videos:")
    print(f"\n   app.use('/kaggle-videos', express.static('{dataset_path}'));")

def main():
    print("🚀 Kaggle Dataset Processor for AI or Ain't")
    print("=" * 50)

    # Step 1: Download dataset
    dataset_path = download_dataset()

    # Step 2: Scan for videos
    video_files = scan_dataset(dataset_path)

    if not video_files:
        print("❌ No video files found in dataset!")
        return

    # Step 3: Process videos (metadata only)
    video_documents, dataset_path = process_videos(video_files, dataset_path)

    # Step 4: Generate statistics
    generate_stats(video_documents)

    # Step 5: Upload to MongoDB (URLs only, NOT videos)
    print("\n⚠️ About to upload video URLs to MongoDB (NOT the videos themselves).")
    choice = input("Clear existing Kaggle videos? (y/n): ").lower()
    clear = choice == 'y'

    upload_to_mongodb(video_documents, clear_existing=clear)

    # Step 6: Save dataset path for backend
    save_dataset_path(dataset_path)

    print("\n✅ Dataset processing complete!")
    print(f"📁 Videos location: {dataset_path}")
    print(f"💾 MongoDB: Only URLs stored (lightweight!)")
    print(f"🌐 Videos will be streamed via: {SERVER_BASE_URL}")
    print("\n💡 Next steps:")
    print("1. Update backend to serve videos (see instructions above)")
    print("2. Restart backend server")
    print("3. Videos will stream directly from disk!")

if __name__ == "__main__":
    main()
