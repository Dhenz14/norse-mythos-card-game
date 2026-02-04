#!/bin/bash

echo "Running database migrations..."
echo "Pushing schema to database..."

# Run database push
npx drizzle-kit push

echo "Database schema push completed!"

echo "Think Tools database integration is now ready."