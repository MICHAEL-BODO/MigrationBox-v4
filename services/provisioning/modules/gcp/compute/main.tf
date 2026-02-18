variable "project_id" {
  type = string
}

variable "zone" {
  type = string
}

variable "instances" {
  description = "List of instances to create"
  type = list(object({
    name         = string
    machine_type = string
    image        = optional(string, "projects/debian-cloud/global/images/family/debian-11")
    boot_disk    = optional(object({
      size_gb = number
      type    = optional(string, "pd-balanced")
    }))
    network      = string
    subnetwork   = string
    tags         = optional(list(string), [])
    metadata     = optional(map(string), {})
  }))
}

resource "google_compute_instance" "vm" {
  for_each     = { for inst in var.instances : inst.name => inst }
  name         = each.value.name
  machine_type = each.value.machine_type
  zone         = var.zone
  project      = var.project_id

  boot_disk {
    initialize_params {
      image = each.value.image
      size  = try(each.value.boot_disk.size_gb, 20)
      type  = try(each.value.boot_disk.type, "pd-balanced")
    }
  }

  network_interface {
    network    = each.value.network
    subnetwork = each.value.subnetwork
    
    // Minimal public IP support - prefer private via NAT/IAP
    access_config {
      // Ephemeral public IP if needed
    }
  }

  tags = each.value.tags

  metadata = merge(
    each.value.metadata,
    {
      enable-oslogin = "TRUE"
    }
  )

  service_account {
    scopes = ["cloud-platform"]
  }

  allow_stopping_for_update = true
}
