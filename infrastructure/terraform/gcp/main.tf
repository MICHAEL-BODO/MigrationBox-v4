# MigrationBox V4.1 - GCP Infrastructure

terraform {
  required_version = ">= 1.6"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# Firestore Database
resource "google_firestore_database" "main" {
  project     = var.gcp_project_id
  name        = "(default)"
  location_id = var.gcp_region
  type        = "FIRESTORE_NATIVE"
}

# Cloud Storage Bucket
resource "google_storage_bucket" "transfers" {
  name     = "migrationbox-transfers-${var.environment}-${var.gcp_project_id}"
  location = var.gcp_region

  uniform_bucket_level_access = true
  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
}

# Pub/Sub Topic for events
resource "google_pubsub_topic" "events" {
  name = "migrationbox-events-${var.environment}"
}

# Cloud Functions service account
resource "google_service_account" "functions" {
  account_id   = "migrationbox-functions-${var.environment}"
  display_name = "MigrationBox Cloud Functions"
}
