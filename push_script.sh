#!/bin/bash
export GH_TOKEN=$GITHUB_TOKEN
echo "Starting push at $(date)"
git push --set-upstream origin main
echo "Push completed at $(date)"
