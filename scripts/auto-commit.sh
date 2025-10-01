#!/bin/bash

echo "🔄 Auto-committing changes..."

# Add all changes including environment files
git add .
git add -f .env.development .env.production .env.local.example

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "✅ No changes to commit"
    exit 0
fi

# Get list of changed files for commit message
changed_files=$(git diff --staged --name-only | head -5)
file_count=$(git diff --staged --name-only | wc -l | tr -d ' ')

# Create intelligent commit message based on changes
if echo "$changed_files" | grep -q "\.env"; then
    commit_type="feat: environment configuration updates"
elif echo "$changed_files" | grep -q "src/screens/"; then
    commit_type="feat: screen updates"
elif echo "$changed_files" | grep -q "src/components/"; then
    commit_type="feat: component updates"
elif echo "$changed_files" | grep -q "src/services/"; then
    commit_type="feat: service updates"
elif echo "$changed_files" | grep -q "src/utils/"; then
    commit_type="feat: utility updates"
elif echo "$changed_files" | grep -q "package\.json"; then
    commit_type="deps: dependency updates"
else
    commit_type="chore: code updates"
fi

# Create commit message
timestamp=$(date "+%Y-%m-%d %H:%M:%S")
if [ $file_count -eq 1 ]; then
    commit_msg="$commit_type

- Updated: $(echo "$changed_files" | tr '\n' ' ')

Auto-committed at $timestamp"
else
    commit_msg="$commit_type ($file_count files)

Changed files:
$(echo "$changed_files" | sed 's/^/- /')

Auto-committed at $timestamp"
fi

# Commit changes
git commit -m "$commit_msg"

echo "✅ Changes committed successfully"
echo "📝 Commit message: $commit_type"

# Push changes
if git push origin main; then
    echo "✅ Changes pushed to remote successfully"
else
    echo "❌ Failed to push changes to remote"
    exit 1
fi
