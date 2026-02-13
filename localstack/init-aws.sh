#!/bin/bash
# MigrationBox V5.0 - LocalStack Initialization Script
# Creates all required AWS resources on LocalStack startup
# Version: 2.0.0 | Updated: 2026-02-12

echo "================================================"
echo " MigrationBox V5.0 - Initializing LocalStack"
echo "================================================"

REGION="us-east-1"
APP="migrationbox"
ENV="dev"

# ---- S3 Buckets ----
echo "[1/7] Creating S3 Buckets..."
awslocal s3 mb s3://${APP}-workloads-${ENV}
awslocal s3 mb s3://${APP}-artifacts-${ENV}
awslocal s3 mb s3://${APP}-reports-${ENV}
awslocal s3 mb s3://${APP}-backups-${ENV}
awslocal s3 mb s3://${APP}-data-transfer-${ENV}
awslocal s3 mb s3://mlflow-artifacts

# ---- DynamoDB Tables (6 tables matching dynamodb-schema.tf) ----
echo "[2/7] Creating DynamoDB Tables..."

# 1. Workloads Table (tenantId + workloadId, GSI: discoveryId, type)
awslocal dynamodb create-table \
  --table-name ${APP}-workloads-${ENV} \
  --attribute-definitions \
    AttributeName=tenantId,AttributeType=S \
    AttributeName=workloadId,AttributeType=S \
    AttributeName=discoveryId,AttributeType=S \
    AttributeName=type,AttributeType=S \
  --key-schema \
    AttributeName=tenantId,KeyType=HASH \
    AttributeName=workloadId,KeyType=RANGE \
  --global-secondary-indexes \
    "[
      {\"IndexName\":\"discoveryId-index\",\"KeySchema\":[{\"AttributeName\":\"discoveryId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"workloadId\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}},
      {\"IndexName\":\"type-index\",\"KeySchema\":[{\"AttributeName\":\"type\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"workloadId\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}
    ]" \
  --billing-mode PAY_PER_REQUEST

# 2. Assessments Table (tenantId + assessmentId, GSI: workloadId, strategy)
awslocal dynamodb create-table \
  --table-name ${APP}-assessments-${ENV} \
  --attribute-definitions \
    AttributeName=tenantId,AttributeType=S \
    AttributeName=assessmentId,AttributeType=S \
    AttributeName=workloadId,AttributeType=S \
    AttributeName=strategy,AttributeType=S \
  --key-schema \
    AttributeName=tenantId,KeyType=HASH \
    AttributeName=assessmentId,KeyType=RANGE \
  --global-secondary-indexes \
    "[
      {\"IndexName\":\"workloadId-index\",\"KeySchema\":[{\"AttributeName\":\"workloadId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"assessmentId\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}},
      {\"IndexName\":\"strategy-index\",\"KeySchema\":[{\"AttributeName\":\"strategy\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"assessmentId\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}
    ]" \
  --billing-mode PAY_PER_REQUEST

# 3. Migrations Table (tenantId + migrationId, GSI: workloadId, status, provider)
awslocal dynamodb create-table \
  --table-name ${APP}-migrations-${ENV} \
  --attribute-definitions \
    AttributeName=tenantId,AttributeType=S \
    AttributeName=migrationId,AttributeType=S \
    AttributeName=workloadId,AttributeType=S \
    AttributeName=status,AttributeType=S \
    AttributeName=sourceProvider,AttributeType=S \
    AttributeName=targetProvider,AttributeType=S \
  --key-schema \
    AttributeName=tenantId,KeyType=HASH \
    AttributeName=migrationId,KeyType=RANGE \
  --global-secondary-indexes \
    "[
      {\"IndexName\":\"workloadId-index\",\"KeySchema\":[{\"AttributeName\":\"workloadId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"migrationId\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}},
      {\"IndexName\":\"status-index\",\"KeySchema\":[{\"AttributeName\":\"status\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"migrationId\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}},
      {\"IndexName\":\"provider-index\",\"KeySchema\":[{\"AttributeName\":\"sourceProvider\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"targetProvider\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}
    ]" \
  --billing-mode PAY_PER_REQUEST

# 4. Tenants Table (tenantId, GSI: email)
awslocal dynamodb create-table \
  --table-name ${APP}-tenants-${ENV} \
  --attribute-definitions \
    AttributeName=tenantId,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema \
    AttributeName=tenantId,KeyType=HASH \
  --global-secondary-indexes \
    "[
      {\"IndexName\":\"email-index\",\"KeySchema\":[{\"AttributeName\":\"email\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}
    ]" \
  --billing-mode PAY_PER_REQUEST

