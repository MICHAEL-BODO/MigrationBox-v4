# MigrationBox V4.1 - Troubleshooting Guide

**Version**: 4.1.0  
**Last Updated**: February 12, 2026  
**Audience**: Developers, DevOps, Support Engineers

---

## Common Issues & Solutions

### 1. LocalStack Issues

#### LocalStack Container Won't Start

**Symptoms:**
- `docker compose up -d` fails
- Container exits immediately
- Port 4566 already in use

**Solutions:**

```bash
# Check if port 4566 is in use
netstat -an | grep 4566

# Kill process using port
# Windows:
netstat -ano | findstr :4566
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:4566 | xargs kill -9

# Remove old containers
docker compose down
docker rm -f $(docker ps -aq --filter "name=localstack")

# Restart with fresh state
docker compose -f docker-compose.localstack.yml up -d
```

#### LocalStack Services Not Available

**Symptoms:**
- Health check shows services as "starting"
- API calls return connection errors

**Solutions:**

```bash
# Wait for full startup (30-60 seconds)
sleep 30

# Check logs
docker logs localstack

# Verify health
curl http://localhost:4566/_localstack/health

# If still failing, restart with debug logging
docker compose down
docker compose -f docker-compose.localstack.yml up -d --build
docker logs -f localstack
```

---

### 2. AWS Credential Issues

#### InvalidAccessKeyId Error

**Symptoms:**
- AWS SDK returns `InvalidAccessKeyId`
- CLI commands fail with auth error

**Solutions:**

```bash
# Verify credentials are set
aws configure list

# Test credentials
aws sts get-caller-identity

# If using profiles, ensure correct profile
export AWS_PROFILE=migrationhub-dev

# For LocalStack, use dummy credentials
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
```

#### AssumeRole Access Denied

**Symptoms:**
- `AccessDenied` when assuming role
- Trust relationship errors

**Solutions:**

```bash
# Verify trust policy
aws iam get-role --role-name MigrationHubDiscoveryRole

# Check if your identity is allowed to assume
aws sts get-caller-identity

# Test assume role
aws sts assume-role \
  --role-arn arn:aws:iam::123456789012:role/MigrationHubDiscoveryRole \
  --role-session-name test

# Fix trust policy if needed (add your account)
aws iam update-assume-role-policy \
  --role-name MigrationHubDiscoveryRole \
  --policy-document file://trust-policy.json
```

---

### 3. DynamoDB Issues

#### Table Not Found

**Symptoms:**
- `ResourceNotFoundException: Table not found`
- Lambda function fails with table error

**Solutions:**

```bash
# List tables
aws dynamodb list-tables --endpoint-url http://localhost:4566

# If missing, create table
aws --endpoint-url=http://localhost:4566 dynamodb create-table \
  --table-name migrationhub-workloads \
  --attribute-definitions \
    AttributeName=workloadId,AttributeType=S \
    AttributeName=tenantId,AttributeType=S \
  --key-schema \
    AttributeName=workloadId,KeyType=HASH \
  --global-secondary-indexes \
    "IndexName=TenantIndex,KeySchema=[{AttributeName=tenantId,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" \
  --billing-mode PAY_PER_REQUEST
```

#### Provisioned Throughput Exceeded

**Symptoms:**
- `ProvisionedThroughputExceededException`
- Writes/reads failing intermittently

**Solutions:**

```bash
# Check current capacity
aws dynamodb describe-table --table-name migrationhub-workloads

# Switch to on-demand billing
aws dynamodb update-table \
  --table-name migrationhub-workloads \
  --billing-mode PAY_PER_REQUEST

# Or increase provisioned capacity
aws dynamodb update-table \
  --table-name migrationhub-workloads \
  --provisioned-throughput ReadCapacityUnits=100,WriteCapacityUnits=100
```

---

### 4. Lambda Function Issues

#### Lambda Timeout

**Symptoms:**
- Function times out after 3 seconds (default)
- `Task timed out` in CloudWatch Logs

**Solutions:**

```bash
# Increase timeout in serverless.yml
functions:
  discoveryFunction:
    timeout: 300  # 5 minutes

# Redeploy
serverless deploy --stage local

# Or update directly
aws lambda update-function-configuration \
  --function-name migrationhub-discovery \
  --timeout 300
```

#### Lambda Out of Memory

**Symptoms:**
- `Runtime exited with error: signal: killed`
- Function fails with no error message

**Solutions:**

