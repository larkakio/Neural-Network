import { Attribution } from 'ox/erc8021';
import type { Hex } from 'viem';

/**
 * Builder code suffix for ERC-8021 attribution (Base.dev).
 * Prefer NEXT_PUBLIC_BUILDER_CODE (bc_…); optional hex override for edge cases.
 */
export function getCheckInDataSuffix(): Hex | undefined {
  const override = process.env.NEXT_PUBLIC_BUILDER_CODE_SUFFIX;
  if (override?.startsWith('0x') && override.length > 2) {
    return override as Hex;
  }
  const code = process.env.NEXT_PUBLIC_BUILDER_CODE?.trim();
  if (!code) return undefined;
  return Attribution.toDataSuffix({ codes: [code] });
}
