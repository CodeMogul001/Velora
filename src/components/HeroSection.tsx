import React from 'react';
import { useWallet } from '../context/WalletContext.js';
import { ArrowRight, Sparkles, Shield, Wallet } from 'lucide-react';
import VeloraLogo from './VeloraLogo.js';

interface HeroSectionProps {
  onStartTrading: () => void;
  onOpenWalletModal: () => void;
}

export default function HeroSection({
  onStartTrading,
  onOpenWalletModal,
}: HeroSectionProps) {
  const { connected } = useWallet();

  return (
    <section id="velora-hero-section" className="w-full max-w-2xl mx-auto text-center pt-2 pb-6 px-4">
      {/* Hero Headline */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.15]">
        Trade tokenized stocks smarter.
      </h1>

      {/* Supporting Text */}
      <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
        Velora finds the lowest-cost route across available Solana liquidity, so you receive more from every trade.
      </p>

      {/* Call to Actions */}
      <div className="mt-5 flex items-center justify-center gap-3">
        <button
          id="hero-start-trading-btn"
          type="button"
          onClick={onStartTrading}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
        >
          Start trading
        </button>

        {!connected && (
          <button
            id="hero-connect-wallet-btn"
            type="button"
            onClick={onOpenWalletModal}
            className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] text-slate-800 text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5"
          >
            <Wallet size={14} className="text-slate-500" />
            <span>Connect wallet</span>
          </button>
        )}
      </div>

      {/* Visual Representation: NVDAx → Velora → AAPLx */}
      <div className="mt-6 inline-flex flex-col items-center">
        <div className="px-4 py-2 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-2 text-xs font-mono text-slate-800">
          <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200/60 text-emerald-800">
            NVDAx
          </span>
          <ArrowRight size={13} className="text-slate-400" />
          <span className="inline-flex items-center gap-1 font-sans font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            <VeloraLogo size={14} />
            Velora
          </span>
          <ArrowRight size={13} className="text-slate-400" />
          <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-blue-50 border border-blue-200/60 text-blue-800">
            AAPLx
          </span>
        </div>
        <span className="mt-1.5 text-[11px] text-slate-400 font-medium">
          Comparing available routes...
        </span>
      </div>
    </section>
  );
}
