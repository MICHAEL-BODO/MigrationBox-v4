variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "db_name" {
  type = string
}

variable "machine_type" {
  type    = string
  default = "db-f1-micro"
}

variable "disk_size" {
  type    = number
  default = 10
}

variable "ha_enabled" {
  type    = bool
  default = false
}

resource "google_sql_database_instance" "instance" {
  name             = var.db_name
  database_version = "POSTGRES_15"
  region           = var.region
  project          = var.project_id

  settings {
    tier = var.machine_type
    
    disk_size         = var.disk_size
    disk_autoresize   = true
    
    availability_type = var.ha_enabled ? "REGIONAL" : "ZONAL"

    backup_configuration {
      enabled    = true
      start_time = "04:00"
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = "projects/${var.project_id}/global/networks/default" # TODO: link to vpc module
    }
  }
}

resource "google_sql_database" "database" {
  name     = "migration-db"
  instance = google_sql_database_instance.instance.name
  project  = var.project_id
}

resource "google_sql_user" "users" {
  name     = "admin"
  instance = google_sql_database_instance.instance.name
  password = "changeme" # Should be random_password.result
  project  = var.project_id
}
