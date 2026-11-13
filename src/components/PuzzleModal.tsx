import React, { useState } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import {
  ASTROLABE_SOLUTION,
  ITEMS,
  LUNAR_PHASES,
  MANTLE_SEQUENCE,
  MANTLE_SYMBOLS,
} from '../data/manorData';
import { InventoryItemId, PuzzleType, WorldFlags } from '../types/game';
import { horrorAudio } from '../audio/horrorAudio';
import { ItemIcon } from './ItemIcon';

interface PuzzleModalProps {
  puzzle: PuzzleType;
  flags: WorldFlags;
  inventory: InventoryItemId[];
  onClose: () => void;
  onSolveMantle: () => void;
  onInsertPendulum: () => void;
  onSolveClock: () => void;
  onSolveAstrolabe: () => void;
  onPlaceRelic: (relic: 'crimson_seal' | 'moonstone_medallion' | 'signet_ring') => void;
}

export const PuzzleModal: React.FC<PuzzleModalProps> = ({
  puzzle,
  flags,
  inventory,
  onClose,
  onSolveMantle,
  onInsertPendulum,
  onSolveClock,
  onSolveAstrolabe,
  onPlaceRelic,
}) => {
  // Mantle Chimes State
  const [chimeInput, setChimeInput] = useState<number[]>([]);
  const [chimeError, setChimeError] = useState(false);

  // Grandfather Clock State
  const [clockHour, setClockHour] = useState(flags.clockSolved ? 11 : 6);
  const [clockMinute, setClockMinute] = useState(flags.clockSolved ? 45 : 0);

  // Lunar Astrolabe State
  const [rings, setRings] = useState<[number, number, number]>(
    flags.astrolabeSolved ? [1, 3, 4] : [0, 2, 0],
  );

  const handleStrikeChime = (idx: number, pitch: number) => {
    horrorAudio.playChime(pitch);
    if (flags.mantleSolved) return;

    setChimeError(false);
    const next = [...chimeInput, idx];
    setChimeInput(next);

    if (next.length === 4) {
      const matched = MANTLE_SEQUENCE.every((val, i) => val === next[i]);
      if (matched) {
        horrorAudio.playWallGrind();
        onSolveMantle();
      } else {
        setChimeError(true);
        window.setTimeout(() => {
          setChimeInput([]);
          setChimeError(false);
        }, 650);
      }
    }
  };

  const handleClockCommit = () => {
    if (!flags.pendulumInserted) {
      horrorAudio.playLocked();
      return;
    }
    horrorAudio.playClockTick();
    if (clockHour === 11 && clockMinute === 45) {
      horrorAudio.playWallGrind();
      onSolveClock();
    } else {
      horrorAudio.playLocked();
    }
  };

  const cycleRing = (ringIdx: 0 | 1 | 2, delta: number) => {
    horrorAudio.playUnlock();
    const updated: [number, number, number] = [...rings] as [number, number, number];
    const len = LUNAR_PHASES.length;
    updated[ringIdx] = (updated[ringIdx] + delta + len) % len;
    setRings(updated);

    if (
      updated[0] === ASTROLABE_SOLUTION[0] &&
      updated[1] === ASTROLABE_SOLUTION[1] &&
      updated[2] === ASTROLABE_SOLUTION[2]
    ) {
      horrorAudio.playWallGrind();
      onSolveAstrolabe();
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-lg border border-[#D4AF6E]/25 bg-[#0D0E14] text-[#E8E2D5] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <p className="text-xs text-[#D4AF6E] tracking-wide">
              {puzzle === 'mantle_chimes' && 'The Parlour · Chimney Mechanism'}
              {puzzle === 'grandfather_clock' && 'Grand Foyer · Clockwork'}
              {puzzle === 'lunar_astrolabe' && 'Moonlit Conservatory · Astrolabe'}
              {puzzle === 'sanctum_altar' && 'Occult Sanctum · Binding Altar'}
            </p>
            <h2 className="font-display text-2xl font-semibold text-[#F4EFE6]">
              {puzzle === 'mantle_chimes' && 'Fireplace Mantle Chimes'}
              {puzzle === 'grandfather_clock' && 'Grandfather Clock'}
              {puzzle === 'lunar_astrolabe' && 'Lunar Astrolabe Rings'}
              {puzzle === 'sanctum_altar' && 'The Three Blackwood Seals'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close mechanism"
            className="p-2 text-[#A9A295] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {puzzle === 'mantle_chimes' && (
            <>
              <p className="text-sm text-[#B8B1A4] leading-relaxed">
                Four suspended brass rods hang above the hearth embers. Striking them in the
                Blackwood dirge cadence releases the brick niche beside the chimney.
              </p>

              <div className="grid grid-cols-4 gap-3">
                {MANTLE_SYMBOLS.map((rod) => (
                  <button
                    key={rod.index}
                    onClick={() => handleStrikeChime(rod.index, rod.pitch)}
                    className="group flex flex-col items-center justify-end h-36 border border-white/10 bg-[#14161F] hover:border-[#D4AF6E]/60 transition-colors p-3"
                  >
                    <div
                      className="w-4 bg-[#C29B57] group-hover:bg-[#E5C17B] transition-colors mb-3"
                      style={{ height: `${82 - rod.index * 11}px` }}
                    />
                    <span className="font-mono-ui text-sm font-medium text-[#E8E2D5]">
                      {rod.numeral}
                    </span>
                    <span className="text-xs text-[#9C9588]">{rod.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs">
                <div className="font-mono-ui text-[#A9A295]">
                  Sequence:{' '}
                  {chimeInput.length === 0
                    ? '—'
                    : chimeInput
                        .map((i) => MANTLE_SYMBOLS.find((m) => m.index === i)?.numeral)
                        .join(' · ')}
                  {chimeError && (
                    <span className="ml-3 text-[#E06D6E]">Dissonant cadence — reset</span>
                  )}
                  {flags.mantleSolved && (
                    <span className="ml-3 text-[#D4AF6E]">Brick niche unlatched</span>
                  )}
                </div>
                <button
                  onClick={() => setChimeInput([])}
                  className="inline-flex items-center gap-1.5 text-[#A9A295] hover:text-white whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
            </>
          )}

          {puzzle === 'grandfather_clock' && (
            <>
              {!flags.pendulumInserted ? (
                <div className="space-y-4">
                  <p className="text-sm text-[#B8B1A4] leading-relaxed">
                    Inside the mahogany case, the brass suspension hook hangs empty. Without its
                    weighted pendulum, the counterweight gears will not engage.
                  </p>
                  {inventory.includes('silver_pendulum') ? (
                    <button
                      onClick={() => {
                        horrorAudio.playUnlock();
                        onInsertPendulum();
                      }}
                      className="w-full py-2.5 px-4 bg-[#D4AF6E] text-[#090A0F] font-medium text-sm hover:bg-[#E3C183] transition-colors"
                    >
                      Insert Silver Pendulum
                    </button>
                  ) : (
                    <p className="text-xs text-[#8D867A] border border-white/10 bg-[#14161F] p-3">
                      Search the Parlour for the missing Silver Pendulum first.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  <p className="text-sm text-[#B8B1A4]">
                    The Silver Pendulum swings steadily. Set the brass hands to the hour recorded in
                    Alistair’s ledger to draw the Study’s north bookcase aside.
                  </p>

                  {/* Minimalist Clock Face */}
                  <div className="flex items-center justify-center gap-8 py-2">
                    <div className="relative w-32 h-32 rounded-full border-2 border-[#D4AF6E]/50 bg-[#151822] flex items-center justify-center">
                      {/* Hour hand */}
                      <div
                        className="absolute bottom-1/2 left-1/2 w-1 h-9 bg-[#E8E2D5] origin-bottom -translate-x-1/2"
                        style={{
                          transform: `translateX(-50%) rotate(${((clockHour % 12) + clockMinute / 60) * 30}deg)`,
                        }}
                      />
                      {/* Minute hand */}
                      <div
                        className="absolute bottom-1/2 left-1/2 w-0.5 h-12 bg-[#D4AF6E] origin-bottom -translate-x-1/2"
                        style={{
                          transform: `translateX(-50%) rotate(${clockMinute * 6}deg)`,
                        }}
                      />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF6E] z-10" />
                    </div>

                    <div className="space-y-3">
                      <div className="font-mono-ui text-3xl text-[#F4EFE6] tracking-wider">
                        {String(clockHour).padStart(2, '0')}:{String(clockMinute).padStart(2, '0')}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setClockHour((h) => (h % 12) + 1)}
                          className="px-3 py-1.5 text-xs border border-white/15 bg-[#14161F] hover:border-[#D4AF6E]/60 whitespace-nowrap shrink-0"
                        >
                          Hour +1
                        </button>
                        <button
                          onClick={() => setClockMinute((m) => (m + 15) % 60)}
                          className="px-3 py-1.5 text-xs border border-white/15 bg-[#14161F] hover:border-[#D4AF6E]/60 whitespace-nowrap shrink-0"
                        >
                          Min +15
                        </button>
                      </div>
                    </div>
                  </div>

                  {flags.clockSolved ? (
                    <div className="flex items-center gap-2 text-xs text-[#D4AF6E] border border-[#D4AF6E]/30 bg-[#D4AF6E]/10 px-4 py-2.5">
                      <Check className="w-4 h-4" />
                      <span>Counterweight released — the Study bookcase has shifted aside.</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleClockCommit}
                      className="w-full py-2.5 px-4 bg-[#D4AF6E] text-[#090A0F] font-medium text-sm hover:bg-[#E3C183] transition-colors"
                    >
                      Set Clock Hands
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {puzzle === 'lunar_astrolabe' && (
            <>
              <p className="text-sm text-[#B8B1A4] leading-relaxed">
                Three concentric brass rings bear engraved lunar phases. Align the rings to the
                sequence revealed beneath the Conservatory fresco.
              </p>

              <div className="space-y-3">
                {(['Outer Ring', 'Middle Ring', 'Inner Core'] as const).map((label, idx) => {
                  const rIdx = idx as 0 | 1 | 2;
                  return (
                    <div
                      key={label}
                      className="flex items-center justify-between border border-white/10 bg-[#14161F] px-4 py-3"
                    >
                      <span className="text-xs text-[#9C9588]">{label}</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => cycleRing(rIdx, -1)}
                          disabled={flags.astrolabeSolved}
                          className="px-2.5 py-1 text-xs border border-white/15 hover:border-[#D4AF6E]/60 disabled:opacity-40"
                        >
                          Prev
                        </button>
                        <span className="w-36 text-center text-sm font-medium text-[#E8E2D5]">
                          {LUNAR_PHASES[rings[rIdx]]}
                        </span>
                        <button
                          onClick={() => cycleRing(rIdx, 1)}
                          disabled={flags.astrolabeSolved}
                          className="px-2.5 py-1 text-xs border border-white/15 hover:border-[#D4AF6E]/60 disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {flags.astrolabeSolved && (
                <div className="flex items-center gap-2 text-xs text-[#D4AF6E] border border-[#D4AF6E]/30 bg-[#D4AF6E]/10 px-4 py-2.5">
                  <Check className="w-4 h-4" />
                  <span>
                    Moonstone Medallion freed — the north Conservatory wall panel has opened.
                  </span>
                </div>
              )}
            </>
          )}

          {puzzle === 'sanctum_altar' && (
            <>
              <p className="text-sm text-[#B8B1A4] leading-relaxed">
                Three carved recesses form a triangle atop the obsidian altar. Place each Blackwood
                heirloom seal into its hollow to dissolve the binding within the walls.
              </p>

              <div className="grid grid-cols-3 gap-3">
                {(['crimson_seal', 'moonstone_medallion', 'signet_ring'] as const).map((relicId) => {
                  const placed = flags.placedRelics[relicId];
                  const owned = inventory.includes(relicId);
                  const item = ITEMS[relicId];

                  return (
                    <button
                      key={relicId}
                      onClick={() => {
                        if (!placed && owned) {
                          horrorAudio.playUnlock();
                          onPlaceRelic(relicId);
                        } else if (!placed) {
                          horrorAudio.playLocked();
                        }
                      }}
                      disabled={placed}
                      className={`flex flex-col items-center justify-center gap-2 p-4 border text-center transition-colors ${
                        placed
                          ? 'border-[#D4AF6E]/60 bg-[#D4AF6E]/15 text-[#F4EFE6]'
                          : owned
                            ? 'border-white/25 bg-[#151822] hover:border-[#D4AF6E] text-[#E8E2D5]'
                            : 'border-white/10 bg-[#101218] text-[#6E685E]'
                      }`}
                    >
                      <ItemIcon id={relicId} className="w-7 h-7" />
                      <span className="text-xs font-medium leading-tight">{item.name}</span>
                      <span className="text-[11px] text-[#A9A295]">
                        {placed ? 'Placed' : owned ? 'Place Seal' : 'Missing'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
