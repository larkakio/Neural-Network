'use client';

import { useState } from 'react';
import { base } from 'wagmi/chains';
import {
  useConnection,
  useDisconnect,
  useChainId,
  useSwitchChain,
} from 'wagmi';
import { ConnectSheet } from '@/components/ConnectSheet';

export function WalletBar() {
  const { address, isConnected, status } = useConnection();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [sheetOpen, setSheetOpen] = useState(false);

  const wrongNetwork = isConnected && chainId !== base.id;

  return (
    <>
      <header className="nn-hud relative z-20 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--nn-cyan)]/25 px-3 py-2 safe-pt">
        <div className="nn-mono text-xs text-[var(--nn-muted)]">
          {status === 'connected' && address ? (
            <span title={address}>
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
          ) : (
            <span>Offline</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <button
              type="button"
              className="nn-btn-ghost text-xs"
              onClick={() => disconnect()}
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              className="nn-btn-primary text-sm"
              onClick={() => setSheetOpen(true)}
            >
              Connect wallet
            </button>
          )}
        </div>
      </header>

      {wrongNetwork ? (
        <div className="relative z-20 mx-3 mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--nn-magenta)]/50 bg-[var(--nn-magenta)]/10 px-3 py-2 text-sm">
          <span className="text-[var(--nn-magenta)]">Wrong network</span>
          <button
            type="button"
            disabled={isSwitching}
            className="nn-btn-primary text-xs"
            onClick={() => switchChain({ chainId: base.id })}
          >
            {isSwitching ? 'Switching…' : 'Switch to Base'}
          </button>
        </div>
      ) : null}

      <ConnectSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
