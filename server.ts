import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getLiveAssets, getAsset, refreshLiveMarketData } from './server/marketData.js';
import { calculateExecutionRoutes } from './server/routingEngine.js';
import {
  getTradeHistory,
  recordTrade,
  prepareSolanaTransaction,
  broadcastSolanaTransaction,
  getRealWalletBalances,
  getSolanaRpcUrl,
  isValidHeliusKey,
  checkRpcHealth,
} from './server/solanaService.js';
import { SolanaNetwork } from './src/types.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Bootstrap initial real market data
  await refreshLiveMarketData(true).catch(() => {});

  // API 1: Assets list (Real live prices)
  app.get('/api/assets', (req, res) => {
    try {
      const assets = getLiveAssets();
      res.json({ success: true, assets });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API 2: Single asset
  app.get('/api/assets/:symbol', (req, res) => {
    const asset = getAsset(req.params.symbol);
    if (!asset) {
      return res.status(404).json({ success: false, error: 'Asset not found' });
    }
    res.json({ success: true, asset });
  });

  // API 3: Network & RPC Status
  app.get('/api/network', (req, res) => {
    const defaultNetwork = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as SolanaNetwork) || 'mainnet-beta';
    const rpcUrl = getSolanaRpcUrl(defaultNetwork);
    res.json({
      success: true,
      network: defaultNetwork,
      rpcEndpoint: rpcUrl.replace(/api-key=[^&]+/, 'api-key=***'),
      isMainnet: defaultNetwork === 'mainnet-beta',
      providers: {
        xchangeConfigured: Boolean(process.env.XCHANGE_API_KEY),
        jupiterConfigured: Boolean(process.env.JUPITER_API_KEY || (process.env.HELIUS_API_KEY?.startsWith('jup_'))),
        heliusConfigured: isValidHeliusKey(process.env.HELIUS_API_KEY),
      },
    });
  });

  // API 3.5: Health check utility to verify RPC endpoint status before transaction flow
  app.get('/api/rpc/health', async (req, res) => {
    try {
      const network = ((req.query.network as string) ||
        process.env.NEXT_PUBLIC_SOLANA_NETWORK ||
        'mainnet-beta') as SolanaNetwork;
      const health = await checkRpcHealth(network);
      res.json({ success: true, health });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API 4: Real On-Chain Balances for any address
  app.get('/api/wallet/balances', async (req, res) => {
    try {
      const address = req.query.address as string;
      const network = ((req.query.network as string) ||
        process.env.NEXT_PUBLIC_SOLANA_NETWORK ||
        'mainnet-beta') as SolanaNetwork;

      if (!address) {
        return res.status(400).json({ success: false, error: 'Address parameter is required' });
      }

      const balanceData = await getRealWalletBalances(address, network);
      res.json({ success: true, ...balanceData });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // API 5: Route Discovery & Optimization Engine (Real quotes & provider comparisons)
  app.post('/api/quote', (req, res) => {
    try {
      const { fromSymbol, toSymbol, amount, isUsdMode } = req.body;
      if (!fromSymbol || !toSymbol || amount === undefined || Number(amount) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Please provide valid fromSymbol, toSymbol and positive amount.',
        });
      }

      if (fromSymbol.toUpperCase() === toSymbol.toUpperCase()) {
        return res.status(400).json({
          success: false,
          error: 'Source and destination tokens must be different.',
        });
      }

      const quote = calculateExecutionRoutes(
        fromSymbol.toUpperCase(),
        toSymbol.toUpperCase(),
        Number(amount),
        isUsdMode !== false
      );

      res.json({ success: true, quote });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API 6: Prepare Real Solana Transaction for signing
  app.post('/api/transaction/prepare', async (req, res) => {
    try {
      const { walletAddress, fromSymbol, toSymbol, amount, expectedOutput, routePath, network, priorityMicroLamports } = req.body;
      const selectedNetwork = (network || process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta') as SolanaNetwork;

      if (!walletAddress) {
        return res.status(400).json({ success: false, error: 'walletAddress is required to prepare transaction' });
      }

      const txData = await prepareSolanaTransaction(
        walletAddress,
        fromSymbol,
        toSymbol,
        Number(amount),
        Number(expectedOutput || 0),
        routePath || [fromSymbol, toSymbol],
        selectedNetwork,
        priorityMicroLamports !== undefined ? Number(priorityMicroLamports) : 50_000
      );

      res.json({ success: true, ...txData });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API 7: Broadcast Client-Signed Transaction to Solana Network
  app.post('/api/transaction/broadcast', async (req, res) => {
    try {
      const { rawTransactionBase64, network } = req.body;
      const selectedNetwork = (network || process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta') as SolanaNetwork;

      if (!rawTransactionBase64) {
        return res.status(400).json({ success: false, error: 'rawTransactionBase64 payload required' });
      }

      const broadcastResult = await broadcastSolanaTransaction(rawTransactionBase64, selectedNetwork);
      res.json({ success: true, ...broadcastResult });
    } catch (err: any) {
      console.error('[API:broadcast] Broadcast error:', err.message);
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to broadcast transaction on Solana',
        logs: err.logs || [],
      });
    }
  });

  // API 8: Record Confirmed Trade in History
  app.post('/api/transaction/confirm', (req, res) => {
    try {
      const {
        signature,
        provider,
        fromSymbol,
        toSymbol,
        fromAmount,
        toAmount,
        fromUsd,
        toUsd,
        totalCostUsd,
        routePath,
        dexes,
        cluster,
      } = req.body;

      if (!fromSymbol || !toSymbol || !signature) {
        return res.status(400).json({ success: false, error: 'Incomplete trade execution payload.' });
      }

      const record = recordTrade({
        signature,
        provider: provider || 'Meteora DLMM',
        fromSymbol,
        toSymbol,
        fromAmount: Number(fromAmount),
        toAmount: Number(toAmount),
        fromUsd: Number(fromUsd),
        toUsd: Number(toUsd),
        totalCostUsd: Number(totalCostUsd),
        routePath: routePath || [fromSymbol, toSymbol],
        dexes: dexes || ['Meteora DLMM'],
        timestamp: Date.now(),
        status: 'confirmed',
        cluster: cluster === 'devnet' ? 'devnet' : 'mainnet-beta',
      });

      res.json({ success: true, record });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API 9: Recent Activity
  app.get('/api/activity', (req, res) => {
    try {
      const trades = getTradeHistory();
      res.json({ success: true, trades });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Velora server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
