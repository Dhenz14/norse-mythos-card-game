#!/bin/bash

# Runs a prompt through the Sequential Thinking processor
# Usage: ./sequential-thinking.sh "Your prompt here"

# Check if prompt is provided
if [ -z "$1" ]; then
  echo "Error: No prompt provided"
  echo "Usage: ./sequential-thinking.sh \"Your prompt here\""
  exit 1
fi

# Run the script with the provided prompt
npx tsx server/sequentialThinkingCli.ts "$@"