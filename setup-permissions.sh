#!/bin/bash

# Add permissions for Cloud Build service account
gcloud projects add-iam-policy-binding quantum-beach-464611-e1 \
    --member="serviceAccount:323769274019@cloudbuild.gserviceaccount.com" \
    --role="roles/artifactregistry.writer"

# Add permissions for Compute Engine default service account (editor)
gcloud projects add-iam-policy-binding quantum-beach-464611-e1 \
    --member="serviceAccount:323769274019-compute@developer.gserviceaccount.com" \
    --role="roles/artifactregistry.writer"

# Verify the permissions
echo "Verifying permissions..."
gcloud projects get-iam-policy quantum-beach-464611-e1 --format="table(bindings.role,bindings.members)" --filter="bindings.role=roles/artifactregistry.writer"
