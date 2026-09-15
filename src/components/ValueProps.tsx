import React from 'react';
import { Compass, Eye, ShieldCheck } from 'lucide-react';

export default function ValueProps() {
  return (
    <section id="velora-value-props" className="w-full max-w-2xl mx-auto mt-8 px-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Value Prop 1 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2.5">
            <Compass size={16} />
          </div>
          <h3 className="font-bold text-xs sm:text-sm text-slate-900">
            Best Route
          </h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Velora compares available execution paths across Solana liquidity.
          </p>
        </div>

        {/* Value Prop 2 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-2.5">
            <Eye size={16} />
          </div>
          <h3 className="font-bold text-xs sm:text-sm text-slate-900">
            Transparent Costs
          </h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            See fees, price impact and network costs before signing.
          </p>
        </div>

        {/* Value Prop 3 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2.5">
            <ShieldCheck size={16} />
          </div>
          <h3 className="font-bold text-xs sm:text-sm text-slate-900">
            Non-Custodial
          </h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Your assets stay in your wallet. You approve every transaction.
          </p>
        </div>
      </div>
    </section>
  );
}
