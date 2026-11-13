import { useCallback, useEffect, useRef, useState } from 'react';
import { ManorCanvas } from './components/ManorCanvas';
import { GameHud } from './components/GameHud';
import { PuzzleModal } from './components/PuzzleModal';
import { JournalModal } from './components/JournalModal';
import { ItemInspectModal } from './components/ItemInspectModal';
import { ITEMS, LORE_NOTES } from './data/manorData';
import { horrorAudio } from './audio/horrorAudio';
import {
  GamePhase,
  INITIAL_WORLD_FLAGS,
  InteractableTarget,
  InventoryItemId,
  PuzzleType,
  ToastMessage,
  WorldFlags,
} from './types/game';

const STORAGE_KEY = 'blackwood_hollow_save_v1';

interface SavedProgress {
  inventory: InventoryItemId[];
  discoveredNotes: string[];
  flags: WorldFlags;
}

function loadSavedProgress(): SavedProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedProgress;
    if (!parsed || !Array.isArray(parsed.inventory) || !parsed.flags) return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function App() {
  const [savedExists, setSavedExists] = useState<boolean>(() => loadSavedProgress() !== null);
  const [phase, setPhase] = useState<GamePhase>('title');
  const [activePuzzle, setActivePuzzle] = useState<PuzzleType | null>(null);
  const [inspectingItemId, setInspectingItemId] = useState<InventoryItemId | null>(null);

  const [inventory, setInventory] = useState<InventoryItemId[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [combineSourceSlot, setCombineSourceSlot] = useState<number | null>(null);

  const [discoveredNotes, setDiscoveredNotes] = useState<string[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  const [flags, setFlags] = useState<WorldFlags>(INITIAL_WORLD_FLAGS);
  const [currentRoom, setCurrentRoom] = useState<string>('Grand Foyer');
  const [target, setTarget] = useState<InteractableTarget | null>(null);

  const [lanternOn, setLanternOn] = useState(true);
  const [audioMuted, setAudioMuted] = useState(false);
  const [hudCollapsed, setHudCollapsed] = useState(false);
  const [pointerLocked, setPointerLocked] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [resetSignal, setResetSignal] = useState(0);

  const toastCounterRef = useRef(1);

  const pushToast = useCallback((text: string, tone: ToastMessage['tone'] = 'neutral') => {
    const id = toastCounterRef.current++;
    setToasts((prev) => [...prev.slice(-2), { id, text, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  // Persist investigation checkpoints automatically
  useEffect(() => {
    if (phase === 'title') return;
    try {
      const payload: SavedProgress = { inventory, discoveredNotes, flags };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setSavedExists(true);
    } catch {
      // ignore storage quota issues
    }
  }, [inventory, discoveredNotes, flags, phase]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      horrorAudio.dispose();
    };
  }, []);

  // Release pointer lock whenever opening a UI modal or ending screen
  useEffect(() => {
    if (phase !== 'playing' && document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, [phase]);

  const discoveredSecretsCount =
    (flags.mantleSolved ? 1 : 0) +
    (flags.bookcaseSlid ? 1 : 0) +
    (flags.wallPassageOpened ? 1 : 0) +
    (flags.ritualBroken ? 1 : 0);

  const addItem = useCallback((itemId: InventoryItemId) => {
    setInventory((prev) => {
      if (prev.includes(itemId)) return prev;
      const next = [...prev, itemId];
      setSelectedSlot(next.length - 1);
      return next;
    });
  }, []);

  const removeItem = useCallback((itemId: InventoryItemId) => {
    setInventory((prev) => {
      const next = prev.filter((id) => id !== itemId);
      setSelectedSlot((curr) => {
        if (curr === null) return null;
        if (next.length === 0) return null;
        return Math.min(curr, next.length - 1);
      });
      return next;
    });
  }, []);

  const unlockNote = useCallback((noteId: string, openModal = false) => {
    setDiscoveredNotes((prev) => (prev.includes(noteId) ? prev : [...prev, noteId]));
    setActiveNoteId(noteId);
    if (openModal) {
      setPhase('journal');
    }
  }, []);

  const handleSelectSlot = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= inventory.length) {
        setSelectedSlot(null);
        setCombineSourceSlot(null);
        return;
      }

      if (combineSourceSlot !== null) {
        if (combineSourceSlot === idx) {
          setCombineSourceSlot(null);
          return;
        }
        const firstId = inventory[combineSourceSlot];
        const secondId = inventory[idx];
        const firstItem = ITEMS[firstId];
        if (firstItem.combinableWith === secondId && firstItem.combinesInto) {
          const resultId = firstItem.combinesInto;
          horrorAudio.playCombine();
          setInventory((prev) => {
            const filtered = prev.filter((id) => id !== firstId && id !== secondId);
            const next = [...filtered, resultId];
            setSelectedSlot(next.length - 1);
            return next;
          });
          setCombineSourceSlot(null);
          pushToast(`Combined into ${ITEMS[resultId].name}.`, 'discovery');
        } else {
          horrorAudio.playLocked();
          setCombineSourceSlot(null);
          pushToast('Those two items do not fit together.', 'warning');
        }
        return;
      }

      setSelectedSlot((prev) => (prev === idx ? null : idx));
    },
    [combineSourceSlot, inventory, pushToast],
  );

  // Global exploration hotkeys
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (phase === 'title' || phase === 'ending') return;

      if (e.code === 'Escape') {
        if (phase !== 'playing') {
          setActivePuzzle(null);
          setInspectingItemId(null);
          setPhase('playing');
        }
        return;
      }

      if (e.code === 'KeyM') {
        setAudioMuted((m) => {
          const next = !m;
          horrorAudio.setMuted(next);
          return next;
        });
        return;
      }

      if (e.code === 'KeyH' && phase === 'playing') {
        setHudCollapsed((c) => !c);
        return;
      }

      if (e.code === 'KeyF' && phase === 'playing') {
        setLanternOn((l) => !l);
        horrorAudio.playUnlock();
        return;
      }

      if (e.code === 'KeyJ' || e.code === 'Tab') {
        e.preventDefault();
        if (phase === 'journal') {
          setPhase('playing');
        } else if (phase === 'playing') {
          horrorAudio.playPaper();
          setPhase('journal');
        }
        return;
      }

      if (e.code === 'KeyI' && phase === 'playing' && selectedSlot !== null) {
        const item = inventory[selectedSlot];
        if (item) {
          setInspectingItemId(item);
          setPhase('inspecting');
        }
        return;
      }

      if (phase === 'playing' && e.code.startsWith('Digit')) {
        const num = Number(e.code.replace('Digit', ''));
        if (num >= 1 && num <= 6) {
          handleSelectSlot(num - 1);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, selectedSlot, inventory, handleSelectSlot]);

  const handleInteract = useCallback(
    (targetId: string) => {
      const selectedItem = selectedSlot !== null ? inventory[selectedSlot] : null;

      switch (targetId) {
        case 'foyer_note': {
          horrorAudio.playPaper();
          setFlags((f) => ({ ...f, foyerNoteRead: true }));
          unlockNote('archivist_brief', true);
          break;
        }
        case 'alistair_portrait': {
          horrorAudio.playWhisperStinger();
          pushToast(
            'A freezing draft whispers from behind Alistair’s hollowed portrait eyes.',
            'neutral',
          );
          break;
        }
        case 'front_door': {
          if (flags.ritualBroken) {
            setPhase('ending');
          } else {
            horrorAudio.playLocked();
            pushToast(
              'The entrance doors remain sealed by the manor’s binding.',
              'warning',
            );
          }
          break;
        }
        case 'music_box_key': {
          if (!inventory.includes('brass_key') && !flags.studyDoorUnlocked) {
            horrorAudio.playPickup();
            horrorAudio.playSubtleWhisper();
            addItem('brass_key');
            pushToast('Recovered Brass Skeleton Key from the velvet music box.', 'discovery');
          } else {
            pushToast('The brass music box stands open and empty.', 'neutral');
          }
          break;
        }
        case 'phosphor_lens_pickup': {
          if (!inventory.includes('phosphor_lens')) {
            horrorAudio.playPickup();
            addItem('phosphor_lens');
            pushToast('Collected Phosphor Glass Lens from the apothecary cabinet.', 'discovery');
          } else {
            pushToast('Empty apothecary phials rattle faintly inside the cabinet.', 'neutral');
          }
          break;
        }
        case 'upright_piano': {
          horrorAudio.playChime(293.66);
          setFlags((f) => ({ ...f, pianoInspected: true }));
          pushToast(
            'Dried crimson ink stains four keys, though the score page was torn away and carried to the Study.',
            'neutral',
          );
          break;
        }
        case 'study_door': {
          if (flags.studyDoorUnlocked) return;
          if (selectedItem === 'brass_key') {
            horrorAudio.playUnlock();
            removeItem('brass_key');
            setFlags((f) => ({ ...f, studyDoorUnlocked: true }));
            pushToast('Unlocked the Study & Library door.', 'discovery');
          } else if (inventory.includes('brass_key')) {
            horrorAudio.playLocked();
            pushToast('Select the Brass Skeleton Key in your dock to unlock the Study.', 'warning');
          } else {
            horrorAudio.playLocked();
            pushToast('Locked. Engraved on the brass plate: "STUDY".', 'warning');
          }
          break;
        }
        case 'torn_sheet_pickup': {
          horrorAudio.playPaper();
          if (!inventory.includes('torn_sheet')) {
            addItem('torn_sheet');
            pushToast('Collected Torn Sheet Music & read Alistair’s Ledger.', 'discovery');
          }
          unlockNote('alistair_ledger', true);
          break;
        }
        case 'winch_handle_pickup': {
          if (
            !inventory.includes('winch_handle') &&
            !inventory.includes('assembled_crank') &&
            !flags.conservatoryGateUnlocked
          ) {
            horrorAudio.playPickup();
            addItem('winch_handle');
            pushToast('Collected Iron Winch Handle from the writing desk.', 'discovery');
          } else {
            pushToast('Only dried ink remains beside the leather blotter.', 'neutral');
          }
          break;
        }
        case 'mantle_chimes': {
          setActivePuzzle('mantle_chimes');
          setPhase('puzzle');
          break;
        }
        case 'silver_pendulum_pickup': {
          if (!flags.mantleSolved) {
            horrorAudio.playLocked();
            pushToast('The chimney brickwork feels hollow, yet remains mortared shut.', 'warning');
          } else if (!inventory.includes('silver_pendulum') && !flags.pendulumInserted) {
            horrorAudio.playPickup();
            addItem('silver_pendulum');
            pushToast('Recovered Silver Pendulum from the concealed chimney niche.', 'discovery');
          }
          break;
        }
        case 'grandfather_clock': {
          setActivePuzzle('grandfather_clock');
          setPhase('puzzle');
          break;
        }
        case 'false_bookcase': {
          if (!flags.bookcaseSlid) {
            horrorAudio.playLocked();
            pushToast(
              'Deep arcs scar the floorboards—hidden gears behind the wall hold this bookcase fast.',
              'neutral',
            );
          }
          break;
        }
        case 'iron_gear_pickup': {
          if (
            !inventory.includes('iron_gear') &&
            !inventory.includes('assembled_crank') &&
            !flags.conservatoryGateUnlocked
          ) {
            horrorAudio.playPickup();
            addItem('iron_gear');
            pushToast('Recovered Toothed Iron Gear from the hidden alcove.', 'discovery');
          }
          break;
        }
        case 'crimson_seal_pickup': {
          if (!inventory.includes('crimson_seal') && !flags.placedRelics.crimson_seal) {
            horrorAudio.playPickup();
            addItem('crimson_seal');
            pushToast('Collected Crimson Wax Seal.', 'discovery');
          }
          break;
        }
        case 'masons_note': {
          horrorAudio.playPaper();
          unlockNote('masons_confession', true);
          break;
        }
        case 'gate_winch': {
          if (flags.conservatoryGateUnlocked) {
            pushToast('The iron portcullis is raised and latched.', 'neutral');
          } else if (selectedItem === 'assembled_crank') {
            horrorAudio.playWallGrind();
            removeItem('assembled_crank');
            setFlags((f) => ({ ...f, conservatoryGateUnlocked: true }));
            pushToast('The iron lattice rises into the archway, opening the Conservatory.', 'discovery');
          } else if (inventory.includes('assembled_crank')) {
            horrorAudio.playLocked();
            pushToast('Select the Assembled Winch Crank in your dock to turn the winch.', 'warning');
          } else {
            horrorAudio.playLocked();
            pushToast(
              'The gate winch is missing its crank assembly (combine Winch Handle + Iron Gear).',
              'warning',
            );
          }
          break;
        }
        case 'lunar_fresco': {
          if (flags.frescoRevealed) {
            pushToast(
              'Phosphor glyphs glow: I. Waning Crescent · II. Total Eclipse · III. Blood Moon.',
              'discovery',
            );
          } else if (selectedItem === 'phosphor_lens') {
            horrorAudio.playWhisperStinger();
            setFlags((f) => ({ ...f, frescoRevealed: true }));
            pushToast(
              'Through the Phosphor Lens, three lunar glyphs ignite across the plaster.',
              'discovery',
            );
          } else if (inventory.includes('phosphor_lens')) {
            horrorAudio.playLocked();
            pushToast('Select the Phosphor Glass Lens in your dock to read the faded mural.', 'warning');
          } else {
            horrorAudio.playLocked();
            pushToast('The fresco pigment is too faint for bare eyes.', 'warning');
          }
          break;
        }
        case 'lunar_astrolabe': {
          setActivePuzzle('lunar_astrolabe');
          setPhase('puzzle');
          break;
        }
        case 'wall_panel_inspect': {
          if (!flags.wallPassageOpened) {
            horrorAudio.playLocked();
            pushToast(
              'Cold air drafts through the ivy paneling—controlled by the Conservatory astrolabe.',
              'neutral',
            );
          }
          break;
        }
        case 'wall_niche_ring': {
          let collectedSomething = false;
          if (!inventory.includes('signet_ring') && !flags.placedRelics.signet_ring) {
            horrorAudio.playPickup();
            addItem('signet_ring');
            collectedSomething = true;
            pushToast('Recovered Blackwood Signet Ring from inside the wall brick.', 'discovery');
          }
          if (!discoveredNotes.includes('evelyn_letter')) {
            horrorAudio.playPaper();
            unlockNote('evelyn_letter', !collectedSomething);
            if (collectedSomething) {
              pushToast('Found Evelyn’s Final Letter (press J to read).', 'discovery');
            }
          } else if (!collectedSomething) {
            unlockNote('evelyn_letter', true);
          }
          break;
        }
        case 'sanctum_altar': {
          setActivePuzzle('sanctum_altar');
          setPhase('puzzle');
          break;
        }
      }
    },
    [
      selectedSlot,
      inventory,
      flags,
      discoveredNotes,
      addItem,
      removeItem,
      unlockNote,
      pushToast,
    ],
  );

  const handleStartNew = () => {
    horrorAudio.init();
    horrorAudio.setMuted(audioMuted);
    setInventory([]);
    setSelectedSlot(null);
    setCombineSourceSlot(null);
    setDiscoveredNotes([]);
    setActiveNoteId(null);
    setFlags(INITIAL_WORLD_FLAGS);
    setCurrentRoom('Grand Foyer');
    setTarget(null);
    setLanternOn(true);
    setResetSignal((s) => s + 1);
    localStorage.removeItem(STORAGE_KEY);
    setSavedExists(false);
    setPhase('playing');
    pushToast('Explore Blackwood Hollow. Read the ledger on the foyer table.', 'neutral');
  };

  const handleContinueSaved = () => {
    const saved = loadSavedProgress();
    if (!saved) {
      handleStartNew();
      return;
    }
    horrorAudio.init();
    horrorAudio.setMuted(audioMuted);
    setInventory(saved.inventory);
    setDiscoveredNotes(saved.discoveredNotes);
    setFlags(saved.flags);
    setSelectedSlot(saved.inventory.length > 0 ? 0 : null);
    setPhase('playing');
    pushToast('Investigation resumed from the Grand Foyer.', 'neutral');
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#07090E] text-[#E8E2D5]">
      {/* Isolated Full-Viewport 3D WebGL Canvas */}
      <ManorCanvas
        phase={phase}
        flags={flags}
        inventory={inventory}
        lanternOn={lanternOn}
        resetSignal={resetSignal}
        onTargetChange={setTarget}
        onRoomChange={(room) => setCurrentRoom(room)}
        onInteract={handleInteract}
        onPointerLockChange={setPointerLocked}
      />

      {/* Atmospheric Vignette (pure CSS radial gradient, no backdrop-filter) */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(circle at center, transparent 48%, rgba(5, 6, 10, 0.72) 100%)',
        }}
      />

      {/* Title Curtain */}
      {phase === 'title' && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-start px-8 md:px-20"
          style={{
            background:
              'linear-gradient(90deg, rgba(8,9,14,0.92) 0%, rgba(8,9,14,0.72) 52%, rgba(8,9,14,0.28) 100%)',
          }}
        >
          <div className="max-w-xl space-y-6">
            <div className="flex items-center gap-2 text-xs font-mono-ui text-[#D4AF6E]">
              <span>November 1894</span>
              <span aria-hidden="true">·</span>
              <span>First-Person Mystery Exploration</span>
            </div>

            <h1 className="font-display text-5xl md:text-6xl font-semibold text-[#F4EFE6] leading-[1.05] text-balance">
              Blackwood Hollow
            </h1>

            <p className="text-base text-[#C4BDB0] leading-relaxed">
              Five years after the Blackwood family vanished behind shuttered oak doors, you enter
              their abandoned Victorian manor to catalog the estate. Whispers linger behind the
              wainscoting—and something sealed within the walls is waiting to be found.
            </p>

            <div className="grid grid-cols-2 gap-4 border-y border-white/10 py-4 text-xs text-[#A9A295]">
              <div>
                <div className="text-[#E8E2D5] font-medium mb-0.5">Exploration</div>
                <div>WASD Move · Mouse / Drag Look</div>
              </div>
              <div>
                <div className="text-[#E8E2D5] font-medium mb-0.5">Investigation</div>
                <div>E / Click Interact · 1–6 Inventory</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={handleStartNew}
                className="px-6 py-3 bg-[#D4AF6E] hover:bg-[#E3C183] text-[#090A0F] font-semibold text-sm transition-colors whitespace-nowrap shrink-0"
              >
                Enter the Manor
              </button>

              {savedExists && (
                <button
                  onClick={handleContinueSaved}
                  className="px-5 py-3 border border-[#D4AF6E]/45 bg-[#12141D] hover:bg-[#191C28] text-[#E8E2D5] font-medium text-sm transition-colors whitespace-nowrap shrink-0"
                >
                  Continue Investigation
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Playing HUD & Collapsible Bottom Dock */}
      {phase !== 'title' && phase !== 'ending' && (
        <GameHud
          currentRoom={currentRoom}
          discoveredSecrets={discoveredSecretsCount}
          inventory={inventory}
          selectedSlot={selectedSlot}
          combineSourceSlot={combineSourceSlot}
          target={target}
          lanternOn={lanternOn}
          audioMuted={audioMuted}
          hudCollapsed={hudCollapsed}
          pointerLocked={pointerLocked}
          toasts={toasts}
          onSelectSlot={handleSelectSlot}
          onInspectSelected={() => {
            if (selectedSlot !== null && inventory[selectedSlot]) {
              setInspectingItemId(inventory[selectedSlot]);
              setPhase('inspecting');
            }
          }}
          onStartCombine={() => {
            if (selectedSlot !== null) {
              setCombineSourceSlot(selectedSlot);
            }
          }}
          onToggleLantern={() => {
            setLanternOn((l) => !l);
            horrorAudio.playUnlock();
          }}
          onOpenJournal={() => {
            horrorAudio.playPaper();
            setPhase('journal');
          }}
          onToggleMute={() => {
            setAudioMuted((m) => {
              const next = !m;
              horrorAudio.setMuted(next);
              return next;
            });
          }}
          onToggleCollapse={() => setHudCollapsed((c) => !c)}
          onResetGame={handleStartNew}
        />
      )}

      {/* Interactive Puzzle Modal */}
      {phase === 'puzzle' && activePuzzle && (
        <PuzzleModal
          puzzle={activePuzzle}
          flags={flags}
          inventory={inventory}
          onClose={() => {
            setActivePuzzle(null);
            setPhase('playing');
          }}
          onSolveMantle={() => {
            setFlags((f) => ({ ...f, mantleSolved: true }));
            pushToast('A brick niche slides open beside the chimney hearth!', 'discovery');
          }}
          onInsertPendulum={() => {
            removeItem('silver_pendulum');
            setFlags((f) => ({ ...f, pendulumInserted: true }));
            pushToast('Silver Pendulum suspended inside the Grandfather Clock.', 'discovery');
          }}
          onSolveClock={() => {
            setFlags((f) => ({ ...f, clockSolved: true, bookcaseSlid: true }));
            pushToast(
              'Deep inside the north wing, heavy gears groan as the Study bookcase slides open.',
              'discovery',
            );
          }}
          onSolveAstrolabe={() => {
            addItem('moonstone_medallion');
            setFlags((f) => ({ ...f, astrolabeSolved: true, wallPassageOpened: true }));
            pushToast(
              'Moonstone Medallion acquired! A hidden wall passage opens in the North Conservatory.',
              'discovery',
            );
          }}
          onPlaceRelic={(relic) => {
            removeItem(relic);
            setFlags((prev) => {
              const nextPlaced = { ...prev.placedRelics, [relic]: true };
              const allPlaced =
                nextPlaced.crimson_seal &&
                nextPlaced.moonstone_medallion &&
                nextPlaced.signet_ring;

              if (allPlaced) {
                horrorAudio.playSanctumResolve();
                horrorAudio.setDreadLevel(0.05);
                unlockNote('epilogue_record', false);
                window.setTimeout(() => {
                  setActivePuzzle(null);
                  setPhase('ending');
                }, 1100);
              }
              return {
                ...prev,
                placedRelics: nextPlaced,
                ritualBroken: allPlaced,
              };
            });
            pushToast(`Placed ${ITEMS[relic].name} upon the Sanctum Altar.`, 'discovery');
          }}
        />
      )}

      {/* Archivist's Journal Modal */}
      {phase === 'journal' && (
        <JournalModal
          discoveredNotes={discoveredNotes}
          activeNoteId={activeNoteId}
          flags={flags}
          inventory={inventory}
          onSelectNote={(id) => {
            horrorAudio.playPaper();
            setActiveNoteId(id);
          }}
          onClose={() => setPhase('playing')}
        />
      )}

      {/* Item Inspect Modal */}
      {phase === 'inspecting' && inspectingItemId && (
        <ItemInspectModal
          itemId={inspectingItemId}
          onStartCombine={() => {
            const idx = inventory.indexOf(inspectingItemId);
            setInspectingItemId(null);
            setPhase('playing');
            if (idx !== -1) setCombineSourceSlot(idx);
          }}
          onClose={() => {
            setInspectingItemId(null);
            setPhase('playing');
          }}
        />
      )}

      {/* Story Epilogue / Ending Curtain */}
      {phase === 'ending' && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center p-6"
          style={{ backgroundColor: 'rgba(8, 10, 16, 0.88)' }}
        >
          <div className="w-full max-w-xl border border-[#D4AF6E]/35 bg-[#0D0E14] p-8 space-y-6 shadow-2xl">
            <div className="flex items-center gap-2 text-xs font-mono-ui text-[#D4AF6E]">
              <span>Mystery Complete</span>
              <span aria-hidden="true">·</span>
              <span>November 13, 1894</span>
            </div>

            <h2 className="font-display text-4xl font-semibold text-[#F4EFE6] text-balance">
              Dawn Over Blackwood Hollow
            </h2>

            <div className="space-y-3 text-sm text-[#C8C2B6] leading-relaxed">
              {LORE_NOTES.epilogue_record.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 border-y border-white/10 py-4 text-xs">
              <div>
                <div className="text-[#8D867A]">Wall Secrets Uncovered</div>
                <div className="font-mono-ui text-lg text-[#F4EFE6] mt-0.5">
                  {discoveredSecretsCount} / 4
                </div>
              </div>
              <div>
                <div className="text-[#8D867A]">Archival Documents</div>
                <div className="font-mono-ui text-lg text-[#F4EFE6] mt-0.5">
                  {discoveredNotes.length} / 5
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setPhase('playing')}
                className="px-5 py-2.5 border border-white/20 bg-[#14161F] hover:border-[#D4AF6E]/55 text-xs font-medium text-[#E8E2D5] transition-colors whitespace-nowrap shrink-0"
              >
                Explore Silent Manor
              </button>
              <button
                onClick={handleStartNew}
                className="px-5 py-2.5 bg-[#D4AF6E] hover:bg-[#E3C183] text-[#090A0F] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                Begin New Investigation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
