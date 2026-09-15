export interface Asset {
  symbol: string;
  name: string;
  ticker: string;
  category: 'equity' | 'crypto' | 'stable';
  priceUsd: number;
  change24h: number;
  decimals: number;
  mint: string;
  accentColor: string;
  liquidityUsd: number;
  volume24hUsd: number;
  lastUpdated?: number;
}

export interface RouteHop {
  fromSymbol: string;
  toSymbol: string;
  dex: 'Orca Whirlpools' | 'Raydium CLMM' | 'Meteora DLMM' | 'Phoenix DEX' | 'Raydium CPMM';
  dexShort: string;
  feePercent: number;
  poolShare: number;
}

export interface ExecutionRoute {
  id: string;
  provider: string; // e.g. 'Jupiter', 'xChange', 'Orca Whirlpools', 'Raydium', 'Meteora'
  routePath: string[]; // e.g. ['NVDAx', 'USDC', 'AAPLx']
  routeHops: RouteHop[];
  inputSymbol: string;
  outputSymbol: string;
  inputAmount: number;
  inputAmountUsd: number;
  expectedOutputAmount: number;
  expectedOutputUsd: number;
  tradingFeeUsd: number;
  priceImpactUsd: number;
  priceImpactPercent: number;
  networkFeeUsd: number;
  slippagePercent: number;
  totalCostUsd: number;
  effectiveRate: number; // output per input
  savingsUsd: number; // vs next best
  isBestPrice: boolean;
  explanation: string;
  hopsCount: number;
  executionTimeMs: number;
}

export interface ProviderStatus {
  name: string; // 'Jupiter' | 'xChange' | 'Orca' | 'Meteora' | 'Raydium'
  available: boolean;
  statusMessage: string;
  latencyMs?: number;
  routeFound?: boolean;
}

export interface QuoteResponse {
  bestRoute: ExecutionRoute;
  allRoutes: ExecutionRoute[];
  providerStatuses: ProviderStatus[];
  inputSymbol: string;
  outputSymbol: string;
  inputAmount: number;
  timestamp: number;
}

export interface TradeRecord {
  id: string;
  signature: string;
  provider?: string;
  fromSymbol: string;
  toSymbol: string;
  fromAmount: number;
  toAmount: number;
  fromUsd: number;
  toUsd: number;
  totalCostUsd: number;
  routePath: string[];
  dexes: string[];
  timestamp: number;
  status: 'confirmed' | 'processing' | 'failed';
  explorerUrl: string;
  cluster: 'mainnet-beta' | 'devnet';
}

export interface WalletPortfolio {
  address: string;
  balances: Record<string, number>;
  totalValueUsd: number;
  network: 'mainnet-beta' | 'devnet';
}

export type SolanaNetwork = 'mainnet-beta' | 'devnet';

export type ExecutionSpeedTier = 'standard' | 'turbo' | 'ultra';

export interface PriorityFeeConfig {
  tier: ExecutionSpeedTier;
  label: string;
  badge: string;
  microLamports: number;
  estSpeedText: string;
  additionalCostSol: number;
}

export const SPEED_PRESETS: Record<ExecutionSpeedTier, PriorityFeeConfig> = {
  turbo: {
    tier: 'turbo',
    label: 'Turbo',
    badge: '⚡ Recommended',
    microLamports: 50_000,
    estSpeedText: '< 400ms (Next Slot)',
    additionalCostSol: 0.000005,
  },
  ultra: {
    tier: 'ultra',
    label: 'Ultra Fast',
    badge: '🚀 Flash Priority',
    microLamports: 150_000,
    estSpeedText: '< 250ms (Front of Block)',
    additionalCostSol: 0.000015,
  },
  standard: {
    tier: 'standard',
    label: 'Standard',
    badge: 'Economical',
    microLamports: 10_000,
    estSpeedText: '~ 1.2s',
    additionalCostSol: 0.000001,
  },
};

export interface RpcHealthReport {
  network: SolanaNetwork;
  status: 'healthy' | 'degraded' | 'error';
  provider: 'helius' | 'solana' | 'custom';
  activeEndpoint: string;
  latencyMs: number;
  blockhash: string;
  lastValidBlockHeight?: number;
  heliusConfigured: boolean;
  heliusAuthenticated: boolean;
  heliusStatus?: 'authenticated' | 'unauthorized' | 'not_configured' | 'error';
  heliusErrorMessage?: string;
  timestamp: number;
}
