#!/bin/bash

# Verry.ai Development Auto-Commit Wrapper
# Usage: ./commit.sh [optional-message]

if [ -n "$1" ]; then
    # Manual commit message provided
    echo "🔄 Committing with custom message..."
    git add .
    git add -f .env.development .env.production .env.local.example
    
    if git diff --staged --quiet; then
        echo "✅ No changes to commit"
        exit 0
    fi
    
    git commit -m "$1"
    echo "✅ Changes committed with message: $1"
    
    if git push origin main; then
        echo "✅ Changes pushed to remote successfully"
    else
        echo "❌ Failed to push changes to remote"
        exit 1
    fi
else
    # Use intelligent auto-commit
    echo "🤖 Using intelligent auto-commit..."
    ./scripts/auto-commit.sh
fi