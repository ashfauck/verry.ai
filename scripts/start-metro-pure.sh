#!/bin/bash

# Pure Metro Server Starter
# Bypasses React Native CLI entirely

echo "🚀 Starting Pure Metro Server (No CLI Dependency)..."

cd "$(dirname "$0")/.."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Run 'npm install' first."
    exit 1
fi

# Check for reset flag
RESET_FLAG=""
if [ "$1" = "--reset-cache" ] || [ "$1" = "-r" ]; then
    RESET_FLAG="--reset-cache"
    echo "🔄 Cache reset enabled"
fi

# Start Metro with pure Node.js approach
echo "📦 Starting Metro server directly..."
node scripts/start-metro-pure.js $RESET_FLAG