import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Buffer } from 'buffer';
import { Asset, SolanaNetwork } from '../types.js';
import { Keypair, PublicKey, Transaction } from '@solana/web3.js';

export interface WalletContextType {
  connected: boolean;
  address: string;
  shortAddress: string;
  walletName: string;
  walletType: 'browser' | 'session' | 'watch';
  hasSigningCapability: boolean;
  network: SolanaNetwork;
  setNetwork: (network: SolanaNetwork) => void;
  balances: Record<string, number>;
  solLamports: number;
  isLoadingBalances: boolean;
  connectBrowserWallet: (providerName?: 'phantom' | 'solflare') => Promise<boolean>;
  connectSessionWallet: () => Promise<void>;
  connectWatchWallet: (customAddress: string) => Promise<boolean>;
  disconnect: () => void;
  refreshBalances: () => Promise<void>;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  signAndBroadcast: (tx: Transaction) => Promise<string>;
  updateBalanceAfterTrade: (
    fromSymbol: string,
    fromAmount: number,
    toSymbol: string,
    toAmount: number
  ) => void;
  isConnecting: boolean;
  walletModalOpen: boolean;
  setWalletModalOpen: (open: boolean) => void;
  getAssetBalance: (symbol: string) => number;
  getAssetBalanceUsd: (symbol: string, assetList: Asset[]) => number;
  devnetAirdrop: () => Promise<{ success: boolean; message: string }>;
  isRequestingAirdrop: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [network, setNetworkState] = useState<SolanaNetwork>(() => {
    return (localStorage.getItem('velora_network') as SolanaNetwork) || 'mainnet-beta';
  });

  const [connected, setConnected] = useState<boolean>(() => {
    return localStorage.getItem('velora_wallet_connected') === 'true';
  });

  const [address, setAddress] = useState<string>(() => {
    return localStorage.getItem('velora_wallet_address') || '';
  });

  const [walletName, setWalletName] = useState<string>(() => {
    return localStorage.getItem('velora_wallet_name') || 'Solana Wallet';
  });

  const [walletType, setWalletType] = useState<'browser' | 'session' | 'watch'>(() => {
    return (localStorage.getItem('velora_wallet_type') as any) || 'browser';
  });

  // Ephemeral or persisted session keypair in session memory
  const [sessionKeypair, setSessionKeypair] = useState<Keypair | null>(() => {
    try {
      const savedSecret = sessionStorage.getItem('velora_session_secret');
      if (savedSecret) {
        const arr = JSON.parse(savedSecret);
        return Keypair.fromSecretKey(new Uint8Array(arr));
      }
    } catch {}
    return null;
  });

  // Real balances loaded from Solana RPC (starts empty, never hardcoded!)
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [solLamports, setSolLamports] = useState<number>(0);
  const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [isRequestingAirdrop, setIsRequestingAirdrop] = useState<boolean>(false);

  const setNetwork = (net: SolanaNetwork) => {
    setNetworkState(net);
    localStorage.setItem('velora_network', net);
  };

  // Persist connection meta
  useEffect(() => {
    localStorage.setItem('velora_wallet_connected', String(connected));
    localStorage.setItem('velora_wallet_address', address);
    localStorage.setItem('velora_wallet_name', walletName);
    localStorage.setItem('velora_wallet_type', walletType);
  }, [connected, address, walletName, walletType]);

