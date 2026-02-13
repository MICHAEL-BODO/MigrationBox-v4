/**
 * MigrationBox V5.0 - Cost Projection Engine
 *
 * Multi-cloud cost projection with 3-year NPV, pricing API integration,
 * and comparative analysis across AWS, Azure, and GCP.
 */

import { Workload, CloudProvider } from '@migrationbox/types';
import { calculateThreeYearCost } from '@migrationbox/utils';

export interface CostProjection {
  workloadId: string;
  currentCost: MonthlyBreakdown;
  projections: {
    aws: CloudCostProjection;
    azure: CloudCostProjection;
    gcp: CloudCostProjection;
  };
  recommendation: string;
  savings: {
    provider: CloudProvider;
    monthlySavings: number;
    yearlySavings: number;
    threeYearSavings: number;
    savingsPercent: number;
  };
}

export interface MonthlyBreakdown {
  compute: number;
  storage: number;
  database: number;
  network: number;
  other: number;
  total: number;
  currency: string;
}

export interface CloudCostProjection {
  provider: CloudProvider;
  monthly: number;
  yearly: number;
  threeYear: number;
  reserved: { monthly: number; yearly: number; threeYear: number };
  spot?: { monthly: number; yearly: number; threeYear: number };
  breakdown: MonthlyBreakdown;
}

// Simplified pricing data (in production: AWS/Azure/GCP Pricing APIs)
const PRICING: Record<string, Record<string, Record<string, number>>> = {
  compute: {
    aws: { small: 30, medium: 60, large: 120, xlarge: 240 },
    azure: { small: 32, medium: 65, large: 130, xlarge: 260 },
    gcp: { small: 28, medium: 56, large: 112, xlarge: 225 },
  },
  database: {
    aws: { small: 50, medium: 180, large: 400, xlarge: 800 },
    azure: { small: 55, medium: 190, large: 420, xlarge: 850 },
    gcp: { small: 45, medium: 170, large: 380, xlarge: 760 },
  },
  storage: {
    aws: { gb: 0.023, requests: 0.0004 },
    azure: { gb: 0.018, requests: 0.0004 },
    gcp: { gb: 0.020, requests: 0.0005 },
  },
  serverless: {
    aws: { invocations: 0.0000002, duration: 0.0000166667 },
    azure: { invocations: 0.0000002, duration: 0.000016 },
    gcp: { invocations: 0.0000004, duration: 0.0000025 },
  },
};

const RESERVED_DISCOUNT = 0.6; // 40% discount for 1yr reserved
const SPOT_DISCOUNT = 0.3;    // 70% discount for spot

export class CostProjectionEngine {

  /**
   * Project costs for a workload across all 3 clouds
   */
  projectCosts(workload: Workload, currentProvider: CloudProvider): CostProjection {
    const currentCost = this.estimateCurrentCost(workload, currentProvider);

    const awsProjection = this.projectForProvider(workload, 'aws');
    const azureProjection = this.projectForProvider(workload, 'azure');
    const gcpProjection = this.projectForProvider(workload, 'gcp');

    // Find cheapest provider
    const cheapest = [awsProjection, azureProjection, gcpProjection]
      .sort((a, b) => a.monthly - b.monthly)[0];

    const monthlySavings = currentCost.total - cheapest.monthly;
    const yearlySavings = monthlySavings * 12;
    const threeYearSavings = calculateThreeYearCost(monthlySavings * 12, 0.1);

    return {
      workloadId: workload.workloadId,
      currentCost,
      projections: {
        aws: awsProjection,
        azure: azureProjection,
        gcp: gcpProjection,
      },
      recommendation: monthlySavings > 0
        ? `Migrate to ${cheapest.provider.toUpperCase()} for ${Math.round(monthlySavings / currentCost.total * 100)}% cost savings`
        : 'Current provider is cost-optimal',
      savings: {
        provider: cheapest.provider,
        monthlySavings: Math.max(0, monthlySavings),
        yearlySavings: Math.max(0, yearlySavings),
        threeYearSavings: Math.max(0, threeYearSavings),
        savingsPercent: currentCost.total > 0 ? Math.max(0, (monthlySavings / currentCost.total) * 100) : 0,
      },
    };
  }

