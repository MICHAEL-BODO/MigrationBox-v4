
import { Workload } from '@migrationbox/types';

export interface DiscoveryConfig {
  region?: string;
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
  };
}

export interface AWSScanner {
  discover(config: DiscoveryConfig): Promise<Workload[]>;
  serviceName(): string;
}
