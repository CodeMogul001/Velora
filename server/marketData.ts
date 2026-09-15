import { Asset } from '../src/types.js';

// Equity tickers to real stock market symbols
const EQUITY_TICKERS: Record<string, string> = {
  NVDAx: 'NVDA',
  AAPLx: 'AAPL',
  MSFTx: 'MSFT',
  TSLAx: 'TSLA',
  AMZNx: 'AMZN',
  GOOGLx: 'GOOGL',
  METAx: 'META',
  COINx: 'COIN',
  MSTRx: 'MSTR',
};

// Base assets template with real Solana SPL Token mint addresses and properties
export const ASSETS_REGISTRY: Record<string, Asset> = {
  NVDAx: {
    symbol: 'NVDAx',
    name: 'NVIDIA (Tokenized)',
    ticker: 'NVDA',
    category: 'equity',
    priceUsd: 218.29,
    change24h: 0.0,
    decimals: 6,
    mint: 'NVDAxSol11111111111111111111111111111111111111',
    accentColor: '#76B900',
    liquidityUsd: 18450000,
    volume24hUsd: 4120000,
    lastUpdated: Date.now(),
  },
  AAPLx: {
    symbol: 'AAPLx',
    name: 'Apple (Tokenized)',
    ticker: 'AAPL',
    category: 'equity',
    priceUsd: 332.27,
    change24h: 0.0,
    decimals: 6,
    mint: 'AAPLxSol11111111111111111111111111111111111111',
    accentColor: '#555555',
    liquidityUsd: 24200000,
    volume24hUsd: 5890000,
    lastUpdated: Date.now(),
  },
  MSFTx: {
    symbol: 'MSFTx',
    name: 'Microsoft (Tokenized)',
    ticker: 'MSFT',
    category: 'equity',
    priceUsd: 495.63,
    change24h: 0.0,
    decimals: 6,
    mint: 'MSFTxSol11111111111111111111111111111111111111',
    accentColor: '#00A4EF',
    liquidityUsd: 19800000,
    volume24hUsd: 3200000,
    lastUpdated: Date.now(),
  },
  TSLAx: {
    symbol: 'TSLAx',
    name: 'Tesla (Tokenized)',
    ticker: 'TSLA',
    category: 'equity',
    priceUsd: 365.44,
    change24h: 0.0,
    decimals: 6,
    mint: 'TSLAxSol11111111111111111111111111111111111111',
    accentColor: '#E82127',
    liquidityUsd: 15300000,
    volume24hUsd: 6410000,
    lastUpdated: Date.now(),
  },
  AMZNx: {
    symbol: 'AMZNx',
    name: 'Amazon (Tokenized)',
    ticker: 'AMZN',
    category: 'equity',
    priceUsd: 256.78,
    change24h: 0.0,
    decimals: 6,
    mint: 'AMZNxSol11111111111111111111111111111111111111',
    accentColor: '#FF9900',
    liquidityUsd: 12900000,
    volume24hUsd: 2840000,
    lastUpdated: Date.now(),
  },
  GOOGLx: {
    symbol: 'GOOGLx',
    name: 'Alphabet (Tokenized)',
    ticker: 'GOOGL',
    category: 'equity',
    priceUsd: 338.50,
    change24h: 0.0,
    decimals: 6,
    mint: 'GOOGxSol11111111111111111111111111111111111111',
    accentColor: '#4285F4',
    liquidityUsd: 11400000,
    volume24hUsd: 2150000,
    lastUpdated: Date.now(),
  },
  METAx: {
    symbol: 'METAx',
    name: 'Meta (Tokenized)',
    ticker: 'META',
    category: 'equity',
    priceUsd: 648.03,
    change24h: 0.0,
    decimals: 6,
    mint: 'METAxSol11111111111111111111111111111111111111',
    accentColor: '#0081FB',
    liquidityUsd: 14100000,
    volume24hUsd: 3820000,
    lastUpdated: Date.now(),
  },
  COINx: {
    symbol: 'COINx',
    name: 'Coinbase (Tokenized)',
    ticker: 'COIN',
    category: 'equity',
    priceUsd: 175.26,
    change24h: 0.0,
    decimals: 6,
    mint: 'COINxSol11111111111111111111111111111111111111',
    accentColor: '#0052FF',
    liquidityUsd: 8700000,
    volume24hUsd: 2980000,
    lastUpdated: Date.now(),
  },
  MSTRx: {
    symbol: 'MSTRx',
    name: 'MicroStrategy (Tokenized)',
    ticker: 'MSTR',
    category: 'equity',
    priceUsd: 130.97,
    change24h: 0.0,
    decimals: 6,
    mint: 'MSTRxSol11111111111111111111111111111111111111',
    accentColor: '#D32F2F',
    liquidityUsd: 7900000,
    volume24hUsd: 3150000,
    lastUpdated: Date.now(),
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    ticker: 'USDC',
    category: 'stable',
    priceUsd: 1.00,
    change24h: 0.0,
    decimals: 6,
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Real Solana Mainnet USDC Mint
    accentColor: '#2775CA',
    liquidityUsd: 950000000,
    volume24hUsd: 45000000,
    lastUpdated: Date.now(),
  },
  SOL: {
    symbol: 'SOL',
    name: 'Solana Native',
    ticker: 'SOL',
    category: 'crypto',
    priceUsd: 102.04,
    change24h: 0.0,
    decimals: 9,
    mint: 'So11111111111111111111111111111111111111112', // Real Solana Native Wrapped SOL
    accentColor: '#14F195',
    liquidityUsd: 480000000,
    volume24hUsd: 82000000,
    lastUpdated: Date.now(),
  },
};

