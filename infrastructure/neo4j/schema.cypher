/**
 * MigrationBox V5.0 - Neo4j Dependency Graph Schema
 * 
 * Cypher script to create constraints, indexes, and initial schema for dependency mapping.
 * Run this script after Neo4j container is up.
 */

// ============================================================================
// Constraints
// ============================================================================

// Workload nodes must have unique workloadId
CREATE CONSTRAINT workload_id_unique IF NOT EXISTS
FOR (w:Workload) REQUIRE w.workloadId IS UNIQUE;

// Database nodes must have unique databaseId
CREATE CONSTRAINT database_id_unique IF NOT EXISTS
FOR (d:Database) REQUIRE d.databaseId IS UNIQUE;

// Network nodes must have unique networkId
CREATE CONSTRAINT network_id_unique IF NOT EXISTS
FOR (n:Network) REQUIRE n.networkId IS UNIQUE;

// MigrationPattern nodes must have unique patternId
CREATE CONSTRAINT pattern_id_unique IF NOT EXISTS
FOR (p:MigrationPattern) REQUIRE p.patternId IS UNIQUE;

// Strategy nodes must have unique strategyName
CREATE CONSTRAINT strategy_name_unique IF NOT EXISTS
FOR (s:Strategy) REQUIRE s.strategyName IS UNIQUE;

// ============================================================================
// Indexes
// ============================================================================

// Index on tenantId for all node types (for multi-tenancy)
CREATE INDEX workload_tenant_id IF NOT EXISTS
FOR (w:Workload) ON (w.tenantId);

CREATE INDEX database_tenant_id IF NOT EXISTS
FOR (d:Database) ON (d.tenantId);

CREATE INDEX network_tenant_id IF NOT EXISTS
FOR (n:Network) ON (n.tenantId);

CREATE INDEX pattern_tenant_id IF NOT EXISTS
FOR (p:MigrationPattern) ON (p.tenantId);

// Index on discoveryId for querying by discovery job
CREATE INDEX workload_discovery_id IF NOT EXISTS
FOR (w:Workload) ON (w.discoveryId);

CREATE INDEX database_discovery_id IF NOT EXISTS
FOR (d:Database) ON (d.discoveryId);

CREATE INDEX network_discovery_id IF NOT EXISTS
FOR (n:Network) ON (n.discoveryId);

// Index on provider for cross-cloud queries
CREATE INDEX workload_provider IF NOT EXISTS
FOR (w:Workload) ON (w.provider);

CREATE INDEX database_provider IF NOT EXISTS
FOR (d:Database) ON (d.provider);

CREATE INDEX network_provider IF NOT EXISTS
FOR (n:Network) ON (n.provider);

// Index on type for workload type queries
CREATE INDEX workload_type IF NOT EXISTS
FOR (w:Workload) ON (w.type);

// ============================================================================
// Node Types
// ============================================================================

/**
 * Workload Node
 * Represents a compute resource (EC2, VM, Container, Lambda, etc.)
 * 
 * Properties:
 * - workloadId: Unique identifier
 * - tenantId: Tenant identifier
 * - discoveryId: Discovery job identifier
 * - type: compute, container, serverless
 * - provider: aws, azure, gcp
 * - region: Region where workload exists
 * - name: Workload name
 * - status: Current status
 * - metadata: Provider-specific metadata (JSON)
 */
// Example: CREATE (w:Workload {workloadId: 'wl-123', tenantId: 't1', type: 'compute', provider: 'aws'})

/**
 * Database Node
 * Represents a database resource (RDS, Cosmos DB, Cloud SQL, etc.)
 * 
 * Properties:
 * - databaseId: Unique identifier
 * - tenantId: Tenant identifier
 * - discoveryId: Discovery job identifier
 * - type: relational, nosql, document, key-value
 * - provider: aws, azure, gcp
 * - region: Region where database exists
 * - name: Database name
 * - engine: Database engine (MySQL, PostgreSQL, MongoDB, etc.)
 * - metadata: Provider-specific metadata (JSON)
 */
// Example: CREATE (d:Database {databaseId: 'db-123', tenantId: 't1', type: 'relational', engine: 'PostgreSQL'})

/**
 * Network Node
 * Represents a network resource (VPC, VNet, Subnet, Security Group, etc.)
 * 
 * Properties:
 * - networkId: Unique identifier
 * - tenantId: Tenant identifier
 * - discoveryId: Discovery job identifier
 * - type: vpc, subnet, security-group, load-balancer
 * - provider: aws, azure, gcp
 * - region: Region where network exists
 * - name: Network name
 * - cidr: CIDR block (for VPC/Subnet)
 * - metadata: Provider-specific metadata (JSON)
 */
