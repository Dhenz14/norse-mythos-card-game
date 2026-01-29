#!/bin/bash

# Configuration
REPO_NAME="norse-mythos-card-game"
GITHUB_USER="Dhenz14"
BRANCH="main"

echo "===== Starting direct push of all files to GitHub ====="
echo "This will push ALL files directly to the repository"
echo

# Clone the repository to a temporary location
TEMP_DIR=$(mktemp -d)
echo "Cloning repository to temporary directory: $TEMP_DIR"
git clone "https://$GITHUB_TOKEN@github.com/$GITHUB_USER/$REPO_NAME.git" "$TEMP_DIR"
cd "$TEMP_DIR"

# Configure git
git config user.name "Replit AI"
git config user.email "ai@replit.com"

# Clear out any existing files (except .git directory)
find . -mindepth 1 -maxdepth 1 -not -name ".git" -exec rm -rf {} \;

# Copy all project files - doing this in steps to avoid node_modules
echo "Copying all project files..."

# Copy client directory
echo "Copying client directory..."
mkdir -p client
cp -r /home/runner/client/* client/

# Copy server directory
echo "Copying server directory..."
mkdir -p server
cp -r /home/runner/server/* server/

# Copy shared directory
echo "Copying shared directory..."
mkdir -p shared
cp -r /home/runner/shared/* shared/

# Copy uploads directory if it exists
if [ -d "/home/runner/uploads" ]; then
  echo "Copying uploads directory..."
  mkdir -p uploads
  cp -r /home/runner/uploads/* uploads/
fi

# Copy root files (except node_modules and .git)
echo "Copying root files..."
find /home/runner -maxdepth 1 -type f -not -path "*/\.*" -exec cp {} . \;

# For MD files created in this session
cp /home/runner/*.md . 2>/dev/null || echo "No MD files found"

# Add all files to git
echo "Adding files to git..."
git add --all

# Commit the changes
echo "Committing changes..."
git commit -m "Add all project files (direct push)"

# Push to GitHub
echo "Pushing to GitHub..."
git push origin "$BRANCH"

echo "===== Direct push completed ====="
