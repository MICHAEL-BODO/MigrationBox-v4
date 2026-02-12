output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "cosmosdb_endpoint" {
  value = azurerm_cosmosdb_account.main.endpoint
}

output "storage_account_name" {
  value = azurerm_storage_account.main.name
}

output "servicebus_namespace" {
  value = azurerm_servicebus_namespace.main.name
}