// Example: CREATE (n:Network {networkId: 'net-123', tenantId: 't1', type: 'vpc', cidr: '10.0.0.0/16'})

/**
 * MigrationPattern Node (CRDT Knowledge Network)
 * Represents an anonymized migration pattern learned from previous migrations
 * 
 * Properties:
 * - patternId: Unique identifier
 * - tenantId: 'global' for shared patterns, tenantId for tenant-specific
 * - patternType: Pattern classification
 * - sourceProvider: Source cloud provider
 * - targetProvider: Target cloud provider
 * - workloadTypes: Array of workload types this pattern applies to
 * - strategy: Migration strategy used
 * - successRate: Success rate (0-1)
 * - avgDurationWeeks: Average duration in weeks
 * - avgCostSavings: Average cost savings percentage
 * - anonymizedMetadata: Anonymized metadata (no PII)
 * - createdAt: ISO timestamp
 * - updatedAt: ISO timestamp
 */
// Example: CREATE (p:MigrationPattern {patternId: 'pat-123', sourceProvider: 'aws', targetProvider: 'azure', strategy: 'replatform'})

/**
 * Strategy Node
 * Represents a migration strategy (6Rs)
 * 
 * Properties:
 * - strategyName: rehost, replatform, refactor, repurchase, retire, retain
 * - description: Strategy description
 */
// Example: CREATE (s:Strategy {strategyName: 'replatform', description: 'Move to managed service'})

// ============================================================================
// Relationship Types
// ============================================================================

/**
 * DEPENDS_ON
 * Workload depends on another workload, database, or network resource
 * 
 * Properties:
 * - dependencyType: direct, transitive, data, network
 * - strength: strong, medium, weak
 * - discoveredAt: ISO timestamp
 */
// Example: (w1:Workload)-[:DEPENDS_ON {dependencyType: 'data', strength: 'strong'}]->(d1:Database)

/**
 * CONNECTED_TO
 * Network connectivity relationship
 * 
 * Properties:
 * - protocol: tcp, udp, http, https
 * - port: Port number
 * - direction: inbound, outbound
 */
// Example: (w1:Workload)-[:CONNECTED_TO {protocol: 'tcp', port: 5432}]->(d1:Database)

/**
 * IN_VPC
 * Resource is in a VPC/VNet
 */
// Example: (w1:Workload)-[:IN_VPC]->(vpc1:Network)

/**
 * USES_PATTERN
 * Migration used a specific pattern
 * 
 * Properties:
 * - migrationId: Migration identifier
 * - success: boolean
 * - durationWeeks: Actual duration
 */
// Example: (m:Migration)-[:USES_PATTERN]->(p:MigrationPattern)

/**
 * RECOMMENDS_STRATEGY
 * Assessment recommends a strategy
 * 
 * Properties:
 * - confidence: Confidence score (0-1)
 * - costProjection: Cost projection (JSON)
 */
// Example: (a:Assessment)-[:RECOMMENDS_STRATEGY {confidence: 0.95}]->(s:Strategy)

// ============================================================================
// Example Queries
// ============================================================================

/**
 * Find all dependencies of a workload (transitive)
 */
// MATCH (w:Workload {workloadId: 'wl-123'})-[:DEPENDS_ON*]->(dep)
// RETURN w, dep

/**
 * Find circular dependencies
 */
// MATCH path = (w:Workload)-[:DEPENDS_ON*]->(w)
// RETURN path

/**
 * Find migration patterns for a specific provider pair and workload type
 */
// MATCH (p:MigrationPattern)
// WHERE p.sourceProvider = 'aws' AND p.targetProvider = 'azure' AND 'compute' IN p.workloadTypes
// RETURN p
// ORDER BY p.successRate DESC

/**
 * Calculate dependency depth for a workload
 */
// MATCH path = (w:Workload {workloadId: 'wl-123'})-[:DEPENDS_ON*]->(dep)
// RETURN w, dep, length(path) as depth
// ORDER BY depth DESC

/**
 * Find all workloads in a VPC
 */
// MATCH (vpc:Network {type: 'vpc', networkId: 'vpc-123'})<-[:IN_VPC]-(w:Workload)
// RETURN w
