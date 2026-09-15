import React, { useState, useEffect, useRef } from 'react';
import { Asset } from './types.js';
import { WalletProvider, useWallet } from './context/WalletContext.js';
import Navbar from './components/Navbar.js';
import HeroSection from './components/HeroSection.js';
import TradeCard from './components/TradeCard.js';
import ValueProps from './components/ValueProps.js';
import PortfolioView from './components/PortfolioView.js';
import ActivityView from './components/ActivityView.js';
import WalletConnectModal from './components/WalletConnectModal.js';
import VeloraLogo from './components/VeloraLogo.js';

function MainApp() {
  const [activeTab, setActiveTab] = useState<'trade' | 'portfolio' | 'activity'>('trade');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [sellAssetOverride, setSellAssetOverride] = useState<Asset | null>(null);

  const tradeSectionRef = useRef<HTMLDivElement>(null);

  const {
    walletModalOpen,
    setWalletModalOpen,
    balances,
  } = useWallet();

  // Fetch real assets from backend
  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/assets');
      const data = await res.json();
      if (data.success && Array.isArray(data.assets)) {
        setAssets(data.assets);
      }
    } catch (err) {
      console.error('Failed to load assets', err);
    } finally {
      setLoadingAssets(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // Compute total portfolio value
  const totalPortfolioUsd = assets.reduce((sum, asset) => {
    const bal = balances[asset.symbol] || balances[asset.ticker] || 0;
    return sum + bal * asset.priceUsd;
  }, 0);

  const handleStartTrading = () => {
    setActiveTab('trade');
    if (tradeSectionRef.current) {
      tradeSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectAssetToTrade = (asset: Asset) => {
    setSellAssetOverride(asset);
    setActiveTab('trade');
    if (tradeSectionRef.current) {
      tradeSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFC] text-slate-900 selection:bg-slate-900 selection:text-white pb-16 sm:pb-0 font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenWalletModal={() => setWalletModalOpen(true)}
        totalPortfolioUsd={totalPortfolioUsd}
        assets={assets}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 flex flex-col items-center">
        {loadingAssets ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-medium">Connecting to Solana markets...</p>
          </div>
        ) : activeTab === 'trade' ? (
          <div className="w-full flex flex-col items-center">
            {/* Landing Hero per Section 3 */}
            <HeroSection
              onStartTrading={handleStartTrading}
              onOpenWalletModal={() => setWalletModalOpen(true)}
            />

            {/* Centered Trading Card per Section 4 */}
            <div ref={tradeSectionRef} className="w-full mt-2">
              <TradeCard
                assets={assets}
                onOpenWalletModal={() => setWalletModalOpen(true)}
                onTradeCompleted={() => {
                  fetchAssets();
                }}
                sellAssetOverride={sellAssetOverride}
                onClearSellAssetOverride={() => setSellAssetOverride(null)}
              />
            </div>

            {/* 3 Concise Value Props per Section 3 */}
            <ValueProps />
          </div>
        ) : activeTab === 'portfolio' ? (
          <div className="w-full">
            <PortfolioView
              assets={assets}
              onSelectSellAsset={handleSelectAssetToTrade}
              onOpenWalletModal={() => setWalletModalOpen(true)}
            />
          </div>
        ) : (
          <div className="w-full">
            <ActivityView onBackToTrade={() => setActiveTab('trade')} />
          </div>
        )}
      </main>

      {/* Minimal Clean Footer */}
      <footer className="w-full py-6 border-t border-slate-200/60 bg-white/50 text-center text-xs text-slate-400">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <VeloraLogo size={15} />
            <span className="font-bold text-slate-900">Velora</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-normal">Lowest total execution cost on Solana</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Non-custodial intelligent routing
          </div>
        </div>
      </footer>

      {/* Wallet Connection Modal */}
      <WalletConnectModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <MainApp />
    </WalletProvider>
  );
}
