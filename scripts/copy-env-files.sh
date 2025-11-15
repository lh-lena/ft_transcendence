#!/bin/bash

# Script to copy .env.example files to .env files in their corresponding directories

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Copying .env.example files to .env files..."

# Find all .env.example files and copy them to .env
find "$PROJECT_ROOT" -name ".env.example" -type f | while read -r example_file; do
    env_file="${example_file%.example}"
    dir_name="$(dirname "$example_file")"
    relative_path="${dir_name#$PROJECT_ROOT/}"
    
    if [ -f "$env_file" ]; then
        echo "⚠️  Skipping $relative_path/.env (already exists)"
    else
        cp "$example_file" "$env_file"
        echo "✓ Created $relative_path/.env"
    fi
done

echo ""
echo "Done! All .env files have been created."
