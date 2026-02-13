/**
 * MigrationBox V5.0 - Agent Registry
 *
 * Central export for all AI agents and the BaseAgent class.
 */

export { BaseAgent } from './base-agent';
export type { AgentType, AgentState, AgentStatus, A2AMessage, CircuitBreakerState } from './base-agent';

export { AssessmentAgent } from './assessment-agent';
export { IaCGenerationAgent } from './iac-generation-agent';
export { ValidationAgent } from './validation-agent';
export type { ValidationDimension, ValidationCheck, ValidationReport } from './validation-agent';
export { OptimizationAgent } from './optimization-agent';
export type { OptimizationRecommendation, OptimizationReport } from './optimization-agent';
export { OrchestrationAgent } from './orchestration-agent';
export type { MigrationPlan, MigrationPhase } from './orchestration-agent';

// Re-export DiscoveryAgent from its original location
export { DiscoveryAgent } from '../discovery/discovery-agent';
