import { Buffer } from 'buffer';

// Polyfill Node.js globals for browser runtime and Solana Web3 libraries
if (typeof window !== 'undefined') {
  (window as any).Buffer = (window as any).Buffer || Buffer;
  (window as any).global = (window as any).global || window;
  if (!(window as any).process) {
    (window as any).process = { env: {} };
  }
}

if (typeof globalThis !== 'undefined') {
  (globalThis as any).Buffer = (globalThis as any).Buffer || Buffer;
  (globalThis as any).global = (globalThis as any).global || globalThis;
}

export { Buffer };
