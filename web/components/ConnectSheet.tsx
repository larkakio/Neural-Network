'use client';

import { base } from 'wagmi/chains';
import { useConnect, useConnectors } from 'wagmi';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ConnectSheet({ open, onClose }: Props) {
  const connectors = useConnectors();
  const { connectAsync, isPending, error } = useConnect();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-title"
      onClick={onClose}
    >
      <div
        className="nn-panel w-full max-w-md rounded-t-2xl border border-[var(--nn-cyan)]/40 p-4 shadow-[0_0_40px_rgba(0,240,255,0.15)] md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="connect-title" className="nn-title text-lg tracking-wide">
            Connect wallet
          </h2>
          <button
            type="button"
            className="rounded-lg px-3 py-1 text-sm text-[var(--nn-muted)] hover:bg-white/5"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <ul className="flex flex-col gap-2">
          {connectors.map((c) => (
            <li key={c.uid}>
              <button
                type="button"
                disabled={isPending}
                className="nn-btn-secondary flex w-full items-center justify-between px-4 py-3 text-left disabled:opacity-40"
                onClick={async () => {
                  await connectAsync({ connector: c, chainId: base.id });
                  onClose();
                }}
              >
                <span>{c.name}</span>

              </button>
            </li>
          ))}
        </ul>
        {error ? (
          <p className="mt-3 text-sm text-[var(--nn-magenta)]">{error.message}</p>
        ) : null}
      </div>
    </div>
  );
}
