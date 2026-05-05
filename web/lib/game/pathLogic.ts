import type { CellKind } from './levels';

export type Coord = { r: number; c: number };

export function keyOf(p: Coord): string {
  return `${p.r},${p.c}`;
}

export function isAdjacent(a: Coord, b: Coord): boolean {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}

/** Path must start at source, move only orthogonally, never step on firewall. */
export function normalizePath(
  raw: Coord[],
  grid: CellKind[][],
): Coord[] | null {
  if (raw.length === 0) return null;
  const out: Coord[] = [];
  for (const p of raw) {
    if (p.r < 0 || p.c < 0 || p.r >= grid.length || p.c >= grid[0]!.length) {
      return null;
    }
    const cell = grid[p.r]![p.c]!;
    if (cell === 'firewall') return null;
    if (out.length === 0) {
      if (cell !== 'source') return null;
      out.push(p);
      continue;
    }
    const prev = out[out.length - 1]!;
    if (p.r === prev.r && p.c === prev.c) continue;
    if (!isAdjacent(prev, p)) return null;
    out.push(p);
  }
  return out.length ? out : null;
}

export function pathTouchesAllTargets(
  path: Coord[],
  grid: CellKind[][],
): boolean {
  const targets: Coord[] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r]!.length; c++) {
      if (grid[r]![c] === 'target') targets.push({ r, c });
    }
  }
  const set = new Set(path.map(keyOf));
  return targets.every((t) => set.has(keyOf(t)));
}
