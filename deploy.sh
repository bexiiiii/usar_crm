#!/bin/bash

# Usar Bus Manager Deployment Script
# This script deploys the Usar Bus Manager feature to production

set -e

echo "🚀 Starting Usar Bus Manager deployment..."

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Build backend
echo "🔨 Building backend..."
cd backend
mvn clean package -DskipTests -Dmaven.compiler.release=21
cd ..

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm run build
cd ..

# Restart services with docker-compose
echo "🔄 Restarting services..."
docker-compose -f deploy/docker-compose.prod.yml down
docker-compose -f deploy/docker-compose.prod.yml up -d

# Run DB migrations (Flyway will run automatically with Hibernate)
echo "⏳ Waiting for database to be ready..."
sleep 10

echo "✅ Deployment complete!"
echo "🌐 Access the application at: https://travel-crm.example.com"
echo "📊 Bus Manager available at: https://travel-crm.example.com/bus-manager"
