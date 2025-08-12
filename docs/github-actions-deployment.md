# GitHub Actions Deployment to Shopify

This document explains how to set up automatic deployment of the theme to Shopify when pushing to the main branch.

## Overview

The GitHub Action workflow (`.github/workflows/deploy-to-shopify.yml`) automatically:
1. Builds the Tailwind CSS
2. Deploys the theme to the specified Shopify store

## Setting up Shopify Credentials

To allow GitHub to communicate with Shopify securely, you need to create a Theme Access Token and add it to GitHub Secrets.

### Step 1: Generate a Theme Access Token in Shopify

1. Go to your Shopify Admin → **Apps**
2. Click **Develop apps** (at the bottom of the page)
3. Create a new custom app or select an existing one
4. In the **Configuration** tab, under **Admin API integration**, configure these scopes:
   - `write_themes`
   - `read_themes`
5. Click **Install app**
6. In the **API credentials** tab, under **Admin API access token**, click **Reveal token once**
7. **Important**: Copy this token immediately - you'll only see it once!

### Step 2: Add Secrets and Variables to GitHub

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

#### Add the Secret:
1. Click **New repository secret**
2. Create the secret:
   - **Name**: `SHOPIFY_CLI_THEME_TOKEN`
   - **Value**: Paste the token from Shopify
3. Click **Add secret**

#### Add the Variables:
1. Click on the **Variables** tab
2. Click **New repository variable**
3. Create the first variable:
   - **Name**: `SHOPIFY_STORE_URL`
   - **Value**: `biotrustdev.myshopify.com`
4. Click **Add variable**
5. Click **New repository variable** again
6. Create the second variable:
   - **Name**: `SHOPIFY_THEME_ID`
   - **Value**: `135082639426`
7. Click **Add variable**

## Deployment Configuration

The workflow is configured using GitHub variables:
- **Store URL**: Set via `SHOPIFY_STORE_URL` variable
- **Theme ID**: Set via `SHOPIFY_THEME_ID` variable  
- **Trigger**: Push to `main` branch

Current configuration:
- **Store**: biotrustdev.myshopify.com
- **Theme**: mburrell-bt-skeleton-theme (ID: 135082639426)

## How It Works

When you push to the `main` branch:

1. GitHub Actions checks out the repository
2. Sets up Node.js environment
3. Installs npm dependencies
4. Builds the Tailwind CSS (`npm run build:css`)
5. Installs Shopify CLI
6. Pushes the theme to the configured Shopify store

## Security

- The Shopify token is stored securely in GitHub Secrets
- Store URL and Theme ID are stored in GitHub Variables (can be viewed but not sensitive)
- The token is never exposed in logs or visible in the codebase
- Only users with repository admin access can view or modify secrets and variables

## Troubleshooting

### Deployment Fails with Authentication Error
- Verify the `SHOPIFY_CLI_THEME_TOKEN` secret is correctly set in GitHub
- Ensure the token has the required `write_themes` and `read_themes` scopes
- Check that the token hasn't expired

### Theme Not Found Error
- Verify the theme ID (135082639426) exists in the store
- Ensure the store URL (biotrustdev.myshopify.com) is correct

### Build Errors
- Check that all npm dependencies are properly listed in `package.json`
- Verify the Tailwind configuration is correct

## Manual Deployment

If you need to deploy manually without the GitHub Action:

```bash
# Build CSS
npm run build:css

# Deploy to Shopify
shopify theme push --store=biotrustdev.myshopify.com --path=src --theme=135082639426
```