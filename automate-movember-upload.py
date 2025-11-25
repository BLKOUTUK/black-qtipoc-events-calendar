#!/usr/bin/env python3
"""
Automate Movember post scheduling to late.dev with video uploads.
This script uploads videos directly via API instead of requiring pre-hosted URLs.
"""

import csv
import os
import requests
import sys
from pathlib import Path
from urllib.parse import unquote

# Configuration
LATE_API_KEY = "sk_512b54aac001c7b6c2df8695cebd23e8c6d3b7edaa678b7ad71ed8347d1e3a8d"
LATE_API_BASE = "https://getlate.dev/api/v1"
CSV_FILE = "blkout-movember-2025-CURRENT.csv"
VIDEOS_DIR = "MOVEMBER-VIDEOS-FOR-UPLOAD"

# Video filename mapping from URLs to local files
def extract_video_filename(media_url):
    """Extract video filename from URL like 'https://blkoutuk.com/videos/Movember%20IVOR.mp4'"""
    if not media_url or media_url.startswith("https://blkoutuk.com/images/"):
        return None  # This is an image, not a video

    # Extract filename and decode URL encoding
    filename = media_url.split("/")[-1]
    filename = unquote(filename)  # Decode %20 to spaces
    return filename

def create_post_with_video(row, video_path=None):
    """
    Create a single post via late.dev API.

    Args:
        row: CSV row dict with post data
        video_path: Path to video file to upload (optional)

    Returns:
        Response from API or error dict
    """
    url = f"{LATE_API_BASE}/posts"
    headers = {
        "Authorization": f"Bearer {LATE_API_KEY}"
    }

    # Prepare form data
    data = {
        "platforms": row["platforms"],
        "profiles": row["profiles"],
        "schedule_time": row["schedule_time"],
        "tz": row["tz"],
        "post_content": row["post_content"]
    }

    # Add optional fields if present
    if row.get("title"):
        data["title"] = row["title"]

    # Prepare files dict
    files = {}
    if video_path and os.path.exists(video_path):
        files["media"] = open(video_path, "rb")

    try:
        # Make API request
        if files:
            response = requests.post(url, headers=headers, data=data, files=files)
        else:
            # For image posts, include media_urls
            if row.get("media_urls"):
                data["media_urls"] = row["media_urls"]
            response = requests.post(url, headers=headers, json=data)

        # Close file if opened
        if files:
            files["media"].close()

        return {
            "success": response.status_code in [200, 201],
            "status_code": response.status_code,
            "response": response.json() if response.status_code in [200, 201] else response.text
        }

    except Exception as e:
        if files:
            files["media"].close()
        return {
            "success": False,
            "error": str(e)
        }

def main():
    """Main automation script"""

    # Check files exist
    if not os.path.exists(CSV_FILE):
        print(f"❌ CSV file not found: {CSV_FILE}")
        sys.exit(1)

    if not os.path.exists(VIDEOS_DIR):
        print(f"❌ Videos directory not found: {VIDEOS_DIR}")
        sys.exit(1)

    print("🚀 Starting Movember automation...")
    print(f"📁 CSV: {CSV_FILE}")
    print(f"🎬 Videos: {VIDEOS_DIR}")
    print()

    # Read CSV
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"📊 Found {len(rows)} posts to schedule")
    print()

    # Process each post
    success_count = 0
    failed_count = 0

    for i, row in enumerate(rows, 1):
        # Extract video filename
        video_filename = extract_video_filename(row.get("media_urls", ""))
        video_path = None

        if video_filename:
            video_path = os.path.join(VIDEOS_DIR, video_filename)
            if not os.path.exists(video_path):
                print(f"⚠️  Post {i}: Video not found: {video_filename}")
                video_path = None

        # Create post
        print(f"📤 Post {i}/{len(rows)}: {row['schedule_time']} - ", end="")

        result = create_post_with_video(row, video_path)

        if result.get("success"):
            print(f"✅ Success")
            success_count += 1
        else:
            print(f"❌ Failed")
            print(f"   Error: {result.get('error', result.get('response'))}")
            failed_count += 1

    print()
    print("=" * 60)
    print(f"✅ Successfully scheduled: {success_count}")
    print(f"❌ Failed: {failed_count}")
    print(f"📊 Total: {len(rows)}")
    print("=" * 60)

    if failed_count > 0:
        print()
        print("⚠️  Some posts failed. Check the errors above.")
        print("You may need to create those manually or fix the API parameters.")

if __name__ == "__main__":
    main()
