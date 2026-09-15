import React from 'react';
import { Asset } from '../types.js';
import { useWallet } from '../context/WalletContext.js';
import { formatUsd, formatTokenAmount } from '../utils/formatters.js';
import { getAssetDotClasses, getAssetBadgeClasses } from '../utils/tokenColors.js';
import { Wallet, ArrowRight, WalletCards } from 'lucide-react';

interface PortfolioViewProps {
  assets: Asset[];
  onSelectSellAsset: (asset: Asset) => void;
  onOpenWalletModal: () => void;
}

export default function PortfolioView({
  assets,
  onSelectSellAsset,
  onOpenWalletModal,
}: PortfolioViewProps) {
  const { connected, getAssetBalance, shortAddress } = useWallet();

  // Compute holdings
  const holdings = assets
    .map((asset) => {
      const balance = getAssetBalance(asset.symbol);
      const usdValue = balance * asset.priceUsd;
      return { asset, balance, usdValue };
    })
    .filter((h) => h.balance > 0)
    .sort((a, b) => b.usdValue - a.usdValue);

  const totalValueUsd = holdings.reduce((sum, h) => sum + h.usdValue, 0);

  if (!connected) {
    return (
      <div id="portfolio-not-connected-view" className="w-full max-w-lg mx-auto py-8 text-center">
        <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-600 mb-3">
            <Wallet size={22} />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Your portfolio</h2>
          <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
            Connect your Solana wallet to view your tokenized stock balances and trade them at the best price.
          </p>
          <div className="mt-4">
            <button
              onClick={onOpenWalletModal}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
            >
              Connect wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="portfolio-view-container" className="w-full max-w-lg mx-auto py-2">
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-500">Your portfolio</h2>
            <div className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {formatUsd(totalValueUsd)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              {shortAddress}
            </span>
          </div>
        </div>

        {/* Holdings List */}
        <div className="mt-4 space-y-2.5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Holdings
          </div>
          {holdings.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No tokenized stock balances found in this wallet.
            </div>
          ) : (
            holdings.map(({ asset, balance, usdValue }) => (
              <div
                key={asset.symbol}
                id={`portfolio-holding-${asset.symbol}`}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/60 hover:bg-slate-100/70 border border-slate-100 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border ${getAssetBadgeClasses(asset.symbol)}`}
                  >
                    {asset.ticker.slice(0, 3)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <span>{asset.ticker}</span>
                      <span className="text-xs font-normal text-slate-400">—</span>
                      <span className="text-xs font-medium text-slate-600">{asset.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {formatTokenAmount(balance, 3)} {asset.ticker} @ {formatUsd(asset.priceUsd)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-sm text-slate-900">
                      {formatUsd(usdValue)}
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectSellAsset(asset)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-900 hover:text-white border border-slate-200 text-slate-800 text-xs font-semibold transition-all shadow-2xs flex items-center gap-1"
                  >
                    <span>Trade</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
