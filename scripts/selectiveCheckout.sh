#!/bin/bash

# --- Configuration ---
# 1. Branch to pull changes from (the 3rd party's branch)
VENDOR_BRANCH="main"

# 2. Your working branch where the merge will first occur
MY_BRANCH="release"

# 3. List of files to discard changes for (reverted to the version in HEAD of MY_BRANCH)
# NOTE: Use paths relative to the repository root.
DISCARD_FILES=(
    ".gitignore"
    "index.html"
    "package.json"
    "pnpm-lock.yaml"
    "vite.config.ts"
)
# ---------------------

# Exit immediately if a command exits with a non-zero status
set -e

echo "Starting Automated Selective Merge Process..."
echo "--------------------------------------------------------"

# 1. Check if we are inside a Git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo "Error: Must be run inside a Git repository."
    exit 1
fi

# 2. Ensure we start from the feature branch
echo "➡️ Switching to working branch: $MY_BRANCH"
git checkout "$MY_BRANCH"

# 3. Fetch latest changes
echo "🌐 Fetching latest changes from remote..."
git fetch origin

# 4. Start the selective merge with --no-commit
echo "🤝 Starting selective merge from origin/$VENDOR_BRANCH (no commit)..."
git merge "origin/$VENDOR_BRANCH" --no-commit

# 5. Loop through and discard the changes for unwanted files
echo "🗑️ Discarding unwanted changes for configured files..."
for FILE in "${DISCARD_FILES[@]}"; do
    # Check if the file has unstaged changes (meaning the merge changed it)
    if ! git diff --exit-code "$FILE" > /dev/null 2>&1; then
        # Discard the changes using git checkout -- <file>
        git checkout -- "$FILE"
        echo "   - Discarded changes for: $FILE"
    else
        echo "   - Skipped '$FILE': No changes detected from vendor branch."
    fi
done

# 6. Commit the selective merge on the feature branch
echo "✅ Committing the selective merge on $MY_BRANCH..."
git add .
git commit -m "Merge $VENDOR_BRANCH, selectively accepting updates and discarding configuration files."

# 8. Push the final result to the remote
echo "📤 Pushing final changes to origin..."
git push origin "$MY_BRANCH"

echo "--------------------------------------------------------"
echo "🎉 SUCCESS: Selective merge, cleanup, and integration into $MY_BRANCH complete."
