'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LEVELS, STORAGE_MAX_LEVEL, type LevelDef } from '@/lib/game/levels';
import {
  keyOf,
  normalizePath,
  pathTouchesAllTargets,
  type Coord,
} from '@/lib/game/pathLogic';

function readMaxUnlocked(): number {
  if (typeof window === 'undefined') return 1;
  const raw = window.localStorage.getItem(STORAGE_MAX_LEVEL);
  const n = raw ? parseInt(raw, 10) : 1;
  if (Number.isNaN(n) || n < 1) return 1;
  return Math.min(n, LEVELS.length);
}

function writeMaxUnlocked(n: number) {
  window.localStorage.setItem(STORAGE_MAX_LEVEL, String(n));
}

/** 0–100 SVG user units (square viewBox) */
function cellFrac(r: number, c: number, rows: number, cols: number) {
  return {
    x: ((c + 0.5) / cols) * 100,
    y: ((r + 0.5) / rows) * 100,
  };
}

function pointToCell(
  gridEl: HTMLElement,
  clientX: number,
  clientY: number,
  rows: number,
  cols: number,
): Coord | null {
  const g = gridEl.getBoundingClientRect();
  const x = clientX - g.left;
  const y = clientY - g.top;
  if (x < 0 || y < 0 || x > g.width || y > g.height) return null;
  const c = Math.floor((x / g.width) * cols);
  const r = Math.floor((y / g.height) * rows);
  if (r < 0 || c < 0 || r >= rows || c >= cols) return null;
  return { r, c };
}

