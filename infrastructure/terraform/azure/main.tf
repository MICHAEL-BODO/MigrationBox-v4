# MigrationBox V4.1 - Azure Infrastructure

terraform {
  required_version = ">= 1.6"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

resource "azurerm_resource_group" "main" {
  name     = "rg-migrationbox-${var.environment}"
  location = var.azure_region
  tags = {
    Project     = "MigrationBox"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Azure AD B2C is configured via Azure Portal (not Terraform-manageable for full setup)
# TODO: Document manual B2C setup steps in runbook

# Cosmos DB Account (multi-region, serverless)
resource "azurerm_cosmosdb_account" "main" {
  name                = "migrationbox-cosmos-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  capabilities {
    name = "EnableServerless"
  }

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = azurerm_resource_group.main.location
    failover_priority = 0
  }
}

# Azure Service Bus Namespace
resource "azurerm_servicebus_namespace" "main" {
  name                = "migrationbox-sb-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = var.environment == "production" ? "Standard" : "Basic"
}

# Azure Storage Account
resource "azurerm_storage_account" "main" {
  name                     = "mbxstorage${var.environment}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = var.environment == "production" ? "GRS" : "LRS"
  min_tls_version         = "TLS1_2"
}
