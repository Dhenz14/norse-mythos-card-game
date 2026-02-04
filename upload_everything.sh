#!/bin/bash

# UPLOAD EVERYTHING SCRIPT - This will push ALL files to GitHub

echo "Starting direct upload of ALL files at $(date)"

# Set up variables
REPO_URL="https://github.com/Dhenz14/norse-mythos-card-game.git"
TEMP_DIR="/tmp/norse-all-files"

# Remove any existing temporary directory
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# Clone the repository
echo "Cloning repository..."
git clone "https://${GITHUB_TOKEN}@github.com/Dhenz14/norse-mythos-card-game.git" $TEMP_DIR

# Go to the temporary directory
cd $TEMP_DIR

# Configure Git
git config user.name "Replit AI"
git config user.email "ai@replit.com"
git config --global core.compression 0  # Disable compression for large files

# Remove all existing files except .git
find . -not -path "./.git*" -not -path "." -delete

# Copy ALL project files from the current project
echo "Copying ALL project files..."

# Create all the necessary directories
mkdir -p client/src/components
mkdir -p client/src/components/ui
mkdir -p client/src/game/components
mkdir -p client/src/game/hooks
mkdir -p client/src/pages
mkdir -p client/public
mkdir -p server
mkdir -p shared

# Copy files by category
echo "Copying main component files..."
find /home/runner/client/src -type f -not -path "*/node_modules/*" -exec cp --parents {} $TEMP_DIR/ \; 2>/dev/null || true

echo "Copying server files..."
find /home/runner/server -type f -not -path "*/node_modules/*" -exec cp --parents {} $TEMP_DIR/ \; 2>/dev/null || true

echo "Copying shared files..."
find /home/runner/shared -type f -not -path "*/node_modules/*" -exec cp --parents {} $TEMP_DIR/ \; 2>/dev/null || true

echo "Copying public files..."
find /home/runner/public -type f -not -path "*/node_modules/*" -exec cp --parents {} $TEMP_DIR/ \; 2>/dev/null || true

echo "Copying root files..."
find /home/runner -maxdepth 1 -type f -not -path "*/\.*" -not -path "*/uploads/*" -not -path "*/attached_assets/*" -not -path "*/node_modules/*" -exec cp {} $TEMP_DIR/ \; 2>/dev/null || true

# Add all files to git
echo "Adding all files to git..."
git add .

# Commit changes
echo "Committing changes..."
git commit -m "Upload all project files" -m "Complete upload of all Norse Mythos Card Game files"

# Push to GitHub with forced update
echo "Pushing ALL files to GitHub..."
git push -f origin main

echo "Upload completed at $(date)"
echo "Check your GitHub repository at https://github.com/Dhenz14/norse-mythos-card-game"