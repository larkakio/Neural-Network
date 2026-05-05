import { parseAbi } from 'viem';

export const checkInAbi = parseAbi([
  'function checkIn() payable',
  'function lastCheckInDay(address) view returns (uint256)',
  'function streak(address) view returns (uint256)',
]);

export function getCheckInAddress(): `0x${string}` | undefined {
  const raw = process.env.NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS?.trim();
  if (!raw || raw === '0x0000000000000000000000000000000000000000') return undefined;
  return raw as `0x${string}`;
}
