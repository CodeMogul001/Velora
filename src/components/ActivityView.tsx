import React, { useState, useEffect } from 'react';
import { TradeRecord } from '../types.js';
import { useWallet } from '../context/WalletContext.js';
import { formatUsd, timeAgo } from '../utils/formatters.js';
import { ExternalLink, CheckCircle2, History, Copy, Check } from 'lucide-react';

interface ActivityViewProps {
  onBackToTrade: () => void;
}

export default function ActivityView({ onBackToTrade }: ActivityViewProps) {
  const { network } = useWallet();
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/activity');
      const data = await res.json();
      if (data.success && Array.isArray(data.trades)) {
        setTrades(data.trades);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  const handleCopySig = (tradeId: string, sig: string) => {
    navigator.clipboard.writeText(sig);
    setCopiedId(tradeId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="activity-screen-container" className="w-full max-w-lg mx-auto py-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Activity
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-200/70 capitalize">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {network === 'devnet' ? 'Devnet' : 'Mainnet'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Confirmed transactions on Solana {network === 'devnet' ? 'Devnet' : 'Mainnet'}
          </p>
        </div>
        <button
          id="activity-back-to-trade-btn"
          onClick={onBackToTrade}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
        >
          Back to Trade
        </button>
      </div>

      {/* Activity List Card */}
      <div
        id="activity-list-card"
        className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/80"
      >
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-800 animate-spin" />
            <span>Loading trade history...</span>
          </div>
        ) : trades.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <History size={26} className="mx-auto text-slate-300" />
            <p className="text-xs">No executed trades yet on Solana.</p>
            <button
              onClick={onBackToTrade}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xs hover:bg-slate-800 transition-colors"
            >
              Start trading
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {trades.map((trade) => {
              const isDevnet = trade.cluster === 'devnet';
              const explorerUrl = isDevnet
                ? trade.explorerUrl.includes('cluster=devnet')
                  ? trade.explorerUrl
                  : `${trade.explorerUrl}?cluster=devnet`
                : trade.explorerUrl.replace('?cluster=devnet', '');

              const isCopied = copiedId === trade.id;

              return (
                <div
                  key={trade.id}
                  id={`activity-row-${trade.id}`}
                  className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between text-xs"
                >
                  {/* Left: Asset pair, Provider, Date/Time */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {trade.fromSymbol} → {trade.toSymbol}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 font-mono capitalize">
                        {trade.cluster || 'Solana'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {trade.provider || 'Solana DEX'}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 size={11} /> Confirmed
                      </span>
                      <span>•</span>
                      <span className="text-slate-400 font-mono">
                        {timeAgo(trade.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Amount & View Solana transaction link */}
                  <div className="text-right space-y-1.5">
                    <div className="font-bold text-sm text-slate-900">
                      {formatUsd(trade.fromUsd)}
                    </div>
                    <div className="flex items-center justify-end gap-2 text-[11px]">
                      <button
                        onClick={() => handleCopySig(trade.id, trade.signature)}
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"
                        title="Copy Solana signature"
                      >
                        {isCopied ? (
                          <Check size={10} className="text-emerald-600" />
                        ) : (
                          <Copy size={10} />
                        )}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                      <span className="text-slate-300">|</span>
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-semibold underline underline-offset-2"
                        title="Open in Solana Explorer"
                      >
                        <span>Solana Explorer</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