# 5. IntentSchemas Table (tenantId + intentId, GSI: provider)
awslocal dynamodb create-table \
  --table-name ${APP}-intent-schemas-${ENV} \
  --attribute-definitions \
    AttributeName=tenantId,AttributeType=S \
    AttributeName=intentId,AttributeType=S \
    AttributeName=provider,AttributeType=S \
  --key-schema \
    AttributeName=tenantId,KeyType=HASH \
    AttributeName=intentId,KeyType=RANGE \
  --global-secondary-indexes \
    "[
      {\"IndexName\":\"provider-index\",\"KeySchema\":[{\"AttributeName\":\"provider\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"intentId\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}
    ]" \
  --billing-mode PAY_PER_REQUEST

# 6. AgentTasks Table (tenantId + taskId, GSI: agentType, status, migrationId, TTL)
awslocal dynamodb create-table \
  --table-name ${APP}-agent-tasks-${ENV} \
  --attribute-definitions \
    AttributeName=tenantId,AttributeType=S \
    AttributeName=taskId,AttributeType=S \
    AttributeName=agentType,AttributeType=S \
    AttributeName=status,AttributeType=S \
    AttributeName=migrationId,AttributeType=S \
  --key-schema \
    AttributeName=tenantId,KeyType=HASH \
    AttributeName=taskId,KeyType=RANGE \
  --global-secondary-indexes \
    "[
      {\"IndexName\":\"agentType-index\",\"KeySchema\":[{\"AttributeName\":\"agentType\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"taskId\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}},
      {\"IndexName\":\"status-index\",\"KeySchema\":[{\"AttributeName\":\"status\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"taskId\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}},
      {\"IndexName\":\"migrationId-index\",\"KeySchema\":[{\"AttributeName\":\"migrationId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"taskId\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}
    ]" \
  --billing-mode PAY_PER_REQUEST

awslocal dynamodb update-time-to-live \
  --table-name ${APP}-agent-tasks-${ENV} \
  --time-to-live-specification "Enabled=true,AttributeName=ttl"

# 7. Discoveries Table (tenantId + discoveryId — tracks discovery jobs)
awslocal dynamodb create-table \
  --table-name ${APP}-discoveries-${ENV} \
  --attribute-definitions \
    AttributeName=tenantId,AttributeType=S \
    AttributeName=discoveryId,AttributeType=S \
    AttributeName=status,AttributeType=S \
  --key-schema \
    AttributeName=tenantId,KeyType=HASH \
    AttributeName=discoveryId,KeyType=RANGE \
  --global-secondary-indexes \
    "[
      {\"IndexName\":\"status-index\",\"KeySchema\":[{\"AttributeName\":\"status\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"discoveryId\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}
    ]" \
  --billing-mode PAY_PER_REQUEST

# ---- SQS Queues ----
echo "[3/7] Creating SQS Queues..."
awslocal sqs create-queue --queue-name ${APP}-discovery-queue-${ENV}
awslocal sqs create-queue --queue-name ${APP}-discovery-dlq-${ENV}
awslocal sqs create-queue --queue-name ${APP}-analysis-queue-${ENV}
awslocal sqs create-queue --queue-name ${APP}-migration-queue-${ENV}
awslocal sqs create-queue --queue-name ${APP}-validation-queue-${ENV}
awslocal sqs create-queue --queue-name ${APP}-dlq-${ENV}

# ---- SNS Topics ----
echo "[4/7] Creating SNS Topics..."
awslocal sns create-topic --name ${APP}-events-${ENV}
awslocal sns create-topic --name ${APP}-alerts-${ENV}

# ---- EventBridge ----
echo "[5/7] Creating EventBridge Event Bus..."
awslocal events create-event-bus --name ${APP}-events-${ENV}

# ---- Secrets Manager ----
echo "[6/7] Creating Secrets..."
awslocal secretsmanager create-secret \
  --name ${APP}/api-keys \
  --secret-string '{"claude_api_key":"test-key","azure_tenant_id":"test-tenant","gcp_project_id":"test-project"}'

# ---- Step Functions ----
echo "[7/7] Creating Step Functions State Machine..."
awslocal stepfunctions create-state-machine \
  --name ${APP}-discovery-workflow-${ENV} \
  --definition '{
    "Comment": "Discovery Workflow",
    "StartAt": "InitiateDiscovery",
    "States": {
      "InitiateDiscovery": {
        "Type": "Pass",
        "End": true
      }
    }
  }' \
  --role-arn "arn:aws:iam::000000000000:role/step-functions-role"

echo ""
echo "================================================"
echo " MigrationBox V5.0 LocalStack Init COMPLETE"
echo " Endpoint: http://localhost:4566"
echo " Region: $REGION"
echo " Tables: 7 | Buckets: 6 | Queues: 6"
echo "================================================"
echo ""
awslocal s3 ls
awslocal dynamodb list-tables
awslocal sqs list-queues
