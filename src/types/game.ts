export type GamePhase =
  | 'title'
  | 'playing'
  | 'inspecting'
  | 'journal'
  | 'puzzle'
  | 'ending';

export type PuzzleType =
  | 'mantle_chimes'
  | 'grandfather_clock'
  | 'lunar_astrolabe'
  | 'sanctum_altar';

export type InventoryItemId =
  | 'brass_key'
  | 'torn_sheet'
  | 'silver_pendulum'
  | 'winch_handle'
  | 'iron_gear'
  | 'assembled_crank'
  | 'phosphor_lens'
  | 'crimson_seal'
  | 'moonstone_medallion'
  | 'signet_ring';

export interface InventoryItem {
  id: InventoryItemId;
  name: string;
  category: string;
  shortHint: string;
  description: string;
  inspectDetail: string;
  combinableWith?: InventoryItemId;
  combinesInto?: InventoryItemId;
}

export interface LoreNote {
  id: string;
  title: string;
  author: string;
  date: string;
  location: string;
  excerpt: string;
  body: string[];
  clueSummary: string;
}

export interface WorldFlags {
  foyerNoteRead: boolean;
  pianoInspected: boolean;
  studyDoorUnlocked: boolean;
  mantleSolved: boolean;
  pendulumInserted: boolean;
  clockSolved: boolean;
  bookcaseSlid: boolean;
  conservatoryGateUnlocked: boolean;
  frescoRevealed: boolean;
  astrolabeSolved: boolean;
  wallPassageOpened: boolean;
  placedRelics: {
    crimson_seal: boolean;
    moonstone_medallion: boolean;
    signet_ring: boolean;
  };
  ritualBroken: boolean;
}

export interface InteractableTarget {
  id: string;
  title: string;
  prompt: string;
  room: string;
  distance: number;
}

export interface ToastMessage {
  id: number;
  text: string;
  tone: 'neutral' | 'discovery' | 'warning';
}

export interface GameState {
  phase: GamePhase;
  activePuzzle: PuzzleType | null;
  inspectingItemId: InventoryItemId | null;
  inventory: InventoryItemId[];
  selectedSlot: number | null;
  combineSourceSlot: number | null;
  discoveredNotes: string[];
  activeNoteId: string | null;
  currentRoom: string;
  dreadLevel: number;
  lanternOn: boolean;
  audioMuted: boolean;
  hudCollapsed: boolean;
  flags: WorldFlags;
  discoveredSecretsCount: number;
}

export const INITIAL_WORLD_FLAGS: WorldFlags = {
  foyerNoteRead: false,
  pianoInspected: false,
  studyDoorUnlocked: false,
  mantleSolved: false,
  pendulumInserted: false,
  clockSolved: false,
  bookcaseSlid: false,
  conservatoryGateUnlocked: false,
  frescoRevealed: false,
  astrolabeSolved: false,
  wallPassageOpened: false,
  placedRelics: {
    crimson_seal: false,
    moonstone_medallion: false,
    signet_ring: false,
  },
  ritualBroken: false,
};
