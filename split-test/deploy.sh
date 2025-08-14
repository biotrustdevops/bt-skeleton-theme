#!/bin/bash

# Cloudflare Worker Split Test Deployment Script
# Usage: ./deploy.sh [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get environment (default to staging)
ENV=${1:-staging}

echo -e "${YELLOW}🚀 Deploying Split Test Worker to ${ENV}${NC}"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI not found. Please install it with: npm install -g wrangler${NC}"
    exit 1
fi

# Check if logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}📝 Please login to Cloudflare${NC}"
    wrangler login
fi

# Run tests first
echo -e "${YELLOW}🧪 Running tests...${NC}"
node test.js

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Tests failed. Aborting deployment.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Tests passed${NC}"

# Deploy based on environment
case $ENV in
    production)
        echo -e "${YELLOW}⚠️  Deploying to PRODUCTION${NC}"
        echo -e "Are you sure? (y/N): "
        read -r confirm
        
        if [[ $confirm != "y" && $confirm != "Y" ]]; then
            echo -e "${RED}❌ Deployment cancelled${NC}"
            exit 1
        fi
        
        echo -e "${YELLOW}📦 Building and deploying to production...${NC}"
        wrangler deploy --env production
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Successfully deployed to production${NC}"
            echo -e "${YELLOW}📊 View analytics at: https://dash.cloudflare.com${NC}"
            
            # Create deployment tag
            git tag -a "deploy-production-$(date +%Y%m%d-%H%M%S)" -m "Production deployment"
        else
            echo -e "${RED}❌ Production deployment failed${NC}"
            exit 1
        fi
        ;;
        
    staging)
        echo -e "${YELLOW}📦 Building and deploying to staging...${NC}"
        wrangler deploy --env staging
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Successfully deployed to staging${NC}"
            echo -e "${YELLOW}🔍 Test at your staging URL${NC}"
            
            # Tail logs
            echo -e "${YELLOW}📋 Tailing logs (Ctrl+C to stop)...${NC}"
            wrangler tail --env staging
        else
            echo -e "${RED}❌ Staging deployment failed${NC}"
            exit 1
        fi
        ;;
        
    dev)
        echo -e "${YELLOW}🔧 Starting development server...${NC}"
        wrangler dev
        ;;
        
    *)
        echo -e "${RED}❌ Unknown environment: $ENV${NC}"
        echo -e "Usage: ./deploy.sh [production|staging|dev]"
        exit 1
        ;;
esac