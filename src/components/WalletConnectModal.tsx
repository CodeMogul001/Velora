import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext.js';
import { X, ShieldCheck, ArrowRight, ExternalLink, Key, Eye, Check } from 'lucide-react';
import VeloraLogo from './VeloraLogo.js';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const {
    connectBrowserWallet,
    connectSessionWallet,
    connectWatchWallet,
    isConnecting,
    network,
    setNetwork,
  } = useWallet();

  const [watchInput, setWatchInput] = useState('');
  const [showWatchForm, setShowWatchForm] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBrowserConnect = async (provider: 'phantom' | 'solflare') => {
    setConnectError(null);
    const success = await connectBrowserWallet(provider);
    if (success) {
      onClose();
    } else {
      setConnectError(
        `${provider === 'phantom' ? 'Phantom' : 'Solflare'} extension not detected in browser. You can install it below or use a Session Wallet.`
      );
    }
  };

  const handleSessionConnect = async () => {
    setConnectError(null);
    await connectSessionWallet();
    onClose();
  };

  const handleWatchConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!watchInput.trim()) return;
    setConnectError(null);
    const success = await connectWatchWallet(watchInput.trim());
    if (success) {
      onClose();
    } else {
      setConnectError('Invalid Solana public address. Please enter a valid base58 address.');
    }
  };

  return (
    <div
      id="wallet-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="wallet-modal-card"
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-slate-900 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <VeloraLogo size={22} />
            <h3 className="font-bold text-base text-slate-900">Connect Solana Wallet</h3>
          </div>
          <button
            id="close-wallet-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Network Selection Pill */}
        <div className="mt-3 flex items-center justify-between bg-slate-50 p-1 rounded-xl border border-slate-100 text-xs">
          <span className="text-[11px] font-semibold text-slate-500 pl-2">Cluster:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setNetwork('mainnet-beta')}
              className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-all ${
                network === 'mainnet-beta'
                  ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Mainnet-beta
            </button>
            <button
              onClick={() => setNetwork('devnet')}
              className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-all ${
                network === 'devnet'
                  ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Devnet
            </button>
          </div>
        </div>

        {connectError && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            {connectError}
          </div>
        )}

        <div className="mt-4 space-y-2">
          {/* Phantom */}
          <button
            id="connect-phantom-btn"
            disabled={isConnecting}
            onClick={() => handleBrowserConnect('phantom')}
            className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-emerald-600/60 hover:bg-emerald-50/20 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#AB9FF2]/20 flex items-center justify-center text-[#5340C6] font-bold text-xs">
                PH
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Phantom
                </div>
                <div className="text-[10px] text-slate-400">Solana browser extension / mobile</div>
              </div>
            </div>
            <ArrowRight size={14} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
          </button>

          {/* Solflare */}
          <button
            id="connect-solflare-btn"
            disabled={isConnecting}
            onClick={() => handleBrowserConnect('solflare')}
            className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-emerald-600/60 hover:bg-emerald-50/20 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FC7226]/20 flex items-center justify-center text-[#FC7226] font-bold text-xs">
                SF
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Solflare
                </div>
                <div className="text-[10px] text-slate-400">Solana non-custodial wallet</div>
              </div>
            </div>
            <ArrowRight size={14} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
          </button>

          {/* Dedicated Non-Custodial Session Keypair */}
          <button
            id="connect-session-wallet-btn"
            disabled={isConnecting}
            onClick={handleSessionConnect}
            className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-emerald-600/60 hover:bg-emerald-50/20 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold text-xs">
                <Key size={15} />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Solana Session Keypair
                </div>
                <div className="text-[10px] text-slate-400">Real ed25519 signer generated on Solana</div>
              </div>
            </div>
            <ArrowRight size={14} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
          </button>

          {/* Custom Watch Address */}
          {!showWatchForm ? (
            <button
              onClick={() => setShowWatchForm(true)}
              className="w-full py-2 px-3 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <Eye size={13} />
              <span>Or inspect any Solana address (Watch mode)</span>
            </button>
          ) : (
            <form onSubmit={handleWatchConnect} className="pt-2 space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Paste Solana public address..."
                  value={watchInput}
                  onChange={(e) => setWatchInput(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-800"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  Load Balances
                </button>
                <button
                  type="button"
                  onClick={() => setShowWatchForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
            <span>Non-custodial</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://phantom.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-700 underline flex items-center gap-0.5"
            >
              <span>Get Phantom</span>
              <ExternalLink size={9} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
