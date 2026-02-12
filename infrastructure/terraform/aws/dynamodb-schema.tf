/**
 * MigrationBox V5.0 - DynamoDB Schema Definition
 * 
 * CloudFormation/Terraform template for all DynamoDB tables required by the platform.
 * Tables: Workloads, Assessments, Migrations, Tenants, IntentSchemas, AgentTasks
 */

# ============================================================================
# Workloads Table
# ============================================================================
resource "aws_dynamodb_table" "workloads" {
  name           = "${var.app_name}-workloads-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "tenantId"
  range_key      = "workloadId"

  attribute {
    name = "tenantId"
    type = "S"
  }

  attribute {
    name = "workloadId"
    type = "S"
  }

  attribute {
    name = "discoveryId"
    type = "S"
  }

  attribute {
    name = "type"
    type = "S"
  }

  # GSI: Query workloads by discoveryId
  global_secondary_index {
    name            = "discoveryId-index"
    hash_key        = "discoveryId"
    range_key       = "workloadId"
    projection_type = "ALL"
  }

  # GSI: Query workloads by type
  global_secondary_index {
    name            = "type-index"
    hash_key        = "type"
    range_key       = "workloadId"
    projection_type = "ALL"
  }

  tags = {
    Name        = "${var.app_name}-workloads"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ============================================================================
# Assessments Table
# ============================================================================
resource "aws_dynamodb_table" "assessments" {
  name           = "${var.app_name}-assessments-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "tenantId"
  range_key      = "assessmentId"

  attribute {
    name = "tenantId"
    type = "S"
  }

  attribute {
    name = "assessmentId"
    type = "S"
  }

  attribute {
    name = "workloadId"
    type = "S"
  }

  attribute {
    name = "strategy"
    type = "S"
  }

  # GSI: Query assessments by workloadId
  global_secondary_index {
    name            = "workloadId-index"
    hash_key        = "workloadId"
    range_key       = "assessmentId"
    projection_type = "ALL"
  }

  # GSI: Query assessments by strategy
  global_secondary_index {
    name            = "strategy-index"
    hash_key        = "strategy"
    range_key       = "assessmentId"
    projection_type = "ALL"
  }

  tags = {
    Name        = "${var.app_name}-assessments"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ============================================================================
# Migrations Table
# ============================================================================
resource "aws_dynamodb_table" "migrations" {
  name           = "${var.app_name}-migrations-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "tenantId"
  range_key      = "migrationId"

  attribute {
    name = "tenantId"
    type = "S"
  }

  attribute {
    name = "migrationId"
    type = "S"
  }

  attribute {
    name = "workloadId"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "sourceProvider"
    type = "S"
  }

  attribute {
    name = "targetProvider"
    type = "S"
  }

  # GSI: Query migrations by workloadId
  global_secondary_index {
    name            = "workloadId-index"
    hash_key        = "workloadId"
    range_key       = "migrationId"
    projection_type = "ALL"
  }

  # GSI: Query migrations by status
  global_secondary_index {
    name            = "status-index"
    hash_key        = "status"
    range_key       = "migrationId"
    projection_type = "ALL"
  }

  # GSI: Query migrations by provider pair
  global_secondary_index {
    name            = "provider-index"
    hash_key        = "sourceProvider"
    range_key       = "targetProvider"
    projection_type = "ALL"
  }

  tags = {
    Name        = "${var.app_name}-migrations"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ============================================================================
# Tenants Table
# ============================================================================
resource "aws_dynamodb_table" "tenants" {
  name           = "${var.app_name}-tenants-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "tenantId"

  attribute {
    name = "tenantId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  # GSI: Query tenants by email (for authentication)
  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  tags = {
    Name        = "${var.app_name}-tenants"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ============================================================================
# IntentSchemas Table (I2I Pipeline)
# ============================================================================
resource "aws_dynamodb_table" "intent_schemas" {
  name           = "${var.app_name}-intent-schemas-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "tenantId"
  range_key      = "intentId"

  attribute {
    name = "tenantId"
    type = "S"
  }

  attribute {
    name = "intentId"
    type = "S"
  }

  attribute {
    name = "provider"
    type = "S"
  }

  # GSI: Query intents by provider
  global_secondary_index {
    name            = "provider-index"
    hash_key        = "provider"
    range_key       = "intentId"
    projection_type = "ALL"
  }

  tags = {
    Name        = "${var.app_name}-intent-schemas"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ============================================================================
# AgentTasks Table (Agentic AI Orchestration)
# ============================================================================
resource "aws_dynamodb_table" "agent_tasks" {
  name           = "${var.app_name}-agent-tasks-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "tenantId"
  range_key      = "taskId"

  attribute {
    name = "tenantId"
    type = "S"
  }

  attribute {
    name = "taskId"
    type = "S"
  }

  attribute {
    name = "agentType"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "migrationId"
    type = "S"
  }

  # GSI: Query tasks by agentType
  global_secondary_index {
    name            = "agentType-index"
    hash_key        = "agentType"
    range_key       = "taskId"
    projection_type = "ALL"
  }

  # GSI: Query tasks by status
  global_secondary_index {
    name            = "status-index"
    hash_key        = "status"
    range_key       = "taskId"
    projection_type = "ALL"
  }

  # GSI: Query tasks by migrationId
  global_secondary_index {
    name            = "migrationId-index"
    hash_key        = "migrationId"
    range_key       = "taskId"
    projection_type = "ALL"
  }

  # TTL for automatic cleanup of completed tasks older than 30 days
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Name        = "${var.app_name}-agent-tasks"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
