# Neo4j Dependency Graph Schema - MigrationBox V5.0

## Overview

Neo4j is used for storing and querying workload dependency graphs. This enables complex dependency analysis, circular reference detection, and transitive dependency traversal that would be difficult with relational databases.

## Node Types

### Workload
Represents compute resources (EC2, VMs, Containers, Lambda, etc.)

**Properties**:
- `workloadId` (String, Unique) - Unique identifier
- `tenantId` (String) - Tenant identifier
- `discoveryId` (String) - Discovery job identifier
- `type` (String) - `compute`, `container`, `serverless`
- `provider` (String) - `aws`, `azure`, `gcp`
- `region` (String) - Region where workload exists
- `name` (String) - Workload name
- `status` (String) - Current status
- `metadata` (JSON) - Provider-specific metadata

### Database
Represents database resources (RDS, Cosmos DB, Cloud SQL, etc.)

**Properties**:
- `databaseId` (String, Unique) - Unique identifier
- `tenantId` (String) - Tenant identifier
- `discoveryId` (String) - Discovery job identifier
- `type` (String) - `relational`, `nosql`, `document`, `key-value`
- `provider` (String) - `aws`, `azure`, `gcp`
- `region` (String) - Region where database exists
- `name` (String) - Database name
- `engine` (String) - Database engine (MySQL, PostgreSQL, MongoDB, etc.)
- `metadata` (JSON) - Provider-specific metadata

### Network
Represents network resources (VPC, VNet, Subnet, Security Group, etc.)

**Properties**:
- `networkId` (String, Unique) - Unique identifier
- `tenantId` (String) - Tenant identifier
- `discoveryId` (String) - Discovery job identifier
- `type` (String) - `vpc`, `subnet`, `security-group`, `load-balancer`
- `provider` (String) - `aws`, `azure`, `gcp`
- `region` (String) - Region where network exists
- `name` (String) - Network name
- `cidr` (String) - CIDR block (for VPC/Subnet)
- `metadata` (JSON) - Provider-specific metadata

### MigrationPattern (CRDT Knowledge Network)
Represents anonymized migration patterns learned from previous migrations.

**Properties**:
- `patternId` (String, Unique) - Unique identifier
- `tenantId` (String) - `'global'` for shared patterns, tenantId for tenant-specific
- `patternType` (String) - Pattern classification
- `sourceProvider` (String) - Source cloud provider
- `targetProvider` (String) - Target cloud provider
- `workloadTypes` (Array) - Array of workload types this pattern applies to
- `strategy` (String) - Migration strategy used
- `successRate` (Float) - Success rate (0-1)
- `avgDurationWeeks` (Float) - Average duration in weeks
- `avgCostSavings` (Float) - Average cost savings percentage
- `anonymizedMetadata` (JSON) - Anonymized metadata (no PII)
- `createdAt` (String) - ISO timestamp
- `updatedAt` (String) - ISO timestamp

### Strategy
Represents migration strategies (6Rs).

**Properties**:
- `strategyName` (String, Unique) - `rehost`, `replatform`, `refactor`, `repurchase`, `retire`, `retain`
- `description` (String) - Strategy description

## Relationship Types

### DEPENDS_ON
Workload depends on another workload, database, or network resource.

**Properties**:
- `dependencyType` (String) - `direct`, `transitive`, `data`, `network`
- `strength` (String) - `strong`, `medium`, `weak`
- `discoveredAt` (String) - ISO timestamp

**Example**:
```cypher
(w1:Workload)-[:DEPENDS_ON {dependencyType: 'data', strength: 'strong'}]->(d1:Database)
```

### CONNECTED_TO
Network connectivity relationship.

**Properties**:
- `protocol` (String) - `tcp`, `udp`, `http`, `https`
- `port` (Integer) - Port number
- `direction` (String) - `inbound`, `outbound`

**Example**:
```cypher
(w1:Workload)-[:CONNECTED_TO {protocol: 'tcp', port: 5432}]->(d1:Database)
```

### IN_VPC
Resource is in a VPC/VNet.

**Example**:
```cypher
(w1:Workload)-[:IN_VPC]->(vpc1:Network)
```

### USES_PATTERN
Migration used a specific pattern.

**Properties**:
- `migrationId` (String) - Migration identifier
- `success` (Boolean) - Whether migration was successful
- `durationWeeks` (Float) - Actual duration

**Example**:
```cypher
(m:Migration)-[:USES_PATTERN]->(p:MigrationPattern)
```

### RECOMMENDS_STRATEGY
Assessment recommends a strategy.

**Properties**:
- `confidence` (Float) - Confidence score (0-1)
- `costProjection` (JSON) - Cost projection

**Example**:
```cypher
(a:Assessment)-[:RECOMMENDS_STRATEGY {confidence: 0.95}]->(s:Strategy)
```

## Common Queries

### Find all dependencies of a workload (transitive)
```cypher
MATCH (w:Workload {workloadId: 'wl-123'})-[:DEPENDS_ON*]->(dep)
RETURN w, dep
```

### Find circular dependencies
```cypher
MATCH path = (w:Workload)-[:DEPENDS_ON*]->(w)
RETURN path
```

### Find migration patterns for a provider pair
```cypher
MATCH (p:MigrationPattern)
WHERE p.sourceProvider = 'aws' AND p.targetProvider = 'azure' AND 'compute' IN p.workloadTypes
RETURN p
ORDER BY p.successRate DESC
```

### Calculate dependency depth
```cypher
MATCH path = (w:Workload {workloadId: 'wl-123'})-[:DEPENDS_ON*]->(dep)
RETURN w, dep, length(path) as depth
ORDER BY depth DESC
```

### Find all workloads in a VPC
```cypher
MATCH (vpc:Network {type: 'vpc', networkId: 'vpc-123'})<-[:IN_VPC]-(w:Workload)
RETURN w
```

## Indexes

- `workloadId` (Unique constraint)
- `databaseId` (Unique constraint)
- `networkId` (Unique constraint)
- `patternId` (Unique constraint)
- `tenantId` (Index on all node types)
- `discoveryId` (Index on Workload, Database, Network)
- `provider` (Index on Workload, Database, Network)
- `type` (Index on Workload)

## Setup

Run the `schema.cypher` script after Neo4j container is up:

```bash
docker exec -i migrationbox-neo4j cypher-shell -u neo4j -p localdev123 < infrastructure/neo4j/schema.cypher
```
