#!/bin/bash
# Download TikTok video using yt-dlp

TIKTOK_URL="https://www.tiktok.com/@tiboinshvpe/video/7577882261924629782"
OUTPUT_DIR="/home/salim/Téléchargements/ai-or-ain't/public/videos"
OUTPUT_FILE="$OUTPUT_DIR/tiboinshape_first.mp4"

echo "📥 Downloading TikTok video..."
mkdir -p "$OUTPUT_DIR"

# Try using yt-dlp (install with: pipx install yt-dlp)
if command -v yt-dlp &> /dev/null; then
    yt-dlp -f "best[ext=mp4]" -o "$OUTPUT_FILE" "$TIKTOK_URL"
    echo "✅ Video downloaded to: $OUTPUT_FILE"
else
    echo "❌ yt-dlp not found"
    echo "📝 Install with: pipx install yt-dlp"
    echo ""
    echo "Or download manually from:"
    echo "$TIKTOK_URL"
    echo ""
    echo "Then save as: $OUTPUT_FILE"
fi