  /**
   * Batch cost projection for multiple workloads
   */
  projectBatchCosts(workloads: Workload[], currentProvider: CloudProvider): {
    projections: CostProjection[];
    summary: {
      totalCurrentMonthly: number;
      bestProvider: CloudProvider;
      totalSavingsMonthly: number;
      totalSavingsYearly: number;
      totalSavingsThreeYear: number;
    };
  } {
    const projections = workloads.map(w => this.projectCosts(w, currentProvider));

    const totalCurrent = projections.reduce((sum, p) => sum + p.currentCost.total, 0);

    // Sum by provider
    const providerTotals: Record<string, number> = { aws: 0, azure: 0, gcp: 0 };
    for (const p of projections) {
      providerTotals.aws += p.projections.aws.monthly;
      providerTotals.azure += p.projections.azure.monthly;
      providerTotals.gcp += p.projections.gcp.monthly;
    }

    const bestProvider = (Object.entries(providerTotals)
      .sort((a, b) => a[1] - b[1])[0][0]) as CloudProvider;

    const bestTotal = providerTotals[bestProvider];
    const savings = totalCurrent - bestTotal;

    return {
      projections,
      summary: {
        totalCurrentMonthly: totalCurrent,
        bestProvider,
        totalSavingsMonthly: Math.max(0, savings),
        totalSavingsYearly: Math.max(0, savings * 12),
        totalSavingsThreeYear: Math.max(0, calculateThreeYearCost(savings * 12, 0.1)),
      },
    };
  }

  private estimateCurrentCost(workload: Workload, provider: CloudProvider): MonthlyBreakdown {
    const meta = workload.metadata as any || {};
    let compute = 0, storage = 0, database = 0, network = 0, other = 0;

    const size = this.normalizeSize(meta.instanceType || meta.vmSize || meta.machineType || meta.tier || 'medium');

    switch (workload.type) {
      case 'compute':
        compute = PRICING.compute[provider]?.[size] || 60;
        break;
      case 'database':
        database = PRICING.database[provider]?.[size] || 180;
        if (meta.multiAZ) database *= 2;
        break;
      case 'storage':
        const gbEstimate = meta.sizeGb || 100;
        storage = gbEstimate * (PRICING.storage[provider]?.gb || 0.023);
        break;
      case 'serverless':
        const invocationsEstimate = meta.monthlyInvocations || 1000000;
        compute = invocationsEstimate * (PRICING.serverless[provider]?.invocations || 0.0000002);
        break;
      case 'container':
        const nodes = meta.nodeCount || meta.desiredCount || 3;
        compute = nodes * (PRICING.compute[provider]?.medium || 60);
        break;
      case 'network':
        network = 20; // Base network cost
        break;
      default:
        other = 30;
    }

    return {
      compute, storage, database, network, other,
      total: compute + storage + database + network + other,
      currency: 'USD',
    };
  }

  private projectForProvider(workload: Workload, provider: CloudProvider): CloudCostProjection {
    const breakdown = this.estimateCurrentCost(workload, provider);

    const monthly = breakdown.total;
    const yearly = monthly * 12;
    const threeYear = calculateThreeYearCost(yearly, 0.1);

    const reservedMonthly = monthly * RESERVED_DISCOUNT;
    const spotMonthly = workload.type === 'compute' ? monthly * SPOT_DISCOUNT : undefined;

    return {
      provider,
      monthly,
      yearly,
      threeYear,
      reserved: {
        monthly: reservedMonthly,
        yearly: reservedMonthly * 12,
        threeYear: calculateThreeYearCost(reservedMonthly * 12, 0.1),
      },
      ...(spotMonthly !== undefined && {
        spot: {
          monthly: spotMonthly,
          yearly: spotMonthly * 12,
          threeYear: calculateThreeYearCost(spotMonthly * 12, 0.1),
        },
      }),
      breakdown,
    };
  }

  private normalizeSize(input: string): string {
    const lower = input.toLowerCase();
    if (lower.includes('xlarge') || lower.includes('8xlarge') || lower.includes('standard_d16')) return 'xlarge';
    if (lower.includes('large') || lower.includes('standard_d4') || lower.includes('n1-standard-4')) return 'large';
    if (lower.includes('medium') || lower.includes('standard_d2') || lower.includes('n1-standard-2')) return 'medium';
    return 'small';
  }
}
