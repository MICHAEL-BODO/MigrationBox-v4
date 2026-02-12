variable "azure_region" {
  description = "Azure region for deployment"
  type        = string
  default     = "westeurope"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
  sensitive   = true
}
