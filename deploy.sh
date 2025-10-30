#!/bin/bash

# Lead Discovery Email Automation - Deployment Script
# This script helps you deploy the application to Digital Ocean

set -e

echo "🚀 Lead Discovery Email Automation - Deployment Helper"
echo "======================================================"
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "📝 Please create .env.production from .env.example"
    echo ""
    echo "Run: cp .env.example .env.production"
    echo "Then edit .env.production with your actual values"
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "📦 Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    echo "📦 Please install Docker Compose first"
    exit 1
fi

echo "✅ Docker Compose is installed"
echo ""

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo "🔨 Building Docker image..."
docker-compose build

echo ""
echo "🚀 Starting application..."
docker-compose up -d

echo ""
echo "⏳ Waiting for application to start..."
sleep 10

# Check if application is running
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo ""
    echo "✅ Application is running!"
    echo ""
    echo "📊 Application Status:"
    echo "   - Local URL: http://localhost:3000"
    echo "   - Health Check: http://localhost:3000/api/health"
    echo ""
    echo "📝 Useful Commands:"
    echo "   - View logs: docker-compose logs -f"
    echo "   - Stop app: docker-compose down"
    echo "   - Restart: docker-compose restart"
    echo ""
    echo "🎉 Deployment successful!"
else
    echo ""
    echo "❌ Application failed to start"
    echo "📋 Check logs with: docker-compose logs"
    exit 1
fi
