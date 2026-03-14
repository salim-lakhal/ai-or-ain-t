"""
Script to process Kaggle REAL/AI Video Dataset and upload ONLY URLs to MongoDB.
Videos stay on disk, accessed via HTTP URLs.

Usage:
    pip install kagglehub pymongo
    export MONGO_URI='your_connection_string'
    python scripts/process_kaggle_dataset.py
"""

import kagglehub
import os
from pathlib import Path
from pymongo import MongoClient

# MongoDB connection
MONGO_URI = os.environ.get("MONGO_URI")
if not MONGO_URI:
    print("Error: MONGO_URI environment variable is required")
    print("Set it with: export MONGO_URI='your_connection_string'")
    exit(1)

client = MongoClient(MONGO_URI)
db = client['AIorAINT']
videos_collection = db['VideosDATA']

# Server base URL where videos will be served
SERVER_BASE_URL = "http://localhost:3001/kaggle-videos"

def download_dataset():
    """Download the Kaggle dataset"""
    print("Downloading Kaggle dataset...")
    path = kagglehub.dataset_download("kanzeus/realai-video-dataset")
    print(f"Dataset downloaded to: {path}")
    return path

def is_video_file(filename):
    """Check if file is a video"""
    video_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv'}
    return Path(filename).suffix.lower() in video_extensions

def determine_label_from_path(filepath):
    """Determine if video is 'real' or 'ai' based on folder structure"""
    path_lower = str(filepath).lower()

    if '/ai/' in path_lower or '/fake/' in path_lower or '/generated/' in path_lower:
        return 'ai'
    elif '/real/' in path_lower or '/authentic/' in path_lower or '/genuine/' in path_lower:
        return 'real'

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
    print(f"Scanning dataset at: {dataset_path}")

    video_files = []
    for root, dirs, files in os.walk(dataset_path):
        for file in files:
            if is_video_file(file):
                full_path = os.path.join(root, file)
                video_files.append(full_path)

    print(f"Found {len(video_files)} video files")
    return video_files

def process_videos(video_files, dataset_path):
    """Process videos and prepare metadata for MongoDB"""
    print("Processing videos...")

    video_documents = []

    for video_path in video_files:
        rel_path = os.path.relpath(video_path, dataset_path)
        label = determine_label_from_path(video_path)

        if label == 'unknown':
            print(f"Unknown label for: {rel_path}")

        http_url = f"{SERVER_BASE_URL}/{rel_path.replace(os.sep, '/')}"

        doc = {
            "url": http_url,
            "label": label,
            "description": get_video_description(label, os.path.basename(video_path)),
            "source": "kaggle_realai_dataset",
            "filename": os.path.basename(video_path),
            "relative_path": rel_path,
            "local_path": video_path
        }

        video_documents.append(doc)

    print(f"Processed {len(video_documents)} videos")
    return video_documents, dataset_path

def upload_to_mongodb(video_documents, clear_existing=False):
    """Upload ONLY video metadata (URLs) to MongoDB"""
    print("Uploading URLs to MongoDB...")

    if clear_existing:
        print("Clearing existing Kaggle videos...")
        videos_collection.delete_many({"source": "kaggle_realai_dataset"})

    if video_documents:
        result = videos_collection.insert_many(video_documents)
        print(f"Uploaded {len(result.inserted_ids)} video URLs to MongoDB")
    else:
        print("No videos to upload")

def generate_stats(video_documents):
    """Generate statistics about the dataset"""
    print(f"\nDataset Statistics:")
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
    with open('.kaggle_dataset_path', 'w') as f:
        f.write(dataset_path)

    print(f"\nDataset path saved to .kaggle_dataset_path")

def main():
    print("Kaggle Dataset Processor for AI or Ain't")
    print("=" * 50)

    dataset_path = download_dataset()
    video_files = scan_dataset(dataset_path)

    if not video_files:
        print("No video files found in dataset!")
        return

    video_documents, dataset_path = process_videos(video_files, dataset_path)
    generate_stats(video_documents)

    print("\nAbout to upload video URLs to MongoDB.")
    choice = input("Clear existing Kaggle videos? (y/n): ").lower()
    clear = choice == 'y'

    upload_to_mongodb(video_documents, clear_existing=clear)
    save_dataset_path(dataset_path)

    print("\nDataset processing complete!")
    print(f"Videos location: {dataset_path}")

if __name__ == "__main__":
    main()
