# MigrationBox V4.1 - Deployment Guide

**Version**: 4.1.0  
**Last Updated**: February 12, 2026  
**Audience**: DevOps Engineers, System Administrators

---

## Overview

This guide covers deploying MigrationBox to all environments: local (LocalStack), development (AWS sandbox), staging, and production.

---

## Prerequisites

### Required Tools
- Node.js 20+ and npm
- Python 3.11+
- Docker Desktop (for LocalStack)
- AWS CLI v2 configured
- Serverless Framework V4: `npm install -g serverless`
- Terraform 1.6+

### Required Accounts
- AWS account with admin access
- Azure subscription (optional for multi-cloud)
- GCP project (optional for multi-cloud)
- GitHub account (CI/CD)

---

## Local Development Setup (LocalStack)

### 1. Start LocalStack

```bash
cd infrastructure/docker
docker compose -f docker-compose.localstack.yml up -d
```

### 2. Verify Health

```bash
curl http://localhost:4566/_localstack/health
```

Expected: All services show `"available"`

### 3. Set Environment Variables

```bash
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
```

### 4. Deploy Services

```bash
# Deploy all services
serverless deploy --stage local

# Or deploy individual service
cd services/discovery
serverless deploy --stage local
```

### 5. Create DynamoDB Tables

```bash
# Run setup script
./scripts/setup-localstack.sh
```

### 6. Seed Test Data

```bash
npm run seed-test-data
```

---

## Development Deployment (AWS Sandbox)

### 1. Configure AWS Credentials

```bash
aws configure --profile migrationhub-dev
```

### 2. Set Environment Variables

```bash
export AWS_PROFILE=migrationhub-dev
export STAGE=dev
```

### 3. Deploy Infrastructure (Terraform)

```bash
cd infrastructure/terraform/aws
terraform init
terraform plan -var-file=dev.tfvars
terraform apply -var-file=dev.tfvars
```

### 4. Deploy Services

```bash
serverless deploy --stage dev --aws-profile migrationhub-dev
```

### 5. Run Integration Tests

```bash
npm run test:integration -- --env=dev
```

---

## Staging Deployment

### 1. Merge to Main Branch

```bash
git checkout main
git merge develop
git push origin main
```

### 2. Automated Deployment (GitHub Actions)

- CI/CD pipeline automatically triggers
- Runs all tests
- Deploys to staging if tests pass

### 3. Manual Deployment (if needed)

```bash
serverless deploy --stage staging --aws-profile migrationhub-staging
```

### 4. Smoke Tests

```bash
npm run test:smoke -- --env=staging
```

---

## Production Deployment

### 1. Create Production Release

```bash
git tag -a v4.1.0 -m "Production release 4.1.0"
git push origin v4.1.0
```

### 2. Manual Approval Required

- Navigate to GitHub Actions
- Approve production deployment workflow
- Confirm deployment with PM approval

### 3. Blue/Green Deployment

```bash
# Deploy to "green" alias
serverless deploy --stage production --alias green

# Run validation tests against green
npm run test:smoke -- --env=production --alias=green

# Shift traffic to green (canary: 10%)
serverless deploy function --stage production --alias green --canary-traffic 0.1

# Monitor for 30 minutes, then shift 100%
serverless deploy function --stage production --alias green --canary-traffic 1.0
```

### 4. Post-Deployment Validation

```bash
# Run full validation suite
npm run test:validation -- --env=production

# Verify monitoring dashboards
# Check CloudWatch alarms
# Review error rates
```

---

## Rollback Procedures

### Immediate Rollback (< 5 minutes)

```bash
# Shift traffic back to blue alias
serverless deploy function --stage production --alias blue --canary-traffic 1.0
```

### Full Rollback to Previous Version

```bash
# Checkout previous tag
git checkout v4.0.9

# Deploy previous version
serverless deploy --stage production
```

---

## Multi-Cloud Deployment

### Azure Deployment

