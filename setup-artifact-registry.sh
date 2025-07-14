#!/bin/bash

PROJECT_ID="quantum-beach-464611-e1"

# Check if repository exists
if gcloud artifacts repositories describe funstation-marshal \
    --project=quantum-beach-464611-e1 \
    --location=asia-southeast1 >/dev/null 2>&1; then
    echo "Repository already exists, skipping creation..."
else
    echo "Creating repository..."
    gcloud artifacts repositories create funstation-marshal \
        --project=quantum-beach-464611-e1 \
        --repository-format=docker \
        --location=asia-southeast1 \
        --description="Funstation Marshal repository"
fi

# Update IAM policies
echo "Setting up IAM policies..."
gcloud artifacts repositories add-iam-policy-binding funstation-marshal \
    --project=quantum-beach-464611-e1 \
    --location=asia-southeast1 \
    --member="serviceAccount:323769274019@cloudbuild.gserviceaccount.com" \
    --role="roles/artifactregistry.writer"

gcloud artifacts repositories add-iam-policy-binding funstation-marshal \
    --project=quantum-beach-464611-e1 \
    --location=asia-southeast1 \
    --member="serviceAccount:323769274019-compute@developer.gserviceaccount.com" \
    --role="roles/artifactregistry.writer"

echo "Done! Repository permissions updated."
