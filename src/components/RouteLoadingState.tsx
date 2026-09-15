import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';

interface RouteLoadingStateProps {
  fromSymbol: string;
  toSymbol: string;
}

export default function RouteLoadingState({ fromSymbol, toSymbol }: RouteLoadingStateProps) {
  const [step, setStep] = useState<number>(1);

  useEffect(() => {
    // Step progression timer
    const t1 = setTimeout(() => setStep(2), 120);
    const t2 = setTimeout(() => setStep(3), 260);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      id="route-searching-state"
      className="mt-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 animate-in fade-in duration-150"
    >
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
          <Loader2 size={15} className="animate-spin text-slate-800" />
          <span>Finding your best route...</span>
        </h4>
        <span className="text-[11px] text-slate-400 font-mono">
          {fromSymbol} → {toSymbol}
        </span>
      </div>

      {/* Intentional Progress Indicators per Section 7 */}
      <div className="space-y-1.5 text-xs text-slate-600 pl-1">
        {/* Step 1 */}
        <div className="flex items-center gap-2">
          {step >= 2 ? (
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">
              <Check size={10} strokeWidth={3} />
            </span>
          ) : (
            <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px]">
              ●
            </span>
          )}
          <span className={step >= 2 ? 'text-slate-800 font-medium' : 'text-slate-500'}>
            Checking available liquidity
          </span>
        </div>

        {/* Step 2 */}
        <div className="flex items-center gap-2">
          {step >= 3 ? (
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">
              <Check size={10} strokeWidth={3} />
            </span>
          ) : step === 2 ? (
            <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px]">
              ●
            </span>
          ) : (
            <span className="w-4 h-4 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center text-[10px]">
              ○
            </span>
          )}
          <span className={step >= 3 ? 'text-slate-800 font-medium' : 'text-slate-500'}>
            Comparing execution paths
          </span>
        </div>

        {/* Step 3 */}
        <div className="flex items-center gap-2">
          {step >= 3 ? (
            <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px]">
              ●
            </span>
          ) : (
            <span className="w-4 h-4 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center text-[10px]">
              ○
            </span>
          )}
          <span className="text-slate-500">
            Calculating total cost
          </span>
        </div>
      </div>
    </div>
  );
}
