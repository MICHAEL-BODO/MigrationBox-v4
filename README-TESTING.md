# Testing Guide - MigrationBox V5.0

## Overview

This document describes the testing strategy for MigrationBox V5.0, including unit tests, integration tests, and end-to-end tests.

## Test Structure

```
tests/
├── unit/                    # Unit tests (mocked dependencies)
├── integration/
│   └── localstack/         # Integration tests with LocalStack
└── e2e/                     # End-to-end tests (future)
```

## Running Tests

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests (LocalStack)
```bash
# Start LocalStack first
npm run localstack:up

# Wait for LocalStack to be ready
npm run localstack:health

# Run integration tests
npm run test:integration
```

### All Tests
```bash
npm run test
```

## Test Coverage

### Unit Tests
- **Storage Adapters**: Mock AWS SDK, test adapter logic
- **Database Adapters**: Mock DynamoDB client, test query building
- **Messaging Adapters**: Mock SQS/SNS clients, test message handling

### Integration Tests
- **LocalStack**: Test against LocalStack emulation
  - S3 operations (create bucket, put/get/delete objects)
  - DynamoDB operations (put/get/query items)
  - SQS operations (send/receive/delete messages)

## Prerequisites

### LocalStack Setup
1. Install Docker Desktop
2. Start LocalStack:
   ```bash
   npm run localstack:up
   ```
3. Verify LocalStack is running:
   ```bash
   npm run localstack:health
   ```

### Environment Variables
Integration tests require:
```bash
AWS_ENDPOINT_URL=http://localhost:4566
AWS_DEFAULT_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
```

## Writing Tests

### Unit Test Example
```typescript
import { AWSS3Adapter } from '../../../libs/cloud-abstraction/storage/aws-s3-adapter';

jest.mock('@aws-sdk/client-s3');

describe('AWSS3Adapter', () => {
  it('should put an object', async () => {
    // Test implementation
  });
});
```

### Integration Test Example
```javascript
const { AWSS3Adapter } = require('../../../libs/cloud-abstraction/storage/aws-s3-adapter');

describe('Storage Adapter Integration Tests', () => {
  let adapter;

  beforeAll(() => {
    process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';
    adapter = new AWSS3Adapter();
  });

  it('should create a bucket', async () => {
    await adapter.createBucket('test-bucket');
  });
});
```

## Test Data Management

- Use unique bucket/table names with timestamps
- Clean up test data in `afterAll` hooks
- Use LocalStack for isolated testing (no real AWS resources)

## CI/CD Integration

Tests run automatically in GitHub Actions:
- Unit tests on every push
- Integration tests with LocalStack service
- Security scanning with Snyk

## Future Test Types

- **E2E Tests**: Full migration workflow tests
- **Performance Tests**: Load testing with k6
- **Chaos Tests**: Failure scenario testing
- **Contract Tests**: API contract validation
