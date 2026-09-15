import React, { useState, useRef, useEffect } from 'react';
import VeloraLogo from './VeloraLogo.js';
import { useWallet } from '../context/WalletContext.js';
import { Asset, RpcHealthReport } from '../types.js';
import {
  Wallet,
  LogOut,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
  Droplets,
  Loader2,
  Globe,
  Zap,
  Activity,
} from 'lucide-react';
import { formatUsd, formatTokenAmount } from '../utils/formatters.js';
import { getAssetDotClasses } from '../utils/tokenColors.js';

interface NavbarProps {
  activeTab: 'trade' | 'portfolio' | 'activity';
  setActiveTab: (tab: 'trade' | 'portfolio' | 'activity') => void;
  onOpenWalletModal: () => void;
  totalPortfolioUsd: number;
  assets: Asset[];
}

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenWalletModal,
  totalPortfolioUsd,
  assets,
}: NavbarProps) {
  const {
    connected,
    address,
    shortAddress,
    walletName,
    disconnect,
    getAssetBalance,
    network,
    setNetwork,
    devnetAirdrop,
    isRequestingAirdrop,
  } = useWallet();

  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [airdropMessage, setAirdropMessage] = useState<string | null>(null);
  const [rpcHealth, setRpcHealth] = useState<RpcHealthReport | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<HTMLDivElement>(null);

  // Poll RPC endpoint status via health check utility
  useEffect(() => {
    let isMounted = true;
    const fetchHealth = async () => {
      try {
        const res = await fetch(`/api/rpc/health?network=${network}`);
        const data = await res.json();
        if (isMounted && data.success && data.health) {
          setRpcHealth(data.health);
        }
      } catch {
        // quiet error
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [network]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setWalletDropdownOpen(false);
      }
      if (networkRef.current && !networkRef.current.contains(event.target as Node)) {
        setNetworkDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAirdrop = async () => {
    setAirdropMessage(null);
    const res = await devnetAirdrop();
    setAirdropMessage(res.message);
    setTimeout(() => setAirdropMessage(null), 4000);
  };

  const solBalance = getAssetBalance('SOL');
  const solAsset = assets.find((a) => a.symbol === 'SOL');
  const solValueUsd = solBalance * (solAsset?.priceUsd || 102.04);

  // Tokenized stock balances with balance > 0
  const stockHoldings = assets
    .filter((a) => a.category === 'equity')
    .map((asset) => {
      const bal = getAssetBalance(asset.symbol);
      const usdVal = bal * asset.priceUsd;
      return { asset, bal, usdVal };
    })
    .filter((h) => h.bal > 0)
    .sort((a, b) => b.usdVal - a.usdVal);

  const clusterParam = network === 'devnet' ? '?cluster=devnet' : '';

  return (
    <>
      <header
        id="velora-navbar"
        className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
          {/* Brand & Main Nav */}
          <div className="flex items-center gap-6">
            <div
              id="brand-logo-clickable"
              onClick={() => setActiveTab('trade')}
              className="flex items-center gap-2 cursor-pointer group select-none"
            >
              <div className="p-0.5 rounded-lg transition-transform group-hover:scale-105 duration-200">
                <VeloraLogo size={24} />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                Velora
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav id="main-navigation" className="hidden sm:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
              <button
                id="nav-trade-tab"
                onClick={() => setActiveTab('trade')}
                className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'trade'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Trade
              </button>
              <button
                id="nav-portfolio-tab"
                onClick={() => setActiveTab('portfolio')}
                className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'portfolio'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Portfolio
              </button>
              <button
                id="nav-activity-tab"
                onClick={() => setActiveTab('activity')}
                className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'activity'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Activity
              </button>
            </nav>
          </div>

          {/* Right side: Network pill & Wallet connection */}
          <div className="flex items-center gap-2">
            {/* Cluster Selector */}
            <div className="relative" ref={networkRef}>
              <button
                id="network-selector-btn"
                onClick={() => setNetworkDropdownOpen(!networkDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 transition-colors"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    network === 'mainnet-beta' ? 'bg-emerald-500' : 'bg-purple-500'
                  }`}
                />
                <span className="capitalize">{network === 'mainnet-beta' ? 'Mainnet' : 'Devnet'}</span>
                <ChevronDown size={11} className="text-slate-400" />
              </button>

              {networkDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-40 bg-white rounded-2xl shadow-lg border border-slate-200 p-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setNetwork('mainnet-beta');
                      setNetworkDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs font-medium transition-colors ${
                      network === 'mainnet-beta'
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Mainnet-beta</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setNetwork('devnet');
                      setNetworkDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs font-medium transition-colors ${
                      network === 'devnet'
                        ? 'bg-purple-50 text-purple-800 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span>Solana Devnet</span>
                    </div>
                  </button>

                  {/* Live RPC Status Report */}
                  <div className="mt-1 pt-1.5 border-t border-slate-100 px-2 py-1 text-[10px] text-slate-500">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 font-medium">
                        <Activity size={10} className={rpcHealth?.status === 'healthy' ? 'text-emerald-500' : 'text-amber-500'} />
                        <span>RPC Provider</span>
                      </span>
                      <span className="font-semibold text-slate-700 font-mono">
                        {rpcHealth?.provider === 'helius' ? '⚡ Helius' : 'Solana'}
                      </span>
                    </div>
                    {rpcHealth?.latencyMs !== undefined && (
                      <div className="flex items-center justify-between mt-0.5 text-slate-400 font-mono">
                        <span>Latency</span>
                        <span>{rpcHealth.latencyMs}ms</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {connected ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  id="wallet-user-dropdown-btn"
                  onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all text-xs font-medium text-slate-800 shadow-2xs"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-mono text-slate-700 font-semibold">{shortAddress}</span>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-200 ${
                      walletDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Wallet Panel Popover */}
                {walletDropdownOpen && (
                  <div
                    id="wallet-dropdown-menu"
                    className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-xl border border-slate-200 p-4 z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
                  >
                    {/* Wallet address row with copy */}
                    <div className="pb-3 border-b border-slate-100">
                      <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                        <span>{walletName}</span>
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium capitalize">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Solana {network}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                        <span className="font-mono text-slate-800 text-[11px]">
                          {shortAddress}
                        </span>
                        <button
                          onClick={handleCopyAddress}
                          className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                          title="Copy address"
                        >
                          {copied ? (
                            <Check size={12} className="text-emerald-600" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Balances: SOL and Tokenized Stocks */}
                    <div className="py-2.5 border-b border-slate-100 space-y-2">
                      {/* SOL Balance */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-slate-600 font-medium">SOL Balance</span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="font-bold text-slate-900">{formatTokenAmount(solBalance, 4)} SOL</span>{' '}
                          <span className="text-[10px] text-slate-400">({formatUsd(solValueUsd)})</span>
                        </div>
                      </div>

                      {/* Devnet Faucet Airdrop Button */}
                      {network === 'devnet' && (
                        <div className="pt-1">
                          <button
                            onClick={handleAirdrop}
                            disabled={isRequestingAirdrop}
                            className="w-full py-1.5 px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200/60 text-purple-700 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            {isRequestingAirdrop ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Droplets size={12} />
                            )}
                            <span>Request 0.5 Devnet SOL</span>
                          </button>
                          {airdropMessage && (
                            <div className="mt-1 text-[10px] text-slate-500 text-center font-mono">
                              {airdropMessage}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tokenized Stock Balances */}
                      <div className="pt-1">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                          Tokenized stocks
                        </div>
                        {stockHoldings.length === 0 ? (
                          <div className="text-slate-400 text-[11px]">No stock holdings</div>
                        ) : (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {stockHoldings.map(({ asset, bal, usdVal }) => (
                              <div
                                key={asset.symbol}
                                className="flex items-center justify-between text-[11px]"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${getAssetDotClasses(asset.symbol)}`}
                                  />
                                  <span className="font-semibold text-slate-800">{asset.ticker}</span>
                                </div>
                                <div className="font-mono text-slate-700">
                                  <span className="font-semibold">{formatUsd(usdVal)}</span>{' '}
                                  <span className="text-slate-400 text-[10px]">
                                    ({formatTokenAmount(bal, 2)})
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions: Explorer Link & Disconnect */}
                    <div className="pt-2.5 flex items-center justify-between">
                      <a
                        href={`https://explorer.solana.com/address/${address}${clusterParam}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 font-medium transition-colors"
                        title="View account on Solana Explorer"
                      >
                        <span>Solana Explorer</span>
                        <ExternalLink size={10} />
                      </a>
                      <button
                        id="disconnect-wallet-btn"
                        onClick={() => {
                          disconnect();
                          setWalletDropdownOpen(false);
                        }}
                        className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold transition-colors text-[11px]"
                      >
                        <LogOut size={12} />
                        <span>Disconnect</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="connect-wallet-nav-btn"
                onClick={onOpenWalletModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-semibold shadow-2xs transition-all"
              >
                <Wallet size={13} />
                <span>Connect wallet</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Compact Navigation Bar (Fixed Bottom) */}
      <nav
        id="mobile-bottom-nav"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-6 py-2 flex items-center justify-around"
      >
        <button
          onClick={() => setActiveTab('trade')}
          className={`flex flex-col items-center gap-0.5 text-xs font-semibold ${
            activeTab === 'trade' ? 'text-slate-900 font-bold' : 'text-slate-400'
          }`}
        >
          <span>Trade</span>
          {activeTab === 'trade' && <span className="w-1 h-1 rounded-full bg-slate-900" />}
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex flex-col items-center gap-0.5 text-xs font-semibold ${
            activeTab === 'portfolio' ? 'text-slate-900 font-bold' : 'text-slate-400'
          }`}
        >
          <span>Portfolio</span>
          {activeTab === 'portfolio' && <span className="w-1 h-1 rounded-full bg-slate-900" />}
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex flex-col items-center gap-0.5 text-xs font-semibold ${
            activeTab === 'activity' ? 'text-slate-900 font-bold' : 'text-slate-400'
          }`}
        >
          <span>Activity</span>
          {activeTab === 'activity' && <span className="w-1 h-1 rounded-full bg-slate-900" />}
        </button>
      </nav>
    </>
  );
}
