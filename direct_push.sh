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

# Copy all project files (excluding .git, node_modules, etc.)
echo "Copying all project files..."
rsync -av --exclude=".git" --exclude="node_modules" --exclude=".env" /home/runner/ ./

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
