import React, { useState, useMemo } from 'react';
import { Asset } from '../types.js';
import { useWallet } from '../context/WalletContext.js';
import { Search, X, Check } from 'lucide-react';
import { formatUsd } from '../utils/formatters.js';
import { getAssetBadgeClasses } from '../utils/tokenColors.js';

interface AssetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: Asset) => void;
  selectedSymbol: string;
  disabledSymbol?: string;
  assets: Asset[];
}

export default function AssetSelectorModal({
  isOpen,
  onClose,
  onSelect,
  selectedSymbol,
  disabledSymbol,
  assets,
}: AssetSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { getAssetBalance } = useWallet();

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const q = searchQuery.toLowerCase();
      return (
        asset.name.toLowerCase().includes(q) ||
        asset.ticker.toLowerCase().includes(q) ||
        asset.symbol.toLowerCase().includes(q)
      );
    });
  }, [assets, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      id="asset-selector-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="asset-selector-modal"
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-200/90 flex flex-col max-h-[80vh] overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 pb-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Select an asset</h3>
          <button
            id="close-asset-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Input per Section 10 */}
        <div className="p-3.5 pb-2">
          <div className="relative flex items-center">
            <Search size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              id="asset-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or ticker..."
              autoFocus
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Asset List */}
        <div id="asset-list-container" className="flex-1 overflow-y-auto p-2 divide-y divide-slate-50">
          {filteredAssets.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              No assets found matching "{searchQuery}"
            </div>
          ) : (
            filteredAssets.map((asset) => {
              const isSelected = asset.symbol === selectedSymbol;
              const isDisabled = asset.symbol === disabledSymbol;
              const balance = getAssetBalance(asset.symbol);
              const balanceUsd = balance * asset.priceUsd;

              return (
                <button
                  key={asset.symbol}
                  id={`asset-option-${asset.symbol}`}
                  disabled={isDisabled}
                  onClick={() => {
                    onSelect(asset);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left ${
                    isDisabled
                      ? 'opacity-35 cursor-not-allowed bg-slate-50/50'
                      : isSelected
                      ? 'bg-slate-100/80 border border-slate-200'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Left: Badge, Ticker, Name */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs border ${getAssetBadgeClasses(asset.symbol)}`}
                    >
                      {asset.ticker.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs text-slate-900">
                          {asset.ticker}
                        </span>
                        {isSelected && (
                          <Check size={12} className="text-emerald-600" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                        {asset.name}
                      </div>
                    </div>
                  </div>

                  {/* Right: Current Price & Available Balance per Section 10 */}
                  <div className="text-right">
                    <div className="font-semibold text-xs text-slate-900">
                      {formatUsd(asset.priceUsd)}
                    </div>
                    {balance > 0 ? (
                      <div className="text-[11px] text-slate-500 font-mono">
                        Balance: {formatUsd(balanceUsd)}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-300">
                        Balance: $0
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
