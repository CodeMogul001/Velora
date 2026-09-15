import React, { useState, useEffect, useRef } from 'react';
import { Asset, ExecutionRoute, QuoteResponse } from '../types.js';
import { useWallet } from '../context/WalletContext.js';
import { formatUsd, formatTokenAmount } from '../utils/formatters.js';
import { getAssetBadgeClasses } from '../utils/tokenColors.js';
import RouteComparison from './RouteComparison.js';
import RouteLoadingState from './RouteLoadingState.js';
import ExecutionModal from './ExecutionModal.js';
import AssetSelectorModal from './AssetSelectorModal.js';
import {
  ArrowUpDown,
  ChevronDown,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Zap,
} from 'lucide-react';

interface TradeCardProps {
  assets: Asset[];
  onOpenWalletModal: () => void;
  onTradeCompleted: () => void;
  sellAssetOverride?: Asset | null;
  onClearSellAssetOverride?: () => void;
}

export default function TradeCard({
  assets,
  onOpenWalletModal,
  onTradeCompleted,
  sellAssetOverride,
  onClearSellAssetOverride,
}: TradeCardProps) {
  const { connected, getAssetBalance } = useWallet();

  // Selected Assets (Default NVDAx and AAPLx)
  const [sellAsset, setSellAsset] = useState<Asset>(() => {
    return (
      assets.find((a) => a.symbol === 'NVDAx' || a.symbol === 'NVDA') ||
      assets[0] ||
      ({} as Asset)
    );
  });
  const [receiveAsset, setReceiveAsset] = useState<Asset>(() => {
    return (
      assets.find((a) => a.symbol === 'AAPLx' || a.symbol === 'AAPL') ||
      assets[1] ||
      ({} as Asset)
    );
  });

  // Handle external asset selection from Portfolio
  useEffect(() => {
    if (sellAssetOverride) {
      setSellAsset(sellAssetOverride);
      if (receiveAsset.symbol === sellAssetOverride.symbol) {
        const alt = assets.find((a) => a.symbol !== sellAssetOverride.symbol) || assets[0];
        setReceiveAsset(alt);
      }
      onClearSellAssetOverride?.();
    }
  }, [sellAssetOverride, assets, receiveAsset, onClearSellAssetOverride]);

  // Keep assets initialized once loaded
  useEffect(() => {
    if (assets.length > 0 && !sellAsset.symbol) {
      const nvda = assets.find((a) => a.symbol === 'NVDAx' || a.symbol === 'NVDA') || assets[0];
      const aapl = assets.find((a) => a.symbol === 'AAPLx' || a.symbol === 'AAPL') || assets[1];
      setSellAsset(nvda);
      setReceiveAsset(aapl);
    }
  }, [assets, sellAsset]);

  // Amount inputs & Mode (USD vs Token)
  const [isUsdMode, setIsUsdMode] = useState<boolean>(true);
  const [inputValue, setInputValue] = useState<string>('1000');

  // Asset Modals
  const [modalType, setModalType] = useState<'sell' | 'receive' | null>(null);

  // Quotes and Routes state
  const [isSearchingRoute, setIsSearchingRoute] = useState<boolean>(false);
  const [quoteData, setQuoteData] = useState<QuoteResponse | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<ExecutionRoute | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [hasSearchedAtLeastOnce, setHasSearchedAtLeastOnce] = useState<boolean>(false);

  // Execution Modal
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState<boolean>(false);

  // Switch animation trigger
  const [isRotating, setIsRotating] = useState(false);

  // Debounced quote search
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchQuote = async (
    fromSym: string,
    toSym: string,
    amountStr: string,
    usdMode: boolean
  ) => {
    const num = parseFloat(amountStr);
    if (isNaN(num) || num <= 0 || fromSym === toSym) {
      setQuoteData(null);
      setSelectedRoute(null);
      setIsSearchingRoute(false);
      setQuoteError(null);
      return;
    }

    setIsSearchingRoute(true);
    setQuoteError(null);

    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromSymbol: fromSym,
          toSymbol: toSym,
          amount: num,
          isUsdMode: usdMode,
        }),
      });

      const data = await res.json();
      if (data.success && data.quote) {
        setQuoteData(data.quote);
        setSelectedRoute(data.quote.bestRoute);
        setHasSearchedAtLeastOnce(true);
      } else {
        setQuoteError(data.error || "Velora couldn't find enough liquidity for this trade.");
        setQuoteData(null);
        setSelectedRoute(null);
      }
    } catch {
      setQuoteError('Solana connection temporarily unavailable. Try again.');
      setQuoteData(null);
      setSelectedRoute(null);
    } finally {
      setIsSearchingRoute(false);
    }
  };

  useEffect(() => {
    if (!sellAsset?.symbol || !receiveAsset?.symbol) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchQuote(sellAsset.symbol, receiveAsset.symbol, inputValue, isUsdMode);
    }, 320);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [sellAsset?.symbol, receiveAsset?.symbol, inputValue, isUsdMode]);

  // Balance calculations
  const sellBalance = sellAsset?.symbol ? getAssetBalance(sellAsset.symbol) : 0;
  const sellBalanceUsd = sellAsset?.priceUsd ? sellBalance * sellAsset.priceUsd : 0;

  // Percentage quick-buttons
  const handlePercentageSelect = (pct: number) => {
    if (sellBalance <= 0) {
      setInputValue('100');
      return;
    }
    const tokenAmount = sellBalance * (pct / 100);
    if (isUsdMode) {
      const usdVal = tokenAmount * (sellAsset.priceUsd || 1);
      setInputValue(usdVal.toFixed(2));
    } else {
      setInputValue(tokenAmount.toFixed(4));
    }
  };

  // Swap sell and receive assets
  const handleSwitchAssets = () => {
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 300);

    const prevSell = sellAsset;
    const prevReceive = receiveAsset;
    setSellAsset(prevReceive);
    setReceiveAsset(prevSell);
  };

  // Balance validation
  const parsedInput = parseFloat(inputValue) || 0;
  const sellInputTokenEquiv = isUsdMode
    ? sellAsset?.priceUsd
      ? parsedInput / sellAsset.priceUsd
      : 0
    : parsedInput;
  const hasInsufficientBalance = connected && sellBalance > 0 && sellInputTokenEquiv > sellBalance;

  // Active route
  const activeRoute = selectedRoute || quoteData?.bestRoute;

  // Handle execution request
  const handleUseRoute = (route: ExecutionRoute) => {
    if (!connected) {
      onOpenWalletModal();
      return;
    }
    setSelectedRoute(route);
    setIsExecutionModalOpen(true);
  };

  return (
    <div id="trade-screen-container" className="w-full max-w-md mx-auto">
      {/* Centered Compact Trading Card per Section 4 */}
      <div
        id="main-trading-card"
        className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 relative"
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
              Trade
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Find the lowest-cost way to trade tokenized stocks.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50/80 px-2 py-1 rounded-full border border-emerald-200/60 shrink-0">
            <Zap size={11} className="text-amber-500 fill-amber-400" />
            <span>Turbo Execution</span>
          </div>
        </div>

        {/* 1. SELL SECTION */}
        <div
          id="sell-asset-card"
          className={`p-3.5 rounded-2xl border transition-all ${
            hasInsufficientBalance
              ? 'bg-rose-50/30 border-rose-200'
              : 'bg-slate-50/70 border-slate-100 hover:border-slate-200'
          }`}
        >
          {/* Label & Available Balance */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold text-slate-700">Sell</span>
            {connected ? (
              <span className="text-[11px] text-slate-400">
                Balance:{' '}
                <span className="font-mono font-medium text-slate-700">
                  {formatTokenAmount(sellBalance, 3)} {sellAsset.ticker}
                </span>{' '}
                <span className="text-slate-400">({formatUsd(sellBalanceUsd)})</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-mono">
                Price: {formatUsd(sellAsset.priceUsd || 0)}
              </span>
            )}
          </div>

          {/* Asset Selector & Amount */}
          <div className="flex items-center justify-between gap-3">
            {/* Asset Selector */}
            <button
              id="select-sell-asset-btn"
              type="button"
              onClick={() => setModalType('sell')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs transition-all shrink-0 group"
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] border ${getAssetBadgeClasses(sellAsset.symbol)}`}
              >
                {sellAsset.ticker?.slice(0, 2) || 'TK'}
              </div>
              <span className="font-bold text-xs text-slate-900 group-hover:text-slate-700">
                {sellAsset.ticker}
              </span>
              <ChevronDown size={13} className="text-slate-400 group-hover:text-slate-600" />
            </button>

            {/* Input field */}
            <div className="flex-1 text-right">
              <div className="relative inline-flex items-center justify-end w-full">
                {isUsdMode && (
                  <span className="text-xl font-bold text-slate-400 mr-1 select-none">
                    $
                  </span>
                )}
                <input
                  id="sell-amount-input"
                  type="number"
                  step="any"
                  min="0"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-right text-2xl font-black text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-300 tracking-tight"
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                {isUsdMode ? (
                  <span>
                    ≈ {formatTokenAmount(sellInputTokenEquiv)} {sellAsset.ticker}
                  </span>
                ) : (
                  <span>
                    ≈ {formatUsd(sellInputTokenEquiv * (sellAsset.priceUsd || 0))}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Presets & Mode Toggle */}
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200/50 text-[11px]">
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setIsUsdMode(true)}
                className={`px-1.5 py-0.5 rounded ${isUsdMode ? 'bg-slate-900 text-white' : ''}`}
              >
                USD
              </button>
              <button
                type="button"
                onClick={() => setIsUsdMode(false)}
                className={`px-1.5 py-0.5 rounded ${!isUsdMode ? 'bg-slate-900 text-white' : ''}`}
              >
                {sellAsset.ticker}
              </button>
            </div>

            <div className="flex items-center gap-1">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handlePercentageSelect(pct)}
                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200"
                >
                  {pct === 100 ? 'MAX' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. SWITCH BUTTON */}
        <div className="relative flex justify-center -my-2.5 z-10">
          <button
            id="switch-assets-btn"
            type="button"
            onClick={handleSwitchAssets}
            className={`w-8 h-8 rounded-full bg-white border border-slate-200 hover:border-slate-300 shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-900 hover:scale-105 active:scale-95 transition-all ${
              isRotating ? 'rotate-180 duration-300' : ''
            }`}
            title="Switch assets"
          >
            <ArrowUpDown size={14} />
          </button>
        </div>

        {/* 3. RECEIVE SECTION */}
        <div
          id="receive-asset-card"
          className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold text-slate-700">Receive</span>
            <span className="text-[11px] font-medium text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100">
              Estimated
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              id="select-receive-asset-btn"
              type="button"
              onClick={() => setModalType('receive')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs transition-all shrink-0 group"
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] border ${getAssetBadgeClasses(receiveAsset.symbol)}`}
              >
                {receiveAsset.ticker?.slice(0, 2) || 'TK'}
              </div>
              <span className="font-bold text-xs text-slate-900 group-hover:text-slate-700">
                {receiveAsset.ticker}
              </span>
              <ChevronDown size={13} className="text-slate-400 group-hover:text-slate-600" />
            </button>

            <div className="flex-1 text-right">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {isSearchingRoute ? (
                  <span className="text-slate-300 animate-pulse text-xl">...</span>
                ) : activeRoute ? (
                  formatUsd(activeRoute.expectedOutputUsd)
                ) : (
                  '$0.00'
                )}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                {activeRoute ? (
                  <span>
                    ≈ {formatTokenAmount(activeRoute.expectedOutputAmount)}{' '}
                    {receiveAsset.ticker}
                  </span>
                ) : (
                  <span>Estimated output</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200/50 text-[11px]">
            <span className="text-slate-400">
              1 {receiveAsset.ticker} = {formatUsd(receiveAsset.priceUsd || 0)}
            </span>
            <span
              className={`inline-flex items-center font-semibold ${
                (receiveAsset.change24h || 0) >= 0 ? 'text-emerald-600' : 'text-rose-500'
              }`}
            >
              {(receiveAsset.change24h || 0) >= 0 ? (
                <TrendingUp size={10} className="mr-0.5" />
              ) : (
                <TrendingDown size={10} className="mr-0.5" />
              )}
              {receiveAsset.change24h ? `${receiveAsset.change24h > 0 ? '+' : ''}${receiveAsset.change24h}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Balance alert if needed */}
        {hasInsufficientBalance && (
          <div
            id="insufficient-balance-alert"
            className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2"
          >
            <AlertCircle size={14} className="text-rose-600 shrink-0" />
            <span>You don't have enough {sellAsset.ticker} to complete this trade.</span>
          </div>
        )}

        {/* Error message */}
        {quoteError && !hasInsufficientBalance && (
          <div
            id="quote-error-alert"
            className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2"
          >
            <AlertCircle size={14} className="text-amber-600 shrink-0" />
            <span>{quoteError}</span>
          </div>
        )}

        {/* Intentional Loading State per Section 7 */}
        {isSearchingRoute && (
          <RouteLoadingState
            fromSymbol={sellAsset.ticker}
            toSymbol={receiveAsset.ticker}
          />
        )}

        {/* Route Comparison per Section 5 & 6 */}
        {!isSearchingRoute && quoteData && activeRoute && (
          <RouteComparison
            routes={quoteData.allRoutes}
            selectedRoute={activeRoute}
            providerStatuses={quoteData.providerStatuses}
            onSelectRoute={(r) => setSelectedRoute(r)}
            onUseRoute={handleUseRoute}
            outputSymbol={receiveAsset.ticker}
            inputSymbol={sellAsset.ticker}
          />
        )}

        {/* Fallback button when not yet searched or when comparing */}
        {!isSearchingRoute && !quoteData && !hasInsufficientBalance && (
          <div className="mt-4">
            <button
              id="find-best-route-btn"
              type="button"
              disabled={parseFloat(inputValue) <= 0}
              onClick={() => fetchQuote(sellAsset.symbol, receiveAsset.symbol, inputValue, isUsdMode)}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Zap size={14} className="text-emerald-400" />
              <span>Find best route</span>
            </button>
          </div>
        )}
      </div>

      {/* Asset Selection Modal */}
      {modalType && (
        <AssetSelectorModal
          isOpen={true}
          onClose={() => setModalType(null)}
          assets={assets}
          selectedSymbol={modalType === 'sell' ? sellAsset.symbol : receiveAsset.symbol}
          disabledSymbol={modalType === 'sell' ? receiveAsset.symbol : sellAsset.symbol}
          onSelect={(selected) => {
            if (modalType === 'sell') {
              setSellAsset(selected);
            } else {
              setReceiveAsset(selected);
            }
          }}
        />
      )}

      {/* Execution Modal per Section 8 */}
      {isExecutionModalOpen && activeRoute && (
        <ExecutionModal
          isOpen={isExecutionModalOpen}
          onClose={() => setIsExecutionModalOpen(false)}
          route={activeRoute}
          fromSymbol={sellAsset.ticker}
          toSymbol={receiveAsset.ticker}
          onTradeSuccess={() => {
            onTradeCompleted();
          }}
        />
      )}
    </div>
  );
}
