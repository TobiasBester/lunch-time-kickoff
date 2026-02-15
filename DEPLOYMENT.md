# Deployment Guide - Google Cloud Run

This guide will help you set up automated deployments to Google Cloud Run for both the frontend and backend.

## Overview

The project uses GitHub Actions to automatically deploy to Google Cloud Run when you push a version tag (e.g., `v1.0.0`).

- **Frontend**: Static Vue 3 app served by Nginx
- **Backend**: Node.js Express API
- **Platform**: Google Cloud Run (serverless containers)
- **Trigger**: Git tags matching `v*.*.*` pattern

## Prerequisites

1. **Google Cloud Account** (you already have this)
2. **GitHub repository access** (to add secrets)
3. **gcloud CLI** (optional, for manual testing)

## Setup Instructions

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Note your **Project ID** (you'll need this later)

### Step 2: Enable Required APIs

Run these commands in [Google Cloud Shell](https://console.cloud.google.com/cloudshell) or your local terminal with gcloud:

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### Step 3: Create Artifact Registry Repository

```bash
# Create a repository to store Docker images
gcloud artifacts repositories create lunch-time-kickoff \
  --repository-format=docker \
  --location=africa-south1 \
  --description="Docker repository for Lunch Time Kickoff"
```

### Step 4: Create Service Account

```bash
# Create a service account for deployments
gcloud iam service-accounts create github-pipeline \
  --display-name="GitHub Pipeline"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-pipeline@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-pipeline@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-pipeline@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-pipeline@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Create and download JSON key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-pipeline@${PROJECT_ID}.iam.gserviceaccount.com
```

This creates a file called `github-actions-key.json` - keep this secure!

### Step 5: Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these two secrets:

   **Secret 1: GCP_PROJECT_ID**
   - Name: `GCP_PROJECT_ID`
   - Value: Your Google Cloud project ID (e.g., `lunch-time-kickoff-123456`)

   **Secret 2: GCP_SA_KEY**
   - Name: `GCP_SA_KEY`
   - Value: The entire contents of `github-actions-key.json`
   - Copy the whole JSON file content, including the curly braces

### Step 6: Test the Deployment

Now you're ready to deploy! Create and push a version tag:

```bash
# Create a tag
git tag v0.1.0

# Push the tag to trigger deployment
git push origin v0.1.0
```

Watch the deployment progress in GitHub Actions:
- Go to your repository → **Actions** tab
- You should see the "Deploy to Google Cloud Run" workflow running

## Deployment Workflow

When you push a tag:

1. **CI checks run** (lint, typecheck, build)
2. **Docker images are built** for frontend and backend
3. **Images are pushed** to Google Artifact Registry
4. **Backend deploys first** to Cloud Run
5. **Frontend deploys second** (can connect to backend)
6. **URLs are output** in the workflow logs

## Cloud Run Configuration

### Backend
- **Memory**: 512Mi
- **CPU**: 1
- **Min instances**: 0 (scales to zero)
- **Max instances**: 10
- **Port**: 8080
- **Public access**: Yes (unauthenticated)

### Frontend
- **Memory**: 256Mi
- **CPU**: 1
- **Min instances**: 0 (scales to zero)
- **Max instances**: 5
- **Port**: 8080
- **Public access**: Yes (unauthenticated)

## Viewing Your Deployments

After deployment completes:

```bash
# Get service URLs
gcloud run services list --platform managed --region africa-south1
```

Or visit the [Cloud Run console](https://console.cloud.google.com/run).

## Cost Estimates

Google Cloud Run free tier includes:
- **2 million requests** per month
- **360,000 GB-seconds** of compute time
- **180,000 vCPU-seconds** of compute time
- **1 GB network egress** per month

With the current configuration (scales to zero), you should stay well within the free tier for development and testing.

## Local Testing

Test the Docker images locally before deploying:

```bash
# Build and test backend
docker build -f packages/backend/Dockerfile -t backend-test .
docker run -p 3001:8080 backend-test

# Build and test frontend
docker build -f packages/frontend/Dockerfile -t frontend-test .
docker run -p 8080:8080 frontend-test
```

## Troubleshooting

### Deployment fails with "permission denied"
- Check that all IAM roles are assigned to the service account
- Verify the `GCP_SA_KEY` secret is correct

### Images fail to push
- Ensure Artifact Registry API is enabled
- Verify the repository exists: `gcloud artifacts repositories list`

### Service won't start
- Check logs: `gcloud run services logs read SERVICE_NAME --region africa-south1`
- Verify Dockerfile builds locally first

### Port binding errors
- Cloud Run injects `PORT` environment variable (8080)
- Ensure your app listens on `process.env.PORT`

## Manual Deployment (if needed)

You can deploy manually using gcloud:

```bash
# Deploy backend
gcloud run deploy lunch-time-kickoff-backend \
  --source packages/backend \
  --region africa-south1 \
  --allow-unauthenticated

# Deploy frontend
gcloud run deploy lunch-time-kickoff-frontend \
  --source packages/frontend \
  --region africa-south1 \
  --allow-unauthenticated
```

## Updating Environment Variables

Add environment variables to Cloud Run services:

```bash
gcloud run services update lunch-time-kickoff-backend \
  --region africa-south1 \
  --set-env-vars "DATABASE_URL=xxx,API_KEY=yyy"
```

Or update via the [Cloud Run Console](https://console.cloud.google.com/run).

## Next Steps

- [ ] Set up custom domain names
- [ ] Configure Cloud SQL for PostgreSQL
- [ ] Add Cloud Memorystore for Redis
- [ ] Set up monitoring with Cloud Logging
- [ ] Configure environment-specific settings
- [ ] Add secrets management with Secret Manager
- [ ] Set up Cloud CDN for frontend
