'use client';

import { useCallback, useMemo } from 'react';
import { base } from 'wagmi/chains';
import {
  useConnection,
  useSwitchChain,
  useWriteContract,
  useReadContract,
} from 'wagmi';
import { checkInAbi, getCheckInAddress } from '@/lib/contracts/checkIn';
import { getCheckInDataSuffix } from '@/lib/builder/getDataSuffix';

function dayIndexNow(): bigint {
  return BigInt(Math.floor(Date.now() / 86400000));
}

function CheckInInner({ contractAddress }: { contractAddress: `0x${string}` }) {
  const { address, isConnected, chainId } = useConnection();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const {
    writeContractAsync,
    isPending: isWriting,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const dataSuffix = useMemo(() => getCheckInDataSuffix(), []);

  const readOn = Boolean(address && isConnected);
  const readArgs = [address ?? '0x0000000000000000000000000000000000000000'] as const;

  const { data: lastDay } = useReadContract({
    address: contractAddress,
    abi: checkInAbi,
    functionName: 'lastCheckInDay',
    args: readArgs,
    query: { enabled: readOn },
  });

  const { data: streak } = useReadContract({
    address: contractAddress,
    abi: checkInAbi,
    functionName: 'streak',
    args: readArgs,
    query: { enabled: readOn },
  });

  const alreadyToday =
    readOn && lastDay !== undefined && lastDay === dayIndexNow();

  const onCheckIn = useCallback(async () => {
    if (!address) return;
    resetWrite();
    const baseId = base.id;
    if (chainId !== baseId) {
      await switchChainAsync({ chainId: baseId });
    }
    await writeContractAsync({
      address: contractAddress,
      abi: checkInAbi,
      functionName: 'checkIn',
      chainId: baseId,
      value: 0n,
      ...(dataSuffix ? { dataSuffix } : {}),
    });
  }, [
    address,
    chainId,
    contractAddress,
    dataSuffix,
    resetWrite,
    switchChainAsync,
    writeContractAsync,
  ]);

  const busy = isWriting || isSwitching;

  return (
    <section className="nn-panel mx-3 mt-3 rounded-xl border border-[var(--nn-cyan)]/30 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="nn-title text-sm tracking-widest">Daily check-in</h3>
        {readOn && streak !== undefined ? (
          <span className="nn-mono text-xs text-[var(--nn-cyan)]">
            Streak: {String(streak)}
          </span>
        ) : null}
      </div>
      {!isConnected ? (
        <p className="text-sm text-[var(--nn-muted)]">
          Connect your wallet on Base to check in once per day (gas only).
        </p>
      ) : alreadyToday ? (
        <p className="text-sm text-[var(--nn-muted)]">
          You are already checked in for today.
        </p>
      ) : (
        <button
          type="button"
          className="nn-btn-primary mt-1 w-full py-2 text-sm"
          disabled={busy}
          onClick={() => void onCheckIn()}
        >
          {busy ? 'Confirm in wallet…' : 'Check in on Base'}
        </button>
      )}
      {writeError ? (
        <p className="mt-2 text-xs text-[var(--nn-magenta)]">{writeError.message}</p>
      ) : null}
    </section>
  );
}

export function CheckInPanel() {
  const contractAddress = useMemo(() => getCheckInAddress(), []);

  if (!contractAddress) {
    return (
      <section className="nn-panel mx-3 mt-3 rounded-xl border border-white/10 p-3 text-sm text-[var(--nn-muted)]">
        On-chain check-in is not configured for this deployment.
      </section>
    );
  }

  return <CheckInInner contractAddress={contractAddress} />;
}
