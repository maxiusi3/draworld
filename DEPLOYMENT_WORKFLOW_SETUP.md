# GitHub Actions + Vercel Deployment Setup

This guide explains how to set up automatic deployment from GitHub to Vercel using GitHub Actions.

## 🚀 Deployment Workflow Overview

The project now includes two GitHub Actions workflows:

### 1. **Test Workflow** (`.github/workflows/test.yml`)
- Runs on every push and PR
- Executes unit tests, E2E tests, linting
- Includes security scanning and performance tests

### 2. **Deploy Workflow** (`.github/workflows/deploy.yml`) ✨ NEW
- **Preview Deployments**: For pull requests
- **Production Deployments**: For pushes to main branch
- **Health Checks**: Automated testing after deployment
- **Console Error Detection**: Ensures no JavaScript errors

## 🔧 Required GitHub Secrets

To enable automatic deployment, you need to set up these secrets in your GitHub repository:

### Step 1: Get Vercel Information

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel login` and authenticate
3. Run `vercel link` in your project directory
4. Run `vercel project ls` to get your project details

### Step 2: Set GitHub Secrets

Go to your GitHub repository → Settings → Secrets and Variables → Actions

Add these repository secrets:

```bash
# Required for Vercel deployment
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_org_id_here  
VERCEL_PROJECT_ID=your_project_id_here

# Optional: For Lighthouse CI performance testing
LHCI_GITHUB_APP_TOKEN=your_lighthouse_token_here
```

### How to Get Each Secret:

#### `VERCEL_TOKEN`
1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Create a new token with appropriate scopes
3. Copy the token value

#### `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`
1. Run `vercel link` in your project
2. Check the `.vercel/project.json` file that gets created
3. Use the `orgId` and `projectId` values

## 🔄 Deployment Flow

### For Pull Requests:
1. **Test** → Runs all tests and linting
2. **Deploy Preview** → Creates preview deployment on Vercel
3. **Comment** → Adds preview URL to PR comments

### For Main Branch:
1. **Test** → Runs all tests and linting  
2. **Deploy Production** → Deploys to production Vercel
3. **Health Check** → Verifies deployment and checks for console errors

## 🎯 Environment Variables Setup

The deployment workflow handles environment variables automatically, but you need to ensure they're set in Vercel:

### Required Vercel Environment Variables:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDuZNOmX8-0j2dry6f9Bf3fR5Qmyj_CsCA
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=draworld-6898f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=draworld-6898f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=draworld-6898f.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=814051215268
NEXT_PUBLIC_FIREBASE_APP_ID=1:814051215268:web:f251c9b76e9452ed1d6331

# API Configuration
NEXT_PUBLIC_RUNWARE_API_KEY=aNCXDzYXMuZQiFPzSFhpxnt5bGEy6o4F
NEXT_PUBLIC_APP_URL=https://draworld-opal.vercel.app
NEXT_PUBLIC_API_URL=https://draworld-opal.vercel.app/api

# Feature Flags
NEXT_PUBLIC_MOCK_PAYMENTS=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
```

### Set in Vercel Dashboard:
1. Go to your project in Vercel Dashboard
2. Settings → Environment Variables
3. Add each variable for **Production**, **Preview**, and **Development**

## 🔍 Monitoring & Health Checks

The deployment workflow includes automatic health checks:

### ✅ What Gets Checked:
- **HTTP Response**: Ensures site returns 200 status
- **Console Errors**: Detects JavaScript errors in browser
- **Build Success**: Verifies successful compilation
- **Environment Setup**: Validates required variables

### 🚨 Failure Handling:
- Failed deployments stop the workflow
- Console errors cause deployment to fail
- Health check failures trigger alerts

## 🎯 Manual Deployment Commands

If you need to deploy manually:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production  
vercel --prod

# With environment file
vercel --env .env.production --prod
```

## 📋 Troubleshooting

### Common Issues:

#### 1. **Secret Not Found**
- Ensure all required secrets are set in GitHub repository settings
- Check secret names match exactly (case-sensitive)

#### 2. **Vercel Authentication Failed**
- Verify VERCEL_TOKEN is valid and has correct permissions
- Check ORG_ID and PROJECT_ID match your Vercel project

#### 3. **Build Failures**
- Check environment variables are set in Vercel dashboard
- Verify all dependencies are included in package.json

#### 4. **Console Errors Detected**
- Review the specific errors in the GitHub Actions logs
- Common fixes are already applied in this deployment

### Getting Help:

1. Check GitHub Actions logs for detailed error messages
2. Review Vercel deployment logs in Vercel dashboard
3. Use the health check utility: `checkDraworldHealth()` in browser console

## 🎉 Benefits of This Setup

✅ **Automatic Deployments**: Push to main = instant production deploy  
✅ **Preview Deployments**: Every PR gets a preview URL  
✅ **Quality Gates**: Tests must pass before deployment  
✅ **Health Monitoring**: Automatic checks after deployment  
✅ **Error Detection**: Prevents deployments with console errors  
✅ **Rollback Ready**: Easy to revert if issues are detected  

## 📝 Next Steps

1. Set up the GitHub secrets as described above
2. Push these changes to trigger the first deployment
3. Monitor the GitHub Actions tab for deployment progress
4. Verify the production site has no console errors

The workflow is now ready to automatically deploy your fixed code to Vercel! 🚀