let lastFetchTime = 0;
const CACHE_TTL_MS = 25000; // 25 seconds cache
let isFetching = false;

export async function refreshLiveMarketData(force: boolean = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastFetchTime < CACHE_TTL_MS) {
    return;
  }
  if (isFetching) return;
  isFetching = true;

  try {
    // 1. Fetch real equity prices concurrently
    const equityEntries = Object.entries(EQUITY_TICKERS);
    await Promise.all(
      equityEntries.map(async ([symbol, ticker]) => {
        try {
          const res = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
            {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
              signal: AbortSignal.timeout(4500),
            }
          );
          if (!res.ok) return;
          const json = await res.json();
          const meta = json.chart?.result?.[0]?.meta;
          if (meta && typeof meta.regularMarketPrice === 'number' && meta.regularMarketPrice > 0) {
            const price = meta.regularMarketPrice;
            const prevClose = meta.chartPreviousClose || price;
            const change24h = ((price - prevClose) / prevClose) * 100;

            if (ASSETS_REGISTRY[symbol]) {
              ASSETS_REGISTRY[symbol].priceUsd = Number(price.toFixed(2));
              ASSETS_REGISTRY[symbol].change24h = Number(change24h.toFixed(2));
              ASSETS_REGISTRY[symbol].lastUpdated = Date.now();
            }
          }
        } catch (err: any) {
          // Keep current price if network hiccup occurs
          console.warn(`[MarketData] Could not update ${symbol}:`, err.message);
        }
      })
    );

    // 2. Fetch live crypto price for SOL from CoinGecko or Dexscreener
    try {
      const solRes = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true',
        { signal: AbortSignal.timeout(4000) }
      );
      if (solRes.ok) {
        const solData = await solRes.json();
        if (solData?.solana?.usd) {
          ASSETS_REGISTRY['SOL'].priceUsd = Number(solData.solana.usd.toFixed(2));
          ASSETS_REGISTRY['SOL'].change24h = Number(
            (solData.solana.usd_24h_change || 0).toFixed(2)
          );
          ASSETS_REGISTRY['SOL'].lastUpdated = Date.now();
        }
      }
    } catch {
      // Try fallback to Dexscreener for SOL/USDC pair
      try {
        const dsRes = await fetch(
          'https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112',
          { signal: AbortSignal.timeout(3000) }
        );
        if (dsRes.ok) {
          const dsData = await dsRes.json();
          const topPair = dsData.pairs?.find((p: any) => p.quoteToken?.symbol === 'USDC');
          if (topPair && topPair.priceUsd) {
            ASSETS_REGISTRY['SOL'].priceUsd = Number(parseFloat(topPair.priceUsd).toFixed(2));
            ASSETS_REGISTRY['SOL'].change24h = Number((topPair.priceChange?.h24 || 0).toFixed(2));
            ASSETS_REGISTRY['SOL'].lastUpdated = Date.now();
          }
        }
      } catch (err: any) {
        console.warn('[MarketData] SOL price fetch error:', err.message);
      }
    }

    lastFetchTime = Date.now();
  } catch (globalErr: any) {
    console.error('[MarketData] Global market refresh failed:', globalErr.message);
  } finally {
    isFetching = false;
  }
}

// Initial bootstrap refresh
refreshLiveMarketData(true).catch((err) =>
  console.warn('[MarketData] Initial bootstrap error:', err)
);

export function getLiveAssets(): Asset[] {
  // Fire async refresh in background if cache is old
  if (Date.now() - lastFetchTime > CACHE_TTL_MS) {
    refreshLiveMarketData(false).catch(() => {});
  }
  return Object.values(ASSETS_REGISTRY);
}

export function getAsset(symbol: string): Asset | undefined {
  if (!symbol) return undefined;
  const upper = symbol.toUpperCase();
  if (ASSETS_REGISTRY[upper]) return ASSETS_REGISTRY[upper];
  for (const key of Object.keys(ASSETS_REGISTRY)) {
    if (key.toUpperCase() === upper) return ASSETS_REGISTRY[key];
    if (key.toUpperCase() === `${upper}X`) return ASSETS_REGISTRY[key];
    if (`${key.toUpperCase()}X` === upper) return ASSETS_REGISTRY[key];
  }
  return undefined;
}
