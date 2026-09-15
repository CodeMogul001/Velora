import React, { useState } from 'react';
import { ExecutionRoute, ProviderStatus } from '../types.js';
import { formatUsd, formatTokenAmount } from '../utils/formatters.js';
import {
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Zap,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface RouteComparisonProps {
  routes: ExecutionRoute[];
  selectedRoute: ExecutionRoute;
  providerStatuses?: ProviderStatus[];
  onSelectRoute: (route: ExecutionRoute) => void;
  onUseRoute: (route: ExecutionRoute) => void;
  outputSymbol: string;
  inputSymbol: string;
  isExecuting?: boolean;
}

export default function RouteComparison({
  routes,
  selectedRoute,
  providerStatuses = [],
  onSelectRoute,
  onUseRoute,
  outputSymbol,
  inputSymbol,
  isExecuting = false,
}: RouteComparisonProps) {
  const [showTradeDetails, setShowTradeDetails] = useState(false);
  const [showProviders, setShowProviders] = useState(false);

  if (!routes || routes.length === 0) return null;

  const bestRoute = routes[0];
  const isViewingBest = selectedRoute.id === bestRoute.id;
  const alternativeRoutes = routes.filter((r) => r.id !== selectedRoute.id);

  const unavailableProviders = providerStatuses.filter((p) => !p.available);

  return (
    <div id="route-comparison-module" className="mt-5 space-y-4">
      {/* 1. SELECTED / BEST ROUTE CARD */}
      <div
        id="active-route-card"
        className="p-4 sm:p-5 rounded-3xl border-2 border-emerald-500/40 bg-emerald-50/15 shadow-xs transition-all"
      >
        {/* Top Header: Label & Provider */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs sm:text-sm text-slate-900">
              {isViewingBest ? 'Best route' : 'Selected route'}
            </span>
            {isViewingBest && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] tracking-wide">
                Lowest cost
              </span>
            )}
          </div>

          <span className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 font-semibold text-xs text-slate-700 shadow-2xs">
            {selectedRoute.provider || 'Solana DEX'}
          </span>
        </div>

        {/* Route Path: NVDAx → USDC → AAPLx */}
        <div className="mt-2.5 flex items-center flex-wrap gap-1.5 text-xs font-mono text-slate-800">
          {selectedRoute.routePath.map((token, hopIdx) => (
            <React.Fragment key={hopIdx}>
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-[11px] text-slate-800 shadow-2xs">
                {token}
              </span>
              {hopIdx < selectedRoute.routePath.length - 1 && (
                <ArrowRight size={12} className="text-slate-400 shrink-0" />
              )}
            </React.Fragment>
          ))}
          <span className="text-[11px] text-slate-400 ml-1 font-sans">
            via {selectedRoute.routeHops.map((h) => h.dexShort).join(' + ')}
          </span>
        </div>

        {/* Key Metrics: You Receive, Total Cost, You Save */}
        <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-white border border-slate-200/80 text-xs">
          <div>
            <div className="text-slate-400 text-[11px] font-medium">You receive</div>
            <div className="mt-0.5 text-base sm:text-lg font-black text-emerald-700 tracking-tight">
              {formatUsd(selectedRoute.expectedOutputUsd)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              ≈ {formatTokenAmount(selectedRoute.expectedOutputAmount)} {outputSymbol}
            </div>
          </div>

          <div>
            <div className="text-slate-400 text-[11px] font-medium">Total cost</div>
            <div className="mt-0.5 text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {formatUsd(selectedRoute.totalCostUsd)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              All fees included
            </div>
          </div>

          {selectedRoute.savingsUsd > 0 && (
            <div className="col-span-2 sm:col-span-1 flex flex-col justify-center">
              <div className="text-slate-400 text-[11px] font-medium">You save</div>
              <div className="mt-0.5 inline-flex items-center gap-1 font-bold text-xs sm:text-sm text-emerald-700">
                <Sparkles size={12} className="text-emerald-600 shrink-0" />
                <span>{formatUsd(selectedRoute.savingsUsd)} vs next route</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Button: Use This Route */}
        <div className="mt-3.5">
          <button
            id="use-this-route-btn"
            type="button"
            disabled={isExecuting}
            onClick={() => onUseRoute(selectedRoute)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Zap size={14} className="text-emerald-400" />
            <span>Execute this route</span>
          </button>
        </div>

        {/* Collapsible: Trade details */}
        <div className="mt-3 pt-2.5 border-t border-slate-200/60">
          <button
            id="toggle-trade-details-btn"
            type="button"
            onClick={() => setShowTradeDetails(!showTradeDetails)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <span>Trade details</span>
            <span className="flex items-center gap-0.5 text-slate-400">
              <span className="text-[11px]">{showTradeDetails ? 'Hide' : 'Show'}</span>
              {showTradeDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </span>
          </button>

          {showTradeDetails && (
            <div
              id="trade-details-breakdown"
              className="mt-2.5 space-y-1.5 text-xs text-slate-500 bg-white/80 p-3 rounded-2xl border border-slate-100 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span>Input amount</span>
                <span className="font-medium text-slate-800">
                  {formatUsd(selectedRoute.inputAmountUsd)} ({formatTokenAmount(selectedRoute.inputAmount)} {inputSymbol})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Expected output</span>
                <span className="font-semibold text-emerald-700">
                  {formatUsd(selectedRoute.expectedOutputUsd)} ({formatTokenAmount(selectedRoute.expectedOutputAmount)} {outputSymbol})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Trading fee</span>
                <span className="font-medium text-slate-800">
                  {formatUsd(selectedRoute.tradingFeeUsd)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Solana network fee</span>
                <span className="font-medium text-slate-800">
                  {formatUsd(selectedRoute.networkFeeUsd)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Price impact</span>
                <span className="font-medium text-slate-800">
                  {formatUsd(selectedRoute.priceImpactUsd)} ({selectedRoute.priceImpactPercent}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Slippage tolerance</span>
                <span className="font-medium text-slate-800">
                  {selectedRoute.slippagePercent ? `${selectedRoute.slippagePercent}%` : '0.10%'}
                </span>
              </div>
              <div className="flex items-center justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-100">
                <span>Total estimated cost</span>
                <span className="text-slate-900">
                  {formatUsd(selectedRoute.totalCostUsd)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. ALTERNATIVE ROUTES UNDERNEATH */}
      {alternativeRoutes.length > 0 && (
        <div id="alternative-routes-section" className="pt-1">
          <div className="text-xs font-semibold text-slate-500 mb-2 px-1">
            Other available routes
          </div>

          <div className="space-y-2">
            {alternativeRoutes.map((route) => (
              <div
                key={route.id}
                id={`route-alt-${route.id}`}
                onClick={() => onSelectRoute(route)}
                className="p-3 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50 transition-all cursor-pointer flex items-center justify-between text-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-slate-800 text-xs px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200/60">
                    {route.provider || 'Solana DEX'}
                  </span>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                    {route.routePath.map((t, i) => (
                      <React.Fragment key={i}>
                        <span>{t}</span>
                        {i < route.routePath.length - 1 && (
                          <ArrowRight size={10} className="text-slate-400" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-semibold text-slate-800">
                      Receive {formatUsd(route.expectedOutputUsd)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Cost: {formatUsd(route.totalCostUsd)}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-900 border border-slate-200 group-hover:border-slate-300 px-2 py-1 rounded-lg bg-white transition-colors">
                    Select
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. EXECUTION PROVIDERS STATUS BAR (Transparency) */}
      {providerStatuses.length > 0 && (
        <div className="pt-1">
          <button
            onClick={() => setShowProviders(!showProviders)}
            className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 px-1 transition-colors"
          >
            <span>Provider health ({providerStatuses.filter((p) => p.available).length}/{providerStatuses.length} queried)</span>
            {showProviders ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          {showProviders && (
            <div className="mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] space-y-1.5 animate-in fade-in duration-150">
              {providerStatuses.map((p) => (
                <div key={p.name} className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-1.5">
                    {p.available ? (
                      <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle size={12} className="text-slate-400 shrink-0" />
                    )}
                    <span className="font-semibold text-slate-700">{p.name}</span>
                  </div>
                  <span className={`text-[10px] ${p.available ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {p.statusMessage}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
