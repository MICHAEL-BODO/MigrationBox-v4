#!/bin/bash
# MigrationBox V4.1 - LocalStack Bootstrap Script
# This script runs when LocalStack is ready (placed in /etc/localstack/init/ready.d/)

set -e
echo "=== MigrationBox LocalStack Bootstrap ==="

ENDPOINT="http://localhost:4566"
STAGE="${STAGE:-local}"

echo "Creating DynamoDB tables..."

aws --endpoint-url=$ENDPOINT dynamodb create-table \
  --table-name migrationbox-workloads-$STAGE \
  --attribute-definitions \
    AttributeName=tenantId,AttributeType=S \
    AttributeName=workloadId,AttributeType=S \
  --key-schema \
    AttributeName=tenantId,KeyType=HASH \
    AttributeName=workloadId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  2>/dev/null || echo "Table migrationbox-workloads already exists"

aws --endpoint-url=$ENDPOINT dynamodb create-table \
  --table-name migrationbox-assessments-$STAGE \
  --attribute-definitions \
    AttributeName=tenantId,AttributeType=S \
    AttributeName=assessmentId,AttributeType=S \
  --key-schema \
    AttributeName=tenantId,KeyType=HASH \
    AttributeName=assessmentId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  2>/dev/null || echo "Table migrationbox-assessments already exists"

aws --endpoint-url=$ENDPOINT dynamodb create-table \
  --table-name migrationbox-migrations-$STAGE \
  --attribute-definitions \
    AttributeName=tenantId,AttributeType=S \
    AttributeName=migrationId,AttributeType=S \
  --key-schema \
    AttributeName=tenantId,KeyType=HASH \
    AttributeName=migrationId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  2>/dev/null || echo "Table migrationbox-migrations already exists"

aws --endpoint-url=$ENDPOINT dynamodb create-table \
  --table-name migrationbox-transfers-$STAGE \
  --attribute-definitions \
    AttributeName=tenantId,AttributeType=S \
    AttributeName=transferId,AttributeType=S \
  --key-schema \
    AttributeName=tenantId,KeyType=HASH \
    AttributeName=transferId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  2>/dev/null || echo "Table migrationbox-transfers already exists"

echo "Creating S3 buckets..."
aws --endpoint-url=$ENDPOINT s3 mb s3://migrationbox-transfers-$STAGE 2>/dev/null || echo "Bucket already exists"
aws --endpoint-url=$ENDPOINT s3 mb s3://migrationbox-artifacts-$STAGE 2>/dev/null || echo "Bucket already exists"

echo "Creating SQS queues..."
aws --endpoint-url=$ENDPOINT sqs create-queue --queue-name migrationbox-discovery-$STAGE 2>/dev/null || echo "Queue already exists"
aws --endpoint-url=$ENDPOINT sqs create-queue --queue-name migrationbox-discovery-dlq-$STAGE 2>/dev/null || echo "DLQ already exists"

echo "Creating EventBridge event bus..."
aws --endpoint-url=$ENDPOINT events create-event-bus --name migrationbox-events-$STAGE 2>/dev/null || echo "Event bus already exists"

echo "=== LocalStack Bootstrap Complete ==="
aws --endpoint-url=$ENDPOINT dynamodb list-tables
aws --endpoint-url=$ENDPOINT s3 ls
echo "=== Ready for development ==="
