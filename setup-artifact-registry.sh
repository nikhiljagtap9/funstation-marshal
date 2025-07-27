#!/bin/bash

# Set variables
PROJECT_ID="quantum-beach-464611-e1"
REGION="us-central1"
REPOSITORY_NAME="funstation-marshal"

echo "Setting up Artifact Registry for project: $PROJECT_ID"

# Enable Artifact Registry API
echo "Enabling Artifact Registry API..."
gcloud services enable artifactregistry.googleapis.com --project=$PROJECT_ID

# Create Artifact Registry repository
echo "Creating Artifact Registry repository..."
gcloud artifacts repositories create $REPOSITORY_NAME \
    --repository-format=docker \
    --location=$REGION \
    --project=$PROJECT_ID \
    --description="Docker repository for Funstation Marshal application"

# Configure Docker authentication
echo "Configuring Docker authentication..."
gcloud auth configure-docker $REGION-docker.pkg.dev --project=$PROJECT_ID

# Add permissions for Cloud Build service account
echo "Adding permissions for Cloud Build..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')@cloudbuild.gserviceaccount.com" \
    --role="roles/artifactregistry.writer"

# Add permissions for your user account
echo "Adding permissions for your user account..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="user:$(gcloud config get-value account)" \
    --role="roles/artifactregistry.writer"

echo "Setup complete!"
echo ""
echo "Now you can build and push using:"
echo "gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY_NAME/app:latest"
echo ""
echo "Or deploy to Cloud Run using:"
echo "gcloud run deploy funstation-marshal --image $REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY_NAME/app:latest --region $REGION --project $PROJECT_ID"