output "firestore_name" {
  value = google_firestore_database.main.name
}

output "storage_bucket" {
  value = google_storage_bucket.transfers.name
}

output "pubsub_topic" {
  value = google_pubsub_topic.events.name
}

output "functions_sa_email" {
  value = google_service_account.functions.email
}
