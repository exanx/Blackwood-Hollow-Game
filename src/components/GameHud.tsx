import React from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  Flame,
  Layers,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ITEMS } from '../data/manorData';
import { InteractableTarget, InventoryItemId, ToastMessage } from '../types/game';
import { ItemIcon } from './ItemIcon';

interface GameHudProps {
  currentRoom: string;
  discoveredSecrets: number;
  inventory: InventoryItemId[];
  selectedSlot: number | null;
  combineSourceSlot: number | null;
  target: InteractableTarget | null;
  lanternOn: boolean;
  audioMuted: boolean;
  hudCollapsed: boolean;
  pointerLocked: boolean;
  toasts: ToastMessage[];
  onSelectSlot: (idx: number) => void;
  onInspectSelected: () => void;
  onStartCombine: () => void;
  onToggleLantern: () => void;
  onOpenJournal: () => void;
  onToggleMute: () => void;
  onToggleCollapse: () => void;
  onResetGame: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  currentRoom,
  discoveredSecrets,
  inventory,
  selectedSlot,
  combineSourceSlot,
  target,
  lanternOn,
  audioMuted,
  hudCollapsed,
  pointerLocked,
  toasts,
  onSelectSlot,
  onInspectSelected,
  onStartCombine,
  onToggleLantern,
  onOpenJournal,
  onToggleMute,
  onToggleCollapse,
  onResetGame,
}) => {
  const selectedItemId = selectedSlot !== null ? inventory[selectedSlot] : undefined;
  const selectedItem = selectedItemId ? ITEMS[selectedItemId] : null;
  const slots = Array.from({ length: 6 }, (_, i) => inventory[i] ?? null);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between">
      {/* Top-left minimal location & progress readout */}
      <div className="flex items-start justify-between px-6 pt-5">
        <div className="space-y-0.5">
          <div className="font-display text-2xl font-semibold text-[#F4EFE6] tracking-wide drop-shadow">
            {currentRoom}
          </div>
          <div className="flex items-center gap-2 text-xs text-[#A9A295] font-mono-ui">
            <span>Blackwood Hollow</span>
            <span aria-hidden="true">·</span>
            <span>Secrets {discoveredSecrets} / 4</span>
            <span aria-hidden="true">·</span>
            <span>{pointerLocked ? 'ESC to release cursor' : 'Click viewport or drag to look'}</span>
          </div>
        </div>
      </div>

      {/* Atmospheric Toast Stack (top-center, non-intrusive) */}
      <div className="pointer-events-none fixed top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-full max-w-md px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-2 text-xs tracking-wide border bg-[#0D0E14]/95 shadow-lg ${
              toast.tone === 'discovery'
                ? 'border-[#D4AF6E]/55 text-[#F4EFE6]'
                : toast.tone === 'warning'
                  ? 'border-[#9E2A2B]/60 text-[#E8B4B5]'
                  : 'border-white/15 text-[#CBC4B7]'
            }`}
          >
            {toast.text}
          </div>
        ))}
      </div>

      {/* Center Reticle & Contextual Prompt */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="relative flex flex-col items-center">
          <div
            className={`w-2 h-2 rounded-full transition-transform duration-150 ${
              target
                ? 'scale-150 bg-[#D4AF6E] ring-4 ring-[#D4AF6E]/25'
                : 'bg-[#E8E2D5]/65'
            }`}
          />
          {target && (
            <div className="absolute top-6 whitespace-nowrap px-3.5 py-1.5 bg-[#0D0E14]/92 border border-[#D4AF6E]/35 text-center shadow-lg">
              <div className="text-xs font-medium text-[#F4EFE6]">{target.title}</div>
              <div className="text-[11px] text-[#D4AF6E] font-mono-ui mt-0.5">
                [E / Click] {target.prompt}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Bottom Control & Inventory Dock */}
      <div className="pointer-events-none flex flex-col items-center pb-5 px-4">
        <div
          className={`pointer-events-auto flex flex-col items-center transition-transform duration-200 ease-out ${
            hudCollapsed ? 'translate-y-[calc(100%-16px)]' : 'translate-y-0'
          }`}
        >
          {/* Collapse Toggle Tab */}
          <button
            onClick={onToggleCollapse}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono-ui text-[#B8B1A4] hover:text-[#F4EFE6] bg-[#0D0E14]/95 border border-b-0 border-white/15 whitespace-nowrap shrink-0"
          >
            {hudCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Show Controls (H)
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Hide HUD (H)
              </>
            )}
          </button>

          {/* Main Dock Surface */}
          <div className="w-full max-w-[920px] border border-white/15 bg-[#0D0E14]/94 px-4 py-3 shadow-2xl space-y-2.5">
            {/* Selected Item Status / Combine Prompt */}
            {(selectedItem || combineSourceSlot !== null) && (
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  {combineSourceSlot !== null ? (
                    <span className="text-[#D4AF6E] truncate">
                      Select a second inventory item to combine with{' '}
                      <strong>{ITEMS[inventory[combineSourceSlot]]?.name}</strong> (click same slot to cancel)
                    </span>
                  ) : selectedItem ? (
                    <>
                      <span className="font-medium text-[#F4EFE6] whitespace-nowrap">
                        {selectedItem.name}
                      </span>
                      <span aria-hidden="true" className="text-[#6E685E]">
                        ·
                      </span>
                      <span className="text-[#A9A295] truncate">{selectedItem.shortHint}</span>
                    </>
                  ) : null}
                </div>

                {selectedItem && combineSourceSlot === null && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={onInspectSelected}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border border-white/15 bg-[#151722] hover:border-[#D4AF6E]/50 text-[#E8E2D5] whitespace-nowrap shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Inspect
                    </button>
                    {selectedItem.combinableWith && (
                      <button
                        onClick={onStartCombine}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border border-[#D4AF6E]/45 bg-[#1A1C26] hover:bg-[#D4AF6E]/15 text-[#D4AF6E] whitespace-nowrap shrink-0"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Combine
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* 6 Inventory Slots */}
              <div className="flex items-center gap-2">
                {slots.map((itemId, idx) => {
                  const isSelected = selectedSlot === idx;
                  const isCombineSrc = combineSourceSlot === idx;
                  const item = itemId ? ITEMS[itemId] : null;

                  return (
                    <button
                      key={idx}
                      onClick={() => onSelectSlot(idx)}
                      title={item ? `${item.name} (${idx + 1})` : `Empty Slot (${idx + 1})`}
                      className={`relative w-12 h-12 flex items-center justify-center border transition-colors ${
                        isCombineSrc
                          ? 'border-[#D4AF6E] bg-[#D4AF6E]/20 text-[#F4EFE6]'
                          : isSelected
                            ? 'border-[#D4AF6E]/80 bg-[#1B1D28] text-[#D4AF6E]'
                            : item
                              ? 'border-white/15 bg-[#13151D] hover:border-white/35 text-[#CBC4B7]'
                              : 'border-white/10 bg-[#0F1118] text-[#45423D]'
                      }`}
                    >
                      <span className="absolute top-0.5 left-1 font-mono-ui text-[10px] text-[#7D766A]">
                        {idx + 1}
                      </span>
                      {itemId && <ItemIcon id={itemId} className="w-5 h-5" />}
                    </button>
                  );
                })}
              </div>

              {/* Action & Utility Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleLantern}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                    lanternOn
                      ? 'border-[#D4AF6E]/50 bg-[#1B1813] text-[#D4AF6E]'
                      : 'border-white/15 bg-[#13151D] text-[#A9A295] hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  Lantern (F)
                </button>

                <button
                  onClick={onOpenJournal}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-white/15 bg-[#13151D] hover:border-[#D4AF6E]/50 text-[#E8E2D5] transition-colors whitespace-nowrap shrink-0"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#D4AF6E]" />
                  Journal (J)
                </button>

                <button
                  onClick={onToggleMute}
                  aria-label={audioMuted ? 'Unmute audio' : 'Mute audio'}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-white/15 bg-[#13151D] hover:border-white/35 text-[#CBC4B7] transition-colors whitespace-nowrap shrink-0"
                >
                  {audioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  {audioMuted ? 'Muted' : 'Audio'}
                </button>

                <button
                  onClick={onResetGame}
                  title="Restart Investigation"
                  className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs border border-white/15 bg-[#13151D] hover:border-[#9E2A2B]/60 text-[#9C9588] hover:text-[#E8E2D5] transition-colors whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono-ui text-[#7D766A] pt-0.5">
              <span>WASD Move · Shift Sprint · Mouse / Drag Look · E / Click Interact</span>
              <span>1–6 Select Item · I Inspect</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
