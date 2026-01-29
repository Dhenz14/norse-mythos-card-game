#!/bin/bash

# Script to push all files to GitHub repository
# This script will ensure all files are committed and pushed to the Norse Mythos Card Game repository

# Set variables
REPO_URL="https://github.com/Dhenz14/norse-mythos-card-game.git"
REPO_NAME="norse-mythos-card-game"
BRANCH="main"
LOG_FILE="github_upload_log.txt"

echo "Starting comprehensive GitHub upload script at $(date)" | tee -a $LOG_FILE

# Function to check if GitHub token is available
check_github_token() {
  if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN is not set. Please set it before running this script." | tee -a $LOG_FILE
    exit 1
  fi
  
  echo "GitHub token is available." | tee -a $LOG_FILE
}

# Function to clone the repository if not already cloned
clone_repository() {
  if [ -d "/tmp/$REPO_NAME" ]; then
    echo "Repository already cloned at /tmp/$REPO_NAME, removing to start fresh..." | tee -a $LOG_FILE
    rm -rf "/tmp/$REPO_NAME"
  fi
  
  echo "Cloning repository to /tmp/$REPO_NAME..." | tee -a $LOG_FILE
  git clone "https://$GITHUB_TOKEN@github.com/Dhenz14/$REPO_NAME.git" "/tmp/$REPO_NAME" 2>&1 | tee -a $LOG_FILE
  
  if [ $? -ne 0 ]; then
    echo "Failed to clone repository. Check your GitHub token and network connection." | tee -a $LOG_FILE
    exit 1
  fi
}

# Function to copy all project files to the cloned repository
copy_files() {
  echo "Copying all project files to cloned repository..." | tee -a $LOG_FILE
  
  # Create directories if they don't exist
  mkdir -p "/tmp/$REPO_NAME/client" "/tmp/$REPO_NAME/server" "/tmp/$REPO_NAME/shared" "/tmp/$REPO_NAME/public" "/tmp/$REPO_NAME/models"
  
  # Copy all files from the project to the cloned repository
  # First, copy the main project directories
  cp -r ./client/* "/tmp/$REPO_NAME/client/" 2>/dev/null || true
  cp -r ./server/* "/tmp/$REPO_NAME/server/" 2>/dev/null || true
  cp -r ./shared/* "/tmp/$REPO_NAME/shared/" 2>/dev/null || true
  cp -r ./public/* "/tmp/$REPO_NAME/public/" 2>/dev/null || true
  cp -r ./models/* "/tmp/$REPO_NAME/models/" 2>/dev/null || true
  
  # Then copy the root files
  find . -maxdepth 1 -type f -not -path "*/\.*" -not -path "./node_modules/*" -not -path "./upload_all_to_github.sh" -exec cp {} "/tmp/$REPO_NAME/" \; 2>/dev/null || true
  
  # Count files
  FILE_COUNT=$(find "/tmp/$REPO_NAME" -type f | wc -l)
  echo "Total files copied: $FILE_COUNT" | tee -a $LOG_FILE
}

# Function to commit and push all files
commit_and_push() {
  echo "Committing and pushing all files..." | tee -a $LOG_FILE
  
  cd "/tmp/$REPO_NAME"
  
  # Configure Git
  git config user.name "Replit AI"
  git config user.email "ai@replit.com"
  
  # Add all files
  echo "Adding all files to Git..." | tee -a $LOG_FILE
  git add --all
  
  # Commit changes
  echo "Committing changes..." | tee -a $LOG_FILE
  git commit -m "Upload all Norse Mythos Card Game files" -m "Complete project files including all components, assets, and configurations." 2>&1 | tee -a $LOG_FILE
  
  # Push to GitHub
  echo "Pushing to GitHub (this may take a while for large files)..." | tee -a $LOG_FILE
  git push --set-upstream origin $BRANCH 2>&1 | tee -a $LOG_FILE
  
  PUSH_STATUS=$?
  if [ $PUSH_STATUS -ne 0 ]; then
    echo "Warning: Push might have had issues. Check the log file for details." | tee -a $LOG_FILE
    echo "Attempting to push in smaller chunks..." | tee -a $LOG_FILE
    
    # Reset to previous commit
    git reset HEAD~1
    
    # Push files in smaller chunks
    find . -type f -not -path "*/\.git/*" -print0 | xargs -0 -n 10 bash -c 'for file in "$@"; do git add "$file" && git commit -m "Add file: $file" > /dev/null && git push; done' _
  else
    echo "Push completed successfully!" | tee -a $LOG_FILE
  fi
}

# Function to create and upload a complete archive
create_and_upload_archive() {
  echo "Creating complete project archive..." | tee -a $LOG_FILE
  
  # Create a tar.gz archive
  cd /home/runner
  tar -czf "norse-mythos-complete.tar.gz" --exclude="*/node_modules/*" --exclude="*/.git/*" -C . client server shared public models *.json *.js *.md 2>&1 | tee -a $LOG_FILE
  
  ARCHIVE_SIZE=$(du -h "norse-mythos-complete.tar.gz" | cut -f1)
  echo "Archive created: norse-mythos-complete.tar.gz ($ARCHIVE_SIZE)" | tee -a $LOG_FILE
  
  # Get the release ID (assuming it exists)
  RELEASE_ID=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/repos/Dhenz14/norse-mythos-card-game/releases | jq '.[0].id')
  
  if [ "$RELEASE_ID" != "null" ]; then
    echo "Uploading archive to release $RELEASE_ID..." | tee -a $LOG_FILE
    
    # Upload to GitHub release
    curl -s -H "Authorization: token $GITHUB_TOKEN" \
         -H "Content-Type: application/gzip" \
         --data-binary @norse-mythos-complete.tar.gz \
         "https://uploads.github.com/repos/Dhenz14/norse-mythos-card-game/releases/$RELEASE_ID/assets?name=norse-mythos-complete.tar.gz&label=Complete%20Project%20Files" 2>&1 | tee -a $LOG_FILE
  else
    echo "No release found. Creating new release..." | tee -a $LOG_FILE
    
    # Create a new release
    RELEASE_RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
         -H "Content-Type: application/json" \
         -d '{"tag_name":"v1.0.0","name":"Complete Release","body":"Complete Norse Mythos Card Game project files including all components, assets, and configurations.","draft":false,"prerelease":false}' \
         "https://api.github.com/repos/Dhenz14/norse-mythos-card-game/releases")
    
    NEW_RELEASE_ID=$(echo $RELEASE_RESPONSE | jq '.id')
    
    echo "Uploading archive to new release $NEW_RELEASE_ID..." | tee -a $LOG_FILE
    
    # Upload to the new GitHub release
    curl -s -H "Authorization: token $GITHUB_TOKEN" \
         -H "Content-Type: application/gzip" \
         --data-binary @norse-mythos-complete.tar.gz \
         "https://uploads.github.com/repos/Dhenz14/norse-mythos-card-game/releases/$NEW_RELEASE_ID/assets?name=norse-mythos-complete.tar.gz&label=Complete%20Project%20Files" 2>&1 | tee -a $LOG_FILE
  fi
}

# Main execution flow
echo "=== NORSE MYTHOS CARD GAME - GITHUB UPLOAD SCRIPT ===" | tee -a $LOG_FILE
check_github_token
clone_repository
copy_files
commit_and_push
create_and_upload_archive

echo "Upload process completed at $(date)" | tee -a $LOG_FILE
echo "Check $LOG_FILE for detailed logs of the upload process." | tee -a $LOG_FILE
echo "GitHub repository: https://github.com/Dhenz14/norse-mythos-card-game" | tee -a $LOG_FILE