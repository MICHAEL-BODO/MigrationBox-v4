# LocalStack Development Guide

## Overview

LocalStack emulates AWS cloud services locally in Docker, enabling free, fast development without touching real cloud accounts.

**Current Version**: 4.13.2.dev60 (Community Edition)
**Verified**: February 12, 2026

## Available Services

| Service | Port | Status | Notes |
|---------|------|--------|-------|
| S3 | 4566 | Available | Full object storage emulation |
| DynamoDB | 4566 | Available | Full table/item operations |
| Lambda | 4566 | Available | Docker-based execution |
| SQS | 4566 | Available | Standard + FIFO queues |
| SNS | 4566 | Available | Topics + subscriptions |
| Step Functions | 4566 | Available | State machine workflows |
| API Gateway | 4566 | Available | REST + HTTP APIs |
| EventBridge | 4566 | Available | Custom event buses |
| IAM | 4566 | Available | Roles + policies |
| STS | 4566 | Available | Token service |
| CloudWatch | 4566 | Available | Logs + metrics |
| Secrets Manager | 4566 | Available | Secret storage |
| KMS | 4566 | Available | Key management |
| Kinesis | 4566 | Available | Data streaming |

## Quick Start

```bash
# Start LocalStack
npm run localstack:up

# Verify health
npm run localstack:health

# Bootstrap tables and buckets
bash scripts/setup-localstack.sh
```

## AWS CLI Usage

All AWS CLI commands require `--endpoint-url` flag:

```bash
# Set as environment variable (recommended)
export AWS_ENDPOINT_URL=http://localhost:4566

# Or per-command
aws --endpoint-url=http://localhost:4566 s3 ls
```

## Common Operations

```bash
# List DynamoDB tables
aws --endpoint-url=$ENDPOINT dynamodb list-tables

# Put item
aws --endpoint-url=$ENDPOINT dynamodb put-item \
  --table-name migrationbox-workloads-local \
  --item '{"tenantId":{"S":"test"},"workloadId":{"S":"wl-001"}}'

# List S3 buckets
aws --endpoint-url=$ENDPOINT s3 ls

# Send SQS message
aws --endpoint-url=$ENDPOINT sqs send-message \
  --queue-url http://localhost:4566/000000000000/migrationbox-discovery-local \
  --message-body '{"test": true}'
```

## Resetting LocalStack

```bash
# Stop and remove all data
npm run localstack:down

# Start fresh
npm run localstack:up
bash scripts/setup-localstack.sh
```

## Limitations (Community Edition)

- No Azure emulation (requires Pro)
- No GCP emulation (requires Pro)
- Some advanced Lambda features may differ from production
- No persistence across restarts (unless using volume mounts)
- IAM enforcement is permissive (all actions allowed)

## Upgrading to LocalStack Pro

For Azure/GCP emulation, Chaos Engineering, and Cloud Pods:

```bash
# Set Pro API key
export LOCALSTACK_API_KEY=your-api-key

# Use Pro image
docker pull localstack/localstack-pro
```

Pro adds: Azure Storage, Azure SQL, Azure Key Vault, Azure AKS + 7 more Azure services.