```bash
# Increase memory in serverless.yml
functions:
  discoveryFunction:
    memorySize: 1024  # 1GB (default is 1024MB)

# Redeploy
serverless deploy --stage local

# Or update directly
aws lambda update-function-configuration \
  --function-name migrationhub-discovery \
  --memory-size 1024
```

#### Cold Start Latency High

**Symptoms:**
- First request takes 3-5 seconds
- Subsequent requests fast (< 200ms)

**Solutions:**

```bash
# Enable provisioned concurrency (production only)
aws lambda put-provisioned-concurrency-config \
  --function-name migrationhub-discovery \
  --provisioned-concurrent-executions 2

# Or reduce package size
npm run build -- --minify
serverless deploy --stage production
```

---

### 5. Serverless Framework Issues

#### Serverless Deploy Fails

**Symptoms:**
- `serverless deploy` returns error
- CloudFormation stack fails

**Solutions:**

```bash
# Check serverless version
serverless --version  # Should be V4

# Verify AWS credentials
aws sts get-caller-identity

# Try verbose output
serverless deploy --verbose --stage local

# If CloudFormation fails, delete stack and retry
aws cloudformation delete-stack --stack-name migrationhub-local
serverless deploy --stage local
```

#### Service Name Conflict

**Symptoms:**
- `Service name already exists`
- Stack already exists error

**Solutions:**

```bash
# Use unique service name per stage
service: migrationhub-${self:provider.stage}

# Or remove existing stack
aws cloudformation delete-stack --stack-name migrationhub-local
serverless remove --stage local
serverless deploy --stage local
```

---

### 6. API Gateway Issues

#### CORS Errors

**Symptoms:**
- Browser console shows CORS error
- `Access-Control-Allow-Origin` missing

**Solutions:**

```yaml
# In serverless.yml, enable CORS
functions:
  api:
    events:
      - http:
          path: /discoveries
          method: post
          cors: true  # Enable CORS
```

```bash
# Redeploy
serverless deploy --stage local
```

#### 403 Forbidden (API Key Required)

**Symptoms:**
- API returns `Forbidden`
- Missing API key in request

**Solutions:**

```bash
# Get API key
aws apigateway get-api-keys --include-values

# Add to request header
curl -H "x-api-key: YOUR_API_KEY" \
  https://api.migrationhub.io/v1/discoveries
```

---

### 7. Temporal.io Issues

#### Workflow Stuck

**Symptoms:**
- Workflow status shows "running" for hours
- No progress in workflow history

**Solutions:**

```bash
# Check worker status
temporal workflow list --namespace migrationhub

# Restart worker
docker restart temporal-worker

# Cancel stuck workflow
temporal workflow cancel --workflow-id <workflow_id>

# Retry workflow
temporal workflow reset --workflow-id <workflow_id> \
  --reason "Manual restart"
```

#### Activity Timeout

**Symptoms:**
- Activity fails with timeout
- Workflow stuck waiting for activity

**Solutions:**

```go
// In workflow definition, increase timeout
workflow.ExecuteActivity(
  ctx,
  DiscoverWorkloads,
  workload,
  workflow.ActivityOptions{
    StartToCloseTimeout: 30 * time.Minute,  // Increase from default
    HeartbeatTimeout: 1 * time.Minute,
    RetryPolicy: &temporal.RetryPolicy{
      MaximumAttempts: 3,
    },
  },
)
```

---

### 8. Bedrock AI Issues

#### Model Access Denied

**Symptoms:**
- `AccessDeniedException` from Bedrock
- Cannot invoke model

**Solutions:**

```bash
# Check model access
aws bedrock list-foundation-models --region us-east-1

# Request model access in console
# AWS Console → Bedrock → Model Access → Request Access for Claude

# Verify IAM permissions
aws iam get-role-policy \
  --role-name MigrationHubLambdaRole \
  --policy-name BedrockPolicy
```

#### Token Limit Exceeded

**Symptoms:**
- `ValidationException: Input is too long`
- Bedrock returns token limit error

**Solutions:**

```typescript
// Truncate input before sending to Bedrock
const truncatedInput = workloadSummary.substring(0, 100000);  // ~75K tokens

// Or use streaming for large inputs
const response = await bedrockClient.send(
  new InvokeModelWithResponseStreamCommand({
    modelId: 'anthropic.claude-sonnet-4-5-v2:0',
    body: JSON.stringify({
      messages: [{ role: 'user', content: truncatedInput }],
      max_tokens: 4096
    })
  })
);
```

---

### 9. Discovery Service Issues

#### Incomplete Resource Discovery

**Symptoms:**
- Missing resources in discovery results
- Resource count lower than expected

**Solutions:**