```bash
# Deploy to Azure
serverless deploy --stage production --provider azure

# Configure Azure-specific environment
export AZURE_SUBSCRIPTION_ID=xxx
export AZURE_TENANT_ID=yyy
```

### GCP Deployment

```bash
# Deploy to GCP
serverless deploy --stage production --provider gcp

# Configure GCP-specific environment
export GCP_PROJECT_ID=migrationhub-prod
export GCP_REGION=us-central1
```

---

## Environment Variables

### Common Variables (All Environments)

```bash
# AWS
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=123456789012

# Database
export DYNAMODB_TABLE_PREFIX=migrationhub-${STAGE}

# API
export API_BASE_URL=https://api-${STAGE}.migrationhub.io

# Temporal
export TEMPORAL_HOST=temporal.migrationhub.io
export TEMPORAL_NAMESPACE=migrationhub-${STAGE}
```

### Secrets (Stored in AWS Secrets Manager)

```bash
# Bedrock API
bedrock_api_key

# Temporal
temporal_api_key

# Third-party integrations
stripe_api_key
datadog_api_key
```

---

## Monitoring Setup

### CloudWatch Dashboards

```bash
# Create dashboards
aws cloudwatch put-dashboard --dashboard-name MigrationHub-${STAGE} \
  --dashboard-body file://monitoring/cloudwatch-dashboard.json
```

### Alarms

```bash
# Create alarms
aws cloudwatch put-metric-alarm --alarm-name high-error-rate \
  --metric-name Errors --namespace AWS/Lambda \
  --threshold 10 --comparison-operator GreaterThanThreshold
```

### Grafana Integration

```bash
# Import Grafana dashboard
curl -X POST http://grafana.migrationhub.io/api/dashboards/import \
  -H "Authorization: Bearer ${GRAFANA_API_KEY}" \
  -d @monitoring/grafana-dashboard.json
```

---

## Troubleshooting Deployment Issues

### Issue: Lambda Deploy Fails

**Symptom**: `serverless deploy` fails with permission error

**Solution**:
```bash
# Verify IAM permissions
aws iam get-user
aws iam list-attached-user-policies --user-name your-user

# Ensure you have:
# - lambda:CreateFunction
# - lambda:UpdateFunctionCode
# - iam:PassRole
```

### Issue: LocalStack Connection Refused

**Symptom**: `Connection refused to localhost:4566`

**Solution**:
```bash
# Restart LocalStack
docker compose down
docker compose -f docker-compose.localstack.yml up -d

# Wait 30 seconds for full startup
sleep 30

# Verify health
curl http://localhost:4566/_localstack/health
```

### Issue: DynamoDB Table Not Found

**Symptom**: `ResourceNotFoundException: Table not found`

**Solution**:
```bash
# Re-run table creation
./scripts/setup-localstack.sh

# Or manually create table
aws --endpoint-url=http://localhost:4566 dynamodb create-table \
  --table-name migrationhub-workloads \
  --attribute-definitions AttributeName=workloadId,AttributeType=S \
  --key-schema AttributeName=workloadId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests pass locally
- [ ] Code review approved
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json

### Deployment
- [ ] Deploy to staging first
- [ ] Run smoke tests on staging
- [ ] Obtain approval for production
- [ ] Deploy to production (blue/green)
- [ ] Shift 10% traffic (canary)
- [ ] Monitor for 30 minutes
- [ ] Shift 100% traffic

### Post-Deployment
- [ ] Verify monitoring dashboards
- [ ] Check error rates < 1%
- [ ] Validate API endpoints
- [ ] Test critical user flows
- [ ] Notify team in Slack

---

## Deployment Schedule

| Environment | Deployment Window | Frequency |
|-------------|------------------|-----------|
| Local | Anytime | Continuous |
| Development | Mon-Fri 9am-5pm ET | On commit |
| Staging | Mon-Thu 2pm-6pm ET | Daily |
| Production | Tue/Thu 2am-4am ET | Weekly |

---

**Document Owner**: DevOps Team  
**Emergency Contact**: devops@migrationhub.io  
**Next Review**: March 12, 2026