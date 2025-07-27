#!/bin/bash

# Set variables
PROJECT_ID="quantum-beach-464611-e1"
REGION="us-central1"
REPOSITORY_NAME="funstation-marshal"
SERVICE_NAME="funstation-marshal"
IMAGE_TAG="latest"

# Full image URL
IMAGE_URL="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY_NAME/app:$IMAGE_TAG"

echo "Deploying Funstation Marshal application..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Image: $IMAGE_URL"
echo ""

# Build and push the image
echo "Building and pushing Docker image..."
gcloud builds submit --tag $IMAGE_URL --project=$PROJECT_ID

if [ $? -ne 0 ]; then
    echo "Build failed. Exiting."
    exit 1
fi

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_URL \
    --region $REGION \
    --project $PROJECT_ID \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --set-env-vars NODE_ENV=production

if [ $? -eq 0 ]; then
    echo ""
    echo "Deployment successful!"
    echo "Your application is available at:"
    gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format='value(status.url)'
else
    echo "Deployment failed."
    exit 1
fi