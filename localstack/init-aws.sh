#!/bin/bash
# MigrationBox V4+ - LocalStack Initialization Script
# Creates all required AWS resources on LocalStack startup
# Version: 1.0.0 | Updated: 2026-02-12

echo "================================================"
echo " MigrationBox V4+ - Initializing LocalStack"
echo "================================================"

REGION="us-east-1"
ENDPOINT="http://localhost:4566"

# ---- S3 Buckets ----
echo "[1/6] Creating S3 Buckets..."
awslocal s3 mb s3://migrationhub-workloads-dev
awslocal s3 mb s3://migrationhub-artifacts-dev
awslocal s3 mb s3://migrationhub-reports-dev
awslocal s3 mb s3://migrationhub-backups-dev
awslocal s3 mb s3://migrationhub-data-transfer-dev

# ---- DynamoDB Tables ----
echo "[2/6] Creating DynamoDB Tables..."
awslocal dynamodb create-table \
  --table-name migrationhub-workloads-dev \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=tenantId,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes \
    "[{\"IndexName\":\"tenant-index\",\"KeySchema\":[{\"AttributeName\":\"tenantId\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
  --billing-mode PAY_PER_REQUEST

awslocal dynamodb create-table \
  --table-name migrationhub-migrations-dev \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=status,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes \
    "[{\"IndexName\":\"status-index\",\"KeySchema\":[{\"AttributeName\":\"status\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
  --billing-mode PAY_PER_REQUEST

awslocal dynamodb create-table \
  --table-name migrationhub-assessments-dev \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# ---- SQS Queues ----
echo "[3/6] Creating SQS Queues..."
awslocal sqs create-queue --queue-name migrationhub-discovery-queue-dev
awslocal sqs create-queue --queue-name migrationhub-analysis-queue-dev
awslocal sqs create-queue --queue-name migrationhub-migration-queue-dev
awslocal sqs create-queue --queue-name migrationhub-validation-queue-dev
awslocal sqs create-queue --queue-name migrationhub-dlq-dev

# ---- SNS Topics ----
echo "[4/6] Creating SNS Topics..."
awslocal sns create-topic --name migrationhub-events-dev
awslocal sns create-topic --name migrationhub-alerts-dev

# ---- EventBridge ----
echo "[5/6] Creating EventBridge Event Bus..."
awslocal events create-event-bus --name migrationhub-events-dev

# ---- Secrets Manager ----
echo "[6/6] Creating Secrets..."
awslocal secretsmanager create-secret \
  --name migrationhub/api-keys \
  --secret-string '{"claude_api_key":"test-key","azure_tenant_id":"test-tenant"}'

echo ""
echo "================================================"
echo " LocalStack Initialization COMPLETE"
echo " Endpoint: http://localhost:4566"
echo " Region: $REGION"
echo "================================================"
echo ""
awslocal s3 ls
awslocal dynamodb list-tables
awslocal sqs list-queues
