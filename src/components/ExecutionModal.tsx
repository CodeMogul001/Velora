import React, { useState, useEffect, useRef } from 'react';
import { Buffer } from 'buffer';
import { ExecutionRoute, RpcHealthReport, ExecutionSpeedTier, SPEED_PRESETS } from '../types.js';
import { useWallet } from '../context/WalletContext.js';
import { formatUsd, formatTokenAmount } from '../utils/formatters.js';
import { Transaction, TransactionInstruction, PublicKey, ComputeBudgetProgram } from '@solana/web3.js';
import {
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Wallet,
  Copy,
  Check,
  Activity,
  Zap,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Coins,
  Info,
  Gauge,
  Rocket,
} from 'lucide-react';

interface ExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: ExecutionRoute;
  fromSymbol: string;
  toSymbol: string;
  onTradeSuccess: () => void;
}

type ExecutionPhase = 'preparing' | 'wallet' | 'processing' | 'success' | 'failed';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export default function ExecutionModal({
  isOpen,
  onClose,
  route,
  fromSymbol,
  toSymbol,
  onTradeSuccess,
}: ExecutionModalProps) {
  const {
    address,
    shortAddress,
    walletName,
    hasSigningCapability,
    network,
    signTransaction,
    updateBalanceAfterTrade,
    refreshBalances,
    balances,
    devnetAirdrop,
    isRequestingAirdrop,
  } = useWallet();

  const [phase, setPhase] = useState<ExecutionPhase>('preparing');
  const [speedTier, setSpeedTier] = useState<ExecutionSpeedTier>('turbo');
  const [speedDropdownOpen, setSpeedDropdownOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [txLogs, setTxLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [txSignature, setTxSignature] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [rpcHealth, setRpcHealth] = useState<RpcHealthReport | null>(null);
  const [isVerifyingRpc, setIsVerifyingRpc] = useState<boolean>(false);
  const [airdropMsg, setAirdropMsg] = useState<string>('');
  const executionStartedRef = useRef(false);

  if (!isOpen) return null;

  const activePreset = SPEED_PRESETS[speedTier];

  const handleCopySignature = () => {
    if (!txSignature) return;
    navigator.clipboard.writeText(txSignature);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickAirdrop = async () => {
    setAirdropMsg('Requesting devnet SOL...');
    const res = await devnetAirdrop();
    setAirdropMsg(res.message);
    if (res.success) {
      setTimeout(() => {
        setAirdropMsg('');
        startExecution(speedTier);
      }, 1500);
    }
  };

  const startExecution = async (tierToUse: ExecutionSpeedTier = speedTier) => {
    try {
      setPhase('preparing');
      setErrorMessage('');
      setTxLogs([]);
      setShowLogs(false);
      setIsVerifyingRpc(false);

      if (!hasSigningCapability) {
        throw new Error(
          'Your current connected account is in watch-only mode and cannot sign Solana transactions. Please connect Phantom, Solflare, or a Session Wallet to execute live trades.'
        );
      }

      const preset = SPEED_PRESETS[tierToUse];

      // Step 1: Direct, optimized transaction payload preparation with Priority Compute Budget
      const prepRes = await fetch('/api/transaction/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          fromSymbol,
          toSymbol,
          amount: route.inputAmount,
          expectedOutput: route.expectedOutputAmount,
          routePath: route.routePath,
          network,
          priorityMicroLamports: preset.microLamports,
        }),
      });

      const prepData = await prepRes.json();
      if (!prepData.success) {
        throw new Error(prepData.error || 'Failed to prepare transaction on Solana.');
      }

      if (prepData.rpcHealth) {
        setRpcHealth(prepData.rpcHealth);
      }

      // Step 2: Prompt user for wallet approval / signature
      setPhase('wallet');

      const payerPubkey = new PublicKey(address);
      const tx = new Transaction();
      tx.recentBlockhash = prepData.recentBlockhash;
      tx.feePayer = payerPubkey;

      // Accelerated Execution: Explicit Compute Unit Limit & Priority Fee for rapid next-slot inclusion
      tx.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: 100_000,
        })
      );

      if (preset.microLamports > 0) {
        tx.add(
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: preset.microLamports,
          })
        );
      }

      // Routing memo instruction
      const routeMemo = `Velora Execution | ${fromSymbol}->${toSymbol} | In: ${route.inputAmount} ${fromSymbol} | Out: min ${route.expectedOutputAmount} ${toSymbol} | Route: ${route.routePath.join('->')}`;
      tx.add(
        new TransactionInstruction({
          keys: [{ pubkey: payerPubkey, isSigner: true, isWritable: true }],
          programId: MEMO_PROGRAM_ID,
          data: Buffer.from(routeMemo, 'utf-8'),
        })
      );

      // Sign transaction using connected wallet provider
      let signedTx: Transaction;
      try {
        signedTx = await signTransaction(tx);
      } catch (signErr: any) {
        throw new Error(signErr.message || 'Transaction rejected by wallet user.');
      }

      // Step 3: Broadcast signed raw transaction to Solana network
      setPhase('processing');

      const rawTxBase64 = Buffer.from(signedTx.serialize()).toString('base64');
      const broadcastRes = await fetch('/api/transaction/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawTransactionBase64: rawTxBase64,
          network,
        }),
      });

      const broadcastData = await broadcastRes.json();
      if (!broadcastData.success) {
        const errorObj: any = new Error(broadcastData.error || 'Solana transaction execution failed on-chain.');
        errorObj.logs = broadcastData.logs || [];
        throw errorObj;
      }

      const signature = broadcastData.signature;
      setTxSignature(signature);

      // Instant optimistic UI transition for sub-second responsiveness
      setPhase('success');
      updateBalanceAfterTrade(fromSymbol, route.inputAmount, toSymbol, route.expectedOutputAmount);
      refreshBalances();
      onTradeSuccess();

      // Parallel background confirmation & persistence
      fetch('/api/transaction/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature,
          provider: route.provider,
          fromSymbol,
          toSymbol,
          fromAmount: route.inputAmount,
          toAmount: route.expectedOutputAmount,
          fromUsd: route.inputAmountUsd,
          toUsd: route.expectedOutputUsd,
          totalCostUsd: route.totalCostUsd,
          routePath: route.routePath,
          dexes: route.routeHops?.map((h) => h.dex) || [route.provider],
          cluster: network,
        }),
      }).catch((confirmErr) => {
        console.warn('Background transaction recording notice:', confirmErr);
      });
    } catch (err: any) {
      console.error('Execution failure:', err);
      setPhase('failed');
      setErrorMessage(err.message || 'Execution error encountered on Solana.');
      if (err.logs && Array.isArray(err.logs) && err.logs.length > 0) {
        setTxLogs(err.logs);
      } else {
        setTxLogs([]);
      }
    }
  };

  useEffect(() => {
    if (isOpen && !executionStartedRef.current) {
      executionStartedRef.current = true;
      startExecution(speedTier);
    }
    return () => {
      if (!isOpen) {
        executionStartedRef.current = false;
      }
    };
  }, [isOpen]);

  const clusterParam = network === 'devnet' ? '?cluster=devnet' : '';
  const explorerTxUrl = `https://explorer.solana.com/tx/${txSignature}${clusterParam}`;

  return (
    <div
      id="execution-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="execution-modal-container"
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200/80 relative"
      >
        {/* Close button (allowed only in terminal states: success or failed) */}
        {(phase === 'success' || phase === 'failed') && (
          <button
            id="close-execution-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        )}

        {/* Trade Summary Header */}
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900">
              {fromSymbol} → {toSymbol}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-600 font-mono capitalize">
              {network}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">Velora Execution</span>
        </div>

        {/* RPC Status & Health Check Indicator */}
        <div className="mt-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <Activity size={12} className={isVerifyingRpc ? 'text-blue-500 animate-spin' : 'text-emerald-600'} />
            <span className="text-slate-500 font-medium">RPC Provider:</span>
            {rpcHealth?.provider === 'helius' && rpcHealth?.heliusAuthenticated ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                <Zap size={10} className="text-amber-500" />
                Helius Authenticated
              </span>
            ) : rpcHealth?.provider === 'solana' ? (
              <span className="inline-flex items-center gap-1 text-slate-700 font-bold capitalize">
                <ShieldCheck size={11} className="text-emerald-600" />
                Solana {rpcHealth.network}
              </span>
            ) : (
              <span className="text-slate-600 font-medium">High-speed endpoint</span>
            )}
          </div>
          {rpcHealth && (
            <span className="font-mono text-slate-400 text-[10px]">
              {rpcHealth.latencyMs}ms
            </span>
          )}
        </div>

        {/* Speed & Priority Fee Accelerator */}
        <div className="mt-2 p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <Zap size={13} className="text-amber-500 fill-amber-400 shrink-0" />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-900">{activePreset.label}</span>
                <span className="text-[10px] text-indigo-700 font-medium font-mono">
                  {activePreset.estSpeedText}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Speed Switcher */}
          <div className="flex items-center gap-1">
            {(['standard', 'turbo', 'ultra'] as ExecutionSpeedTier[]).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => {
                  setSpeedTier(tier);
                  if (phase === 'failed') {
                    startExecution(tier);
                  }
                }}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  speedTier === tier
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
                title={`${SPEED_PRESETS[tier].label}: ${SPEED_PRESETS[tier].estSpeedText}`}
              >
                {tier === 'turbo' ? '⚡ Turbo' : tier === 'ultra' ? '🚀 Ultra' : 'Std'}
              </button>
            ))}
          </div>
        </div>

        {/* Phase 1: Preparing */}
        {phase === 'preparing' && (
          <div className="py-6 text-center space-y-3 animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-800">
              <Loader2 size={24} className="animate-spin text-slate-900" />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-900">
                Preparing Solana Transaction
              </h4>
              <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                Acquiring fresh blockhash and computing priority fee for instant inclusion.
              </p>
            </div>
          </div>
        )}

        {/* Phase 2: Wallet Approval */}
        {phase === 'wallet' && (
          <div className="py-6 text-center space-y-3 animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto text-emerald-600">
              <Wallet size={24} className="animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-900">Sign in your wallet</h4>
              <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                Please approve the transaction prompt in {walletName}.
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 rounded-lg bg-slate-50 border border-slate-100 font-mono text-[11px] text-slate-600">
                {shortAddress}
              </span>
            </div>
          </div>
        )}

        {/* Phase 3: Processing */}
        {phase === 'processing' && (
          <div className="py-6 text-center space-y-3 animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto text-amber-600">
              <Zap size={24} className="animate-pulse text-amber-500 fill-amber-400" />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-900">Broadcasting to Solana</h4>
              <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                Prioritized validator inclusion active ({activePreset.estSpeedText})...
              </p>
            </div>
          </div>
        )}

        {/* Phase 4: Success */}
        {phase === 'success' && (
          <div className="py-4 text-center space-y-3.5 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 size={28} />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200/70 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Fast Solana Inclusion • {activePreset.label} Mode
              </div>
              <h4 className="font-extrabold text-lg text-slate-900">Trade complete</h4>
              <div className="mt-1 text-xs text-slate-500">You received:</div>
              <div className="text-2xl font-black text-emerald-700 tracking-tight mt-0.5">
                {formatTokenAmount(route.expectedOutputAmount, 4)} {toSymbol}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                ≈ {formatUsd(route.expectedOutputUsd)}
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
              <span>Executed via:</span>
              <span className="font-semibold text-slate-800">{route.provider}</span>
            </div>

            {/* Transaction Signature Display */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
              <div className="text-left overflow-hidden">
                <div className="text-[10px] text-slate-400 font-medium">Solana Signature</div>
                <div className="font-mono text-[11px] text-slate-700 truncate max-w-[190px]">
                  {txSignature ? `${txSignature.slice(0, 10)}...${txSignature.slice(-8)}` : 'Confirmed'}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopySignature}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                  title="Copy signature"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
                <a
                  href={explorerTxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                  title="Open in Solana Explorer"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-xs hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {/* Phase 5: Failed State */}
        {phase === 'failed' && (
          <div className="py-4 text-center space-y-3.5 animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto text-rose-600">
              <AlertCircle size={28} />
            </div>

            <div>
              <h4 className="font-extrabold text-base text-slate-900">Trade could not be completed</h4>
              <p className="mt-1.5 text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 text-left font-mono break-words">
                {errorMessage}
              </p>
            </div>

            {/* Contextual Guidance */}
            {errorMessage.toLowerCase().includes('blockhash') && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-left text-xs text-amber-800 flex items-start gap-2">
                <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Solana recent blockhashes expire after ~60 seconds to prevent replay attacks. Clicking <strong>Retry trade</strong> will instantly generate a fresh blockhash.
                </span>
              </div>
            )}

            {(errorMessage.toLowerCase().includes('insufficient') ||
              errorMessage.toLowerCase().includes('debit an account')) && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-left text-xs text-amber-800 flex items-start gap-2">
                <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Solana transactions require a tiny amount of SOL (~0.000005 SOL) to pay network validator fees.
                </span>
              </div>
            )}

            {/* Devnet Free Airdrop button if needed */}
            {network === 'devnet' && (balances.SOL || 0) < 0.005 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Need Devnet SOL for gas?</span>
                  <span className="text-[11px] text-slate-500 font-mono">Bal: {balances.SOL || 0} SOL</span>
                </div>
                <button
                  type="button"
                  onClick={handleQuickAirdrop}
                  disabled={isRequestingAirdrop}
                  className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <Coins size={14} />
                  <span>{isRequestingAirdrop ? 'Requesting Devnet SOL...' : 'Claim Free 0.5 Devnet SOL'}</span>
                </button>
                {airdropMsg && (
                  <p className="text-[11px] text-emerald-700 font-medium text-center">{airdropMsg}</p>
                )}
              </div>
            )}

            {/* Simulation / Runtime Logs Toggle */}
            {txLogs.length > 0 && (
              <div className="text-left">
                <button
                  type="button"
                  onClick={() => setShowLogs((prev) => !prev)}
                  className="w-full flex items-center justify-between py-1.5 px-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <span>Solana Transaction Logs ({txLogs.length})</span>
                  {showLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showLogs && (
                  <div className="mt-1.5 p-2 bg-slate-900 text-slate-100 rounded-lg text-[10px] font-mono max-h-36 overflow-y-auto space-y-1">
                    {txLogs.map((log, idx) => (
                      <div key={idx} className="break-all">{log}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions: Retry or Close */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  startExecution();
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={13} />
                <span>Retry trade</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
