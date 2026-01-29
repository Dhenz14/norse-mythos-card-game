#!/bin/bash

# Configuration
REPO_NAME="norse-mythos-card-game"
GITHUB_USER="Dhenz14"
BRANCH="main"

echo "===== Starting complete push of all files to GitHub ====="
echo "This will push ALL project files directly to the repository"
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
echo "Clearing repository..."
find . -mindepth 1 -maxdepth 1 -not -name ".git" -exec rm -rf {} \;

# Source directory is the current workspace
SOURCE_DIR="/home/runner/workspace"

# Copy all files except node_modules and .git
echo "Copying all project files..."
cd "$SOURCE_DIR"

# Create a list of files to copy
echo "Creating file list..."
find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/\.*cache*/*" > /tmp/files_to_copy.txt

# Now copy them preserving directory structure
echo "Copying files..."
cd "$TEMP_DIR"
while IFS= read -r file; do
  dir=$(dirname "$file")
  mkdir -p "$dir"
  cp "$SOURCE_DIR/$file" "$dir/" 2>/dev/null || echo "Failed to copy: $file"
done < /tmp/files_to_copy.txt

# Add all files to git
echo "Adding files to git..."
git add --all

# Commit the changes
echo "Committing changes..."
git commit -m "Add all project files directly to repository"

# Push to GitHub
echo "Pushing to GitHub..."
git push origin "$BRANCH"

echo "===== Complete push completed ====="
