#!/bin/bash
# setup-folders.sh

echo "Creating ft_transcendence folder structure..."

# Create all directories
mkdir -p ft_transcendence/{frontend,backend,realtime,auth-service}/{src,tests}
mkdir -p ft_transcendence/nginx/ssl
mkdir -p ft_transcendence/monitoring/{prometheus,grafana/dashboards}
mkdir -p ft_transcendence/{scripts,docs,data}
mkdir -p ft_transcendence/.github/workflows

cd ft_transcendence

# Create basic files
touch docker-compose.yml
touch docker-compose.prod.yml
touch Makefile
touch .env.example
touch .gitignore
touch README.md

# Create .gitkeep for empty folders
touch data/.gitkeep
touch nginx/ssl/.gitkeep

echo "✅ Folder structure created!"
echo "📁 Location: $(pwd)"