export function NeuralGame() {
  const [maxUnlocked, setMaxUnlocked] = useState(1);
  const [levelIndex, setLevelIndex] = useState(0);
  const [draftPath, setDraftPath] = useState<Coord[]>([]);
  const [committedPath, setCommittedPath] = useState<Coord[]>([]);
  const [status, setStatus] = useState<'idle' | 'drawing' | 'won'>('idle');
  const [toast, setToast] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<Coord[]>([]);

  useEffect(() => {
    setMaxUnlocked(readMaxUnlocked());
  }, []);

  const level: LevelDef = LEVELS[levelIndex] ?? LEVELS[0]!;
  const grid = level.cells;

  const resetLevel = useCallback(() => {
    draftRef.current = [];
    setDraftPath([]);
    setCommittedPath([]);
    setStatus('idle');
  }, []);

  useEffect(() => {
    resetLevel();
  }, [levelIndex, resetLevel]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (status === 'won') return;
    const el = gridRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    const cell = pointToCell(el, e.clientX, e.clientY, level.rows, level.cols);
    if (!cell) return;
    setStatus('drawing');
    draftRef.current = [cell];
    setDraftPath([cell]);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (status !== 'drawing') return;
    const el = gridRef.current;
    if (!el) return;
    const cell = pointToCell(el, e.clientX, e.clientY, level.rows, level.cols);
    if (!cell) return;
    setDraftPath((prev) => {
      if (prev.length === 0) {
        draftRef.current = [cell];
        return [cell];
      }
      const last = prev[prev.length - 1]!;
      if (last.r === cell.r && last.c === cell.c) return prev;
      const cellKind = grid[cell.r]![cell.c]!;
      if (cellKind === 'firewall') {
        return prev;
      }
      if (!prev.some((p) => p.r === cell.r && p.c === cell.c)) {
        if (
          Math.abs(last.r - cell.r) + Math.abs(last.c - cell.c) !== 1
        ) {
          return prev;
        }
        const next = [...prev, cell];
        draftRef.current = next;
        return next;
      }
      return prev;
    });
  };

  const finishStroke = useCallback(() => {
    setStatus('idle');
    const stroke = draftRef.current;
    const normalized = normalizePath(stroke, grid);
    draftRef.current = [];
    if (!normalized || normalized.length < 2) {
      setDraftPath([]);
      return;
    }
    setCommittedPath(normalized);
    const win = pathTouchesAllTargets(normalized, grid);
    if (win) {
      setStatus('won');
      setMaxUnlocked((m) => {
        const nextMax = Math.max(m, level.id + 1);
        const capped = Math.min(nextMax, LEVELS.length);
        writeMaxUnlocked(capped);
        return capped;
      });
    } else {
      showToast('Route incomplete — all targets must join the signal path.');
    }
    setDraftPath([]);
  }, [grid, level.id, showToast]);

  const onPointerUp = (e: React.PointerEvent) => {
    const el = gridRef.current;
    if (el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    if (status === 'drawing') finishStroke();
  };

  const onPointerCancel = (e: React.PointerEvent) => {
    const el = gridRef.current;
    if (el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    draftRef.current = [];
    setDraftPath([]);
    setStatus('idle');
  };

  const pathKeys = useMemo(() => {
    const s = new Set<string>();
    for (const p of committedPath) s.add(keyOf(p));
    for (const p of draftPath) s.add(keyOf(p));
    return s;
  }, [committedPath, draftPath]);

  const svgSegments = useMemo(() => {
    if (committedPath.length + draftPath.length < 2) return [];
    const rows = level.rows;
    const cols = level.cols;
    const full = [...committedPath];
    if (draftPath.length) {
      const a = draftPath[0]!;
      const b = full[full.length - 1];
      if (!b || b.r !== a.r || b.c !== a.c) full.push(...draftPath);
      else full.push(...draftPath.slice(1));
    }
    const pts = full.map((p) => cellFrac(p.r, p.c, rows, cols));
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 1; i < pts.length; i++) {
      lines.push({
        x1: pts[i - 1]!.x,
        y1: pts[i - 1]!.y,
        x2: pts[i]!.x,
        y2: pts[i]!.y,
      });
    }
    return lines;
  }, [committedPath, draftPath, level.cols, level.rows]);

  const canSelect = (idx: number) => idx < maxUnlocked;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col px-3 pb-4">
      <div className="nn-slant mb-3 flex items-end justify-between gap-2 border-b border-[var(--nn-violet)]/40 pb-2">
        <div>
          <p className="nn-mono text-[10px] uppercase tracking-[0.25em] text-[var(--nn-muted)]">
            Level {level.id}
          </p>
          <h1 className="nn-title text-xl md:text-2xl">{level.name}</h1>
        </div>
        <div className="nn-mono text-right text-xs text-[var(--nn-cyan)]">
          Unlocked: {maxUnlocked}/{LEVELS.length}
        </div>
      </div>

      <p className="mb-2 max-w-prose text-sm leading-snug text-[var(--nn-muted)]">
        Drag from the <span className="text-[var(--nn-cyan)]">Source</span> across
        the grid. Your trace carries the signal. Every{' '}
        <span className="text-[var(--nn-magenta)]">Target</span> neuron must touch the
        path. <span className="text-[var(--nn-warn)]">Firewalls</span> block routing.
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        {LEVELS.map((L, idx) => (
          <button
            key={L.id}
            type="button"
            disabled={!canSelect(idx)}
            className={`nn-chip ${idx === levelIndex ? 'nn-chip-active' : ''} ${
              !canSelect(idx) ? 'opacity-30' : ''
            }`}
            onClick={() => canSelect(idx) && setLevelIndex(idx)}
          >
            {L.id}
          </button>
        ))}
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-[min(100%,420px)] flex-1">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
          aria-hidden
        >
          {svgSegments.map((ln, i) => (
            <line
              key={i}
              x1={ln.x1}
              y1={ln.y1}
              x2={ln.x2}
              y2={ln.y2}
              stroke="url(#nnWire)"
              strokeWidth={1.2}
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              className="nn-wire-glow"
            />
          ))}
          <defs>
            <linearGradient id="nnWire" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="100%" stopColor="#ff00aa" />
            </linearGradient>
          </defs>
        </svg>

        <div
          ref={gridRef}
          className="nn-grid relative z-[5] grid h-full w-full gap-1 rounded-xl border border-[var(--nn-cyan)]/35 bg-black/40 p-2 touch-none"
          style={{
            gridTemplateColumns: `repeat(${level.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${level.rows}, minmax(0, 1fr))`,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          {grid.flatMap((row, r) =>
            row.map((cell, c) => {
              const wired = pathKeys.has(keyOf({ r, c }));
              const isSource = cell === 'source';
              const isTarget = cell === 'target';
              const isFw = cell === 'firewall';
              return (
                <div
                  key={`${r}-${c}`}
                  className={[
                    'nn-cell relative flex min-h-[44px] items-center justify-center rounded-lg border text-xs font-semibold',
                    isFw
                      ? 'nn-cell-firewall border-[var(--nn-warn)]/60 bg-[var(--nn-warn)]/10'
                      : 'border-white/10 bg-white/[0.03]',
                    wired ? 'nn-cell-wired' : '',
                    isSource ? 'nn-cell-source' : '',
                    isTarget ? 'nn-cell-target' : '',
                  ].join(' ')}
                >
                  {isSource ? (
                    <span className="nn-pulse nn-mono text-[10px] tracking-widest text-[var(--nn-cyan)]">
                      SRC
                    </span>
                  ) : null}
                  {isTarget ? (
                    <span className="nn-mono text-[10px] tracking-widest text-[var(--nn-magenta)]">
                      TGT
                    </span>
                  ) : null}
                  {isFw ? (
                    <span className="nn-mono text-[10px] text-[var(--nn-warn)]">BLK</span>
                  ) : null}
                </div>
              );
            }),
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="nn-btn-secondary px-4 py-2 text-sm" onClick={resetLevel}>
          Reset path
        </button>
        {status === 'won' ? (
          <button
            type="button"
            className="nn-btn-primary px-4 py-2 text-sm"
            onClick={() => {
              if (levelIndex < LEVELS.length - 1) {
                setLevelIndex(levelIndex + 1);
              }
            }}
            disabled={levelIndex >= LEVELS.length - 1}
          >
            {levelIndex >= LEVELS.length - 1 ? 'All levels cleared' : 'Next level'}
          </button>
        ) : null}
      </div>

      {status === 'won' ? (
        <div
          className="nn-modal fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4"
          role="alertdialog"
          aria-labelledby="win-title"
        >
          <div className="nn-panel max-w-sm rounded-2xl border border-[var(--nn-cyan)]/50 p-6 text-center shadow-[0_0_60px_rgba(176,38,255,0.25)]">
            <h2 id="win-title" className="nn-title mb-2 text-2xl">
              Signal locked
            </h2>
            <p className="mb-4 text-sm text-[var(--nn-muted)]">
              Neural path synchronized. Level {level.id} complete.
            </p>
            <button
              type="button"
              className="nn-btn-primary w-full py-2"
              onClick={() => {
                if (levelIndex < LEVELS.length - 1) {
                  setLevelIndex(levelIndex + 1);
                } else {
                  setStatus('idle');
                }
              }}
            >
              {levelIndex < LEVELS.length - 1 ? 'Continue' : 'Close'}
            </button>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="nn-toast fixed bottom-6 left-1/2 z-50 max-w-sm -translate-x-1/2 rounded-lg border border-[var(--nn-magenta)]/40 bg-black/90 px-4 py-2 text-center text-sm text-[var(--nn-muted)]">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
