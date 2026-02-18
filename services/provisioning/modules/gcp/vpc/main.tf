variable "project_id" {
  description = "The ID of the project where this VPC will be created"
  type        = string
}

variable "network_name" {
  description = "The name of the VPC network being created"
  type        = string
}

variable "subnets" {
  description = "The list of subnets being created"
  type        = list(object({
    subnet_name           = string
    subnet_ip             = string
    subnet_region         = string
    private_ip_google_access = optional(bool, true)
  }))
}

resource "google_compute_network" "vpc_network" {
  name                    = var.network_name
  project                 = var.project_id
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
}

resource "google_compute_subnetwork" "subnets" {
  count         = length(var.subnets)
  name          = var.subnets[count.index].subnet_name
  ip_cidr_range = var.subnets[count.index].subnet_ip
  region        = var.subnets[count.index].subnet_region
  network       = google_compute_network.vpc_network.id
  project       = var.project_id
  private_ip_google_access = var.subnets[count.index].private_ip_google_access
}

resource "google_compute_firewall" "allow_internal" {
  name    = "${var.network_name}-allow-internal"
  network = google_compute_network.vpc_network.name
  project = var.project_id

  allow {
    protocol = "icmp"
  }
  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }
  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }
  source_ranges = [for s in var.subnets : s.subnet_ip]
}

resource "google_compute_firewall" "allow_ssh_iap" {
  name    = "${var.network_name}-allow-ssh-iap"
  network = google_compute_network.vpc_network.name
  project = var.project_id
  
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
  source_ranges = ["35.235.240.0/20"] # IAP range
}
