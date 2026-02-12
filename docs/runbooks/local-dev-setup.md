# Local Development Setup Guide

## Prerequisites

1. **Node.js 20+**: Download from https://nodejs.org
2. **Python 3.11+**: Download from https://python.org
3. **Docker Desktop**: Download from https://docker.com
4. **AWS CLI v2**: `msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi` (Windows)
5. **Serverless Framework V4**: `npm install -g serverless`
6. **Terraform 1.6+**: Download from https://terraform.io
7. **Git**: Download from https://git-scm.com

## Step 1: Clone Repository

```bash
git clone https://github.com/your-org/MigrationBox-v4.git
cd MigrationBox-v4
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Configure Environment

```bash
cp .env.example .env
# Edit .env with your local settings (defaults work for LocalStack)
```

## Step 4: Start LocalStack

```bash
npm run localstack:up
# Or directly:
docker compose -f infrastructure/docker/docker-compose.localstack.yml up -d
```

## Step 5: Verify LocalStack Health

```bash
npm run localstack:health
# Or:
curl http://localhost:4566/_localstack/health | jq
```

All services should show "available".

## Step 6: Create Local Tables

```bash
export AWS_ENDPOINT_URL=http://localhost:4566
aws dynamodb create-table --table-name migrationbox-workloads-local \
  --attribute-definitions AttributeName=tenantId,AttributeType=S AttributeName=workloadId,AttributeType=S \
  --key-schema AttributeName=tenantId,KeyType=HASH AttributeName=workloadId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

aws s3 mb s3://migrationbox-transfers-local
```

## Step 7: Deploy to LocalStack

```bash
serverless deploy --stage local
```

## Step 8: Run Tests

```bash
npm test
```

## Full Development Stack (Optional)

For Temporal.io, Grafana, and PostgreSQL:

```bash
npm run fullstack:up
# Temporal UI: http://localhost:8080
# Grafana: http://localhost:3001 (admin/admin)
# LocalStack: http://localhost:4566
```

## Troubleshooting

**Docker not running**: Start Docker Desktop application
**LocalStack unhealthy**: Check Docker logs: `docker logs localstack`
**Port conflicts**: Stop other services on ports 4566, 7233, 8080, 3001, 5432
**AWS CLI errors**: Ensure AWS_ENDPOINT_URL is set for local development
