#!/bin/bash

# Draworld Production Deployment Script
set -e

echo "🚀 Starting Draworld deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed. Install with: npm i -g vercel"
        exit 1
    fi
    
    if ! command -v firebase &> /dev/null; then
        print_error "Firebase CLI is not installed. Install with: npm i -g firebase-tools"
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Build application
build_app() {
    print_status "Building application..."
    
    rm -rf .next
    npm ci --production=false
    npm run build
    
    if [ ! -d ".next" ]; then
        print_error "Build failed - .next directory not found"
        exit 1
    fi
    
    print_success "Application built successfully"
}

# Deploy Firebase Functions
deploy_functions() {
    print_status "Deploying Firebase Functions..."
    
    cd functions
    npm ci --production
    firebase deploy --only functions --project "$FIREBASE_PROJECT_ID"
    cd ..
    
    print_success "Firebase Functions deployed"
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    vercel --prod --yes
    print_success "Deployed to Vercel"
}

# Main deployment
main() {
    print_status "Starting deployment..."
    
    check_dependencies
    build_app
    deploy_functions
    deploy_vercel
    
    print_success "🎉 Deployment completed successfully!"
}

case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "build-only")
        check_dependencies
        build_app
        ;;
    "functions-only")
        check_dependencies
        deploy_functions
        ;;
    "vercel-only")
        check_dependencies
        deploy_vercel
        ;;
    *)
        echo "Usage: $0 {deploy|build-only|functions-only|vercel-only}"
        exit 1
        ;;
esac