  // Fetch real on-chain balances for the connected address
  const fetchRealBalances = useCallback(async () => {
    if (!address) {
      setBalances({});
      setSolLamports(0);
      return;
    }

    try {
      setIsLoadingBalances(true);
      const res = await fetch(`/api/wallet/balances?address=${address}&network=${network}`);
      const data = await res.json();
      if (data.success && data.balances) {
        setBalances(data.balances);
        setSolLamports(data.solLamports || 0);
      }
    } catch (err) {
      console.error('[Wallet] Error fetching real on-chain balances:', err);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [address, network]);

  useEffect(() => {
    if (connected && address) {
      fetchRealBalances();
    }
  }, [connected, address, network, fetchRealBalances]);

  // Method 1: Connect Browser Extension (Phantom, Solflare, Wallet Standard)
  const connectBrowserWallet = async (providerName: 'phantom' | 'solflare' = 'phantom'): Promise<boolean> => {
    setIsConnecting(true);
    try {
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const solana = win.solana;
      const solflare = win.solflare;

      if (providerName === 'solflare' && solflare?.isSolflare && typeof solflare.connect === 'function') {
        const resp = await solflare.connect();
        const pubkey = solflare.publicKey ? solflare.publicKey.toString() : resp?.publicKey?.toString();
        if (pubkey) {
          setAddress(pubkey);
          setWalletName('Solflare');
          setWalletType('browser');
          setConnected(true);
          setWalletModalOpen(false);
          return true;
        }
      }

      if (solana?.isPhantom && typeof solana.connect === 'function') {
        const resp = await solana.connect();
        const pubkey = resp?.publicKey ? resp.publicKey.toString() : solana.publicKey?.toString();
        if (pubkey) {
          setAddress(pubkey);
          setWalletName('Phantom');
          setWalletType('browser');
          setConnected(true);
          setWalletModalOpen(false);
          return true;
        }
      }

      // Generic window.solana
      if (solana && typeof solana.connect === 'function') {
        const resp = await solana.connect();
        const pubkey = resp?.publicKey?.toString() || solana.publicKey?.toString();
        if (pubkey) {
          setAddress(pubkey);
          setWalletName(solana.name || 'Solana Wallet');
          setWalletType('browser');
          setConnected(true);
          setWalletModalOpen(false);
          return true;
        }
      }

      return false;
    } catch (err: any) {
      console.warn('[Wallet] Browser wallet connection error:', err.message);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Method 2: Non-Custodial Session Keypair (Real ed25519 Solana Keypair generated in browser)
  const connectSessionWallet = async (): Promise<void> => {
    setIsConnecting(true);
    try {
      let kp = sessionKeypair;
      if (!kp) {
        kp = Keypair.generate();
        setSessionKeypair(kp);
        sessionStorage.setItem('velora_session_secret', JSON.stringify(Array.from(kp.secretKey)));
      }
      const pubkey = kp.publicKey.toBase58();
      setAddress(pubkey);
      setWalletName('Solana Session Wallet');
      setWalletType('session');
      setConnected(true);
      setWalletModalOpen(false);
    } finally {
      setIsConnecting(false);
    }
  };

  // Method 3: Watch Address / Custom Public Key
  const connectWatchWallet = async (customAddress: string): Promise<boolean> => {
    try {
      new PublicKey(customAddress); // throws if invalid base58
      setAddress(customAddress);
      setWalletName('Watch Account');
      setWalletType('watch');
      setConnected(true);
      setWalletModalOpen(false);
      return true;
    } catch {
      return false;
    }
  };

  const disconnect = () => {
    setConnected(false);
    setAddress('');
    setBalances({});
    setSolLamports(0);
    localStorage.removeItem('velora_wallet_connected');
    localStorage.removeItem('velora_wallet_address');
    try {
      const win = typeof window !== 'undefined' ? (window as any) : {};
      if (win.solana && typeof win.solana.disconnect === 'function') {
        win.solana.disconnect();
      }
    } catch {}
  };

  // Sign transaction
  const signTransaction = async (tx: Transaction): Promise<Transaction> => {
    if (walletType === 'browser') {
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const solana = win.solflare?.isSolflare && walletName === 'Solflare' ? win.solflare : win.solana;
      if (solana && typeof solana.signTransaction === 'function') {
        return await solana.signTransaction(tx);
      }
      throw new Error('Browser wallet extension does not support transaction signing.');
    }

    if (walletType === 'session' && sessionKeypair) {
      tx.sign(sessionKeypair);
      return tx;
    }

    throw new Error('Watch-only addresses cannot sign transactions. Please connect Phantom or a Session Wallet.');
  };

  // Sign and broadcast to Solana network
  const signAndBroadcast = async (tx: Transaction): Promise<string> => {
    const signedTx = await signTransaction(tx);
    const rawTxBase64 = Buffer.from(signedTx.serialize()).toString('base64');

    const res = await fetch('/api/transaction/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawTransactionBase64: rawTxBase64,
        network,
      }),
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Solana broadcast failed');
    }

    return data.signature;
  };

  // Local optimistic adjustment after confirmed trade
  const updateBalanceAfterTrade = (
    fromSymbol: string,
    fromAmount: number,
    toSymbol: string,
    toAmount: number
  ) => {
    setBalances((prev) => {
      const currentFrom = prev[fromSymbol] ?? 0;
      const currentTo = prev[toSymbol] ?? 0;
      return {
        ...prev,
        [fromSymbol]: Math.max(0, Number((currentFrom - fromAmount).toFixed(4))),
        [toSymbol]: Number((currentTo + toAmount).toFixed(4)),
      };
    });
    // Trigger on-chain re-sync in background
    setTimeout(fetchRealBalances, 2500);
  };

  const getAssetBalance = (symbol: string): number => {
    if (!symbol || !balances) return 0;
    if (balances[symbol] !== undefined) return balances[symbol];
    const upper = symbol.toUpperCase();
    if (balances[upper] !== undefined) return balances[upper];
    if (balances[`${upper}x`] !== undefined) return balances[`${upper}x`];
    if (balances[`${upper}X`] !== undefined) return balances[`${upper}X`];
    if (upper.endsWith('X') && balances[upper.slice(0, -1)] !== undefined) {
      return balances[upper.slice(0, -1)];
    }
    return 0;
  };

  const getAssetBalanceUsd = (symbol: string, assetList: Asset[]): number => {
    const bal = getAssetBalance(symbol);
    const asset = assetList.find((a) => a.symbol === symbol);
    if (!asset) return 0;
    return bal * asset.priceUsd;
  };

  // Devnet airdrop helper
  const devnetAirdrop = async (): Promise<{ success: boolean; message: string }> => {
    if (network !== 'devnet') {
      return { success: false, message: 'Airdrop is only available on Solana Devnet.' };
    }
    if (!address) {
      return { success: false, message: 'Please connect a wallet first.' };
    }

    setIsRequestingAirdrop(true);
    try {
      const { Connection, clusterApiUrl, PublicKey } = await import('@solana/web3.js');
      const conn = new Connection(clusterApiUrl('devnet'), 'confirmed');
      const pubkey = new PublicKey(address);
      const sig = await conn.requestAirdrop(pubkey, 500000000); // 0.5 SOL
      try {
        const bh = await conn.getLatestBlockhash('confirmed');
        await Promise.race([
          conn.confirmTransaction({ signature: sig, ...bh }, 'confirmed'),
          new Promise((r) => setTimeout(r, 6000)),
        ]);
      } catch {}
      await fetchRealBalances();
      return { success: true, message: 'Successfully requested 0.5 SOL on Devnet!' };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Devnet airdrop rate limit reached. Please use faucet.solana.com.',
      };
    } finally {
      setIsRequestingAirdrop(false);
    }
  };

  const shortAddress =
    address.length > 8 ? `${address.slice(0, 4)}...${address.slice(-4)}` : address;

  const hasSigningCapability = walletType === 'browser' || walletType === 'session';

  return (
    <WalletContext.Provider
      value={{
        connected,
        address,
        shortAddress,
        walletName,
        walletType,
        hasSigningCapability,
        network,
        setNetwork,
        balances,
        solLamports,
        isLoadingBalances,
        connectBrowserWallet,
        connectSessionWallet,
        connectWatchWallet,
        disconnect,
        refreshBalances: fetchRealBalances,
        signTransaction,
        signAndBroadcast,
        updateBalanceAfterTrade,
        isConnecting,
        walletModalOpen,
        setWalletModalOpen,
        getAssetBalance,
        getAssetBalanceUsd,
        devnetAirdrop,
        isRequestingAirdrop,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
