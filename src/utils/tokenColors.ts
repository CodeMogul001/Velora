export function getAssetBadgeClasses(symbol: string): string {
  switch (symbol?.toUpperCase()) {
    case 'NVDA':
      return 'bg-lime-50 text-lime-700 border-lime-200';
    case 'AAPL':
      return 'bg-slate-100 text-slate-800 border-slate-300';
    case 'MSFT':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'TSLA':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'AMZN':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'GOOGL':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'META':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'COIN':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'MSTR':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'USDC':
      return 'bg-cyan-50 text-cyan-800 border-cyan-200';
    case 'SOL':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getAssetDotClasses(symbol: string): string {
  switch (symbol?.toUpperCase()) {
    case 'NVDA':
      return 'bg-lime-500';
    case 'AAPL':
      return 'bg-slate-700';
    case 'MSFT':
      return 'bg-sky-500';
    case 'TSLA':
      return 'bg-rose-600';
    case 'AMZN':
      return 'bg-amber-500';
    case 'GOOGL':
      return 'bg-blue-600';
    case 'META':
      return 'bg-indigo-600';
    case 'COIN':
      return 'bg-blue-500';
    case 'MSTR':
      return 'bg-red-600';
    case 'USDC':
      return 'bg-cyan-600';
    case 'SOL':
      return 'bg-emerald-500';
    default:
      return 'bg-slate-500';
  }
}
