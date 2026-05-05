export type CellKind = 'empty' | 'firewall' | 'source' | 'target';

export type LevelDef = {
  id: number;
  name: string;
  rows: number;
  cols: number;
  /** row-major grid: [row][col] */
  cells: CellKind[][];
};

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    name: 'Boot sequence',
    rows: 3,
    cols: 3,
    cells: [
      ['target', 'empty', 'target'],
      ['empty', 'firewall', 'empty'],
      ['empty', 'empty', 'source'],
    ],
  },
  {
    id: 2,
    name: 'Firewall crawl',
    rows: 4,
    cols: 4,
    cells: [
      ['target', 'firewall', 'empty', 'target'],
      ['empty', 'empty', 'firewall', 'empty'],
      ['empty', 'firewall', 'empty', 'empty'],
      ['source', 'empty', 'empty', 'empty'],
    ],
  },
  {
    id: 3,
    name: 'Deep link',
    rows: 4,
    cols: 5,
    cells: [
      ['empty', 'target', 'firewall', 'empty', 'target'],
      ['firewall', 'empty', 'empty', 'firewall', 'empty'],
      ['empty', 'empty', 'firewall', 'empty', 'empty'],
      ['source', 'empty', 'empty', 'empty', 'empty'],
    ],
  },
  {
    id: 4,
    name: 'Synaptic maze',
    rows: 5,
    cols: 5,
    cells: [
      ['target', 'empty', 'firewall', 'empty', 'target'],
      ['empty', 'firewall', 'empty', 'firewall', 'empty'],
      ['empty', 'empty', 'firewall', 'empty', 'empty'],
      ['firewall', 'empty', 'empty', 'empty', 'firewall'],
      ['source', 'empty', 'empty', 'empty', 'empty'],
    ],
  },
  {
    id: 5,
    name: 'Neural overload',
    rows: 5,
    cols: 6,
    cells: [
      ['target', 'empty', 'firewall', 'empty', 'firewall', 'target'],
      ['empty', 'firewall', 'empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'firewall', 'firewall', 'empty', 'empty'],
      ['firewall', 'empty', 'empty', 'empty', 'firewall', 'empty'],
      ['source', 'empty', 'empty', 'empty', 'empty', 'empty'],
    ],
  },
];

export const STORAGE_MAX_LEVEL = 'nn_max_unlocked_level';