```python
# Enable verbose logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Check rate limiting
# AWS: 5 requests/second default
# Azure: Varies by service
# GCP: 100 requests/100 seconds

# Increase pagination page size
paginator = ec2.get_paginator('describe_instances')
for page in paginator.paginate(PaginationConfig={'PageSize': 1000}):
    # Process page

# Verify permissions
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::123456789012:role/DiscoveryRole \
  --action-names ec2:DescribeInstances \
  --resource-arns "*"
```

#### Discovery Job Fails

**Symptoms:**
- Discovery status shows "failed"
- No error message in logs

**Solutions:**

```bash
# Check CloudWatch Logs
aws logs tail /aws/lambda/migrationhub-discovery --follow

# Check DLQ for failed messages
aws sqs receive-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/discovery-dlq

# Retry failed discovery
curl -X POST https://api.migrationhub.io/v1/discoveries \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"workloadId": "wl-123", "retry": true}'
```

---

### 10. Migration Issues

#### Migration Stuck in "In Progress"

**Symptoms:**
- Migration phase not advancing
- No activity in logs

**Solutions:**

```bash
# Check Temporal workflow
temporal workflow describe --workflow-id migration-wl-123

# Check Step Functions execution (AWS)
aws stepfunctions describe-execution \
  --execution-arn arn:aws:states:us-east-1:123456789012:execution:MigrationStateMachine:wl-123

# Force phase transition (emergency only)
aws dynamodb update-item \
  --table-name migrationhub-migrations \
  --key '{"migrationId": {"S": "mig-123"}}' \
  --update-expression "SET currentPhase = :phase" \
  --expression-attribute-values '{":phase": {"S": "cutover"}}'
```

#### Rollback Failed

**Symptoms:**
- Rollback triggered but failed
- Source environment not restored

**Solutions:**

```bash
# Check rollback status
curl https://api.migrationhub.io/v1/migrations/mig-123/rollback

# Manual rollback steps
1. Stop target environment
2. Restore source from backup
3. Redirect traffic to source
4. Mark migration as "rolled_back"

# Update migration status
aws dynamodb update-item \
  --table-name migrationhub-migrations \
  --key '{"migrationId": {"S": "mig-123"}}' \
  --update-expression "SET #status = :status" \
  --expression-attribute-names '{"#status": "status"}' \
  --expression-attribute-values '{":status": {"S": "rolled_back"}}'
```

---

## Debugging Techniques

### Enable Debug Logging

```bash
# Lambda environment variable
export LOG_LEVEL=DEBUG

# Serverless.yml
provider:
  environment:
    LOG_LEVEL: DEBUG

# Python logging
import logging
logging.basicConfig(level=logging.DEBUG)

# TypeScript logging
process.env.LOG_LEVEL = 'debug';
```

### CloudWatch Logs Insights Queries

```sql
-- Find errors in last hour
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100

-- Find slow Lambda invocations
fields @timestamp, @duration
| filter @duration > 5000
| sort @duration desc
| limit 20

-- Count errors by function
stats count() by functionName
| filter @message like /ERROR/
```

### Local Testing

```bash
# Invoke Lambda locally
serverless invoke local --function discovery \
  --data '{"workloadId": "test-123"}'

# Test with SAM
sam local invoke DiscoveryFunction \
  --event tests/events/discovery.json

# Debug with VS Code
# Add breakpoint, then F5 (launch.json configured)
```

---

## Emergency Procedures

### Production Outage

1. **Acknowledge incident** (Slack #incidents)
2. **Check dashboards** (Grafana, CloudWatch)
3. **Roll back if recent deploy** (`serverless deploy --alias blue`)
4. **Enable maintenance mode** (return 503 from API Gateway)
5. **Investigate root cause**
6. **Fix and deploy**
7. **Post-mortem** (within 48 hours)

### Data Loss Event

1. **Stop all writes immediately**
2. **Restore from latest backup**
   ```bash
   aws dynamodb restore-table-from-backup \
     --target-table-name migrationhub-workloads \
     --backup-arn <backup_arn>
   ```
3. **Verify data integrity**
4. **Resume operations**
5. **Incident report**

---

## Support Contacts

| Issue Type | Contact | SLA |
|------------|---------|-----|
| P0 (Outage) | devops@migrationhub.io, 555-0100 | 15 min |
| P1 (Critical) | support@migrationhub.io | 2 hours |
| P2 (High) | support@migrationhub.io | 8 hours |
| P3 (Normal) | support@migrationhub.io | 24 hours |

---

**Document Owner**: Support Engineering  
**Review Cadence**: After each major incident  
**Next Review**: March 12, 2026