import { Asset } from '../types.js';
import { useWallet } from '../context/WalletContext.js';
import { formatUsd, formatTokenAmount } from '../utils/formatters.js';
import { getAssetDotClasses } from '../utils/tokenColors.js';
import { WalletCards } from 'lucide-react';

interface PortfolioMiniProps {
  assets: Asset[];
  onSelectSellAsset: (asset: Asset) => void;
}

export default function PortfolioMini({ assets, onSelectSellAsset }: PortfolioMiniProps) {
  const { connected, getAssetBalance } = useWallet();

  if (!connected) return null;

  // Filter assets where user has balance > 0, sorted by USD value
  const userHoldings = assets
    .map((asset) => {
      const balance = getAssetBalance(asset.symbol);
      const usdValue = balance * asset.priceUsd;
      return { asset, balance, usdValue };
    })
    .filter((item) => item.balance > 0)
    .sort((a, b) => b.usdValue - a.usdValue);

  if (userHoldings.length === 0) return null;

  return (
    <div id="portfolio-mini-section" className="w-full max-w-lg mx-auto mt-5 px-1">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <WalletCards size={13} className="text-slate-400" />
          <span>Your assets</span>
        </div>
        <span className="text-[11px] text-slate-400">Click to sell</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {userHoldings.map(({ asset, balance, usdValue }) => (
          <button
            key={asset.symbol}
            id={`mini-asset-chip-${asset.symbol}`}
            onClick={() => onSelectSellAsset(asset)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:border-emerald-500/50 hover:bg-emerald-50/15 transition-all text-xs shrink-0 shadow-2xs group"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${getAssetDotClasses(asset.symbol)}`}
            />
            <span className="font-bold text-slate-800 group-hover:text-emerald-700">
              {asset.ticker}
            </span>
            <span className="font-semibold text-slate-900">
              {formatUsd(usdValue)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({formatTokenAmount(balance, 2)})
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
