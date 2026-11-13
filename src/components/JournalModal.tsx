import React, { useState } from 'react';
import { X, BookOpen } from 'lucide-react';
import { LORE_NOTES, getRoomGuidance } from '../data/manorData';
import { InventoryItemId, WorldFlags } from '../types/game';

interface JournalModalProps {
  discoveredNotes: string[];
  activeNoteId: string | null;
  flags: WorldFlags;
  inventory: InventoryItemId[];
  onSelectNote: (id: string) => void;
  onClose: () => void;
}

export const JournalModal: React.FC<JournalModalProps> = ({
  discoveredNotes,
  activeNoteId,
  flags,
  inventory,
  onSelectNote,
  onClose,
}) => {
  const [fallbackId] = useState(discoveredNotes[0] ?? 'archivist_brief');
  const currentId = activeNoteId && discoveredNotes.includes(activeNoteId) ? activeNoteId : fallbackId;
  const note = discoveredNotes.length > 0 ? LORE_NOTES[currentId] : null;
  const guidance = getRoomGuidance(flags, inventory);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-3xl h-[540px] max-h-[85vh] flex flex-col border border-[#D4AF6E]/25 bg-[#0D0E14] text-[#E8E2D5] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-[#D4AF6E]" />
            <div>
              <h2 className="font-display text-2xl font-semibold text-[#F4EFE6]">
                Archivist’s Journal
              </h2>
              <p className="text-xs text-[#9C9588]">
                {discoveredNotes.length} {discoveredNotes.length === 1 ? 'document' : 'documents'} recovered · Blackwood Hollow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close journal"
            className="p-2 text-[#A9A295] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
          {/* Document List */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-white/10 overflow-y-auto manor-scroll p-3 space-y-1.5">
            {discoveredNotes.length === 0 ? (
              <p className="text-xs text-[#7F786D] p-3">
                No documents recovered yet. Examine the foyer console table to begin your records.
              </p>
            ) : (
              discoveredNotes.map((id, index) => {
                const entry = LORE_NOTES[id];
                if (!entry) return null;
                const active = id === currentId;
                return (
                  <button
                    key={id}
                    onClick={() => onSelectNote(id)}
                    className={`w-full text-left p-3 border transition-colors ${
                      active
                        ? 'border-[#D4AF6E]/55 bg-[#171923] text-[#F4EFE6]'
                        : 'border-transparent hover:bg-[#13151D] text-[#A9A295]'
                    }`}
                  >
                    <div className="font-mono-ui text-[11px] text-[#D4AF6E] mb-0.5">
                      0{index + 1}. {entry.location}
                    </div>
                    <div className="font-display text-lg font-medium leading-snug">
                      {entry.title}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Reading Pane */}
          <div className="md:col-span-8 flex flex-col min-h-0 overflow-y-auto manor-scroll p-6 space-y-5">
            {note ? (
              <>
                <div className="space-y-1.5 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2 text-xs text-[#9C9588]">
                    <span>{note.author}</span>
                    <span aria-hidden="true">·</span>
                    <span>{note.date}</span>
                    <span aria-hidden="true">·</span>
                    <span>{note.location}</span>
                  </div>
                  <h3 className="font-display text-3xl font-semibold text-[#F4EFE6]">
                    {note.title}
                  </h3>
                </div>

                <div className="space-y-4 text-[15px] leading-relaxed text-[#CBC4B7]">
                  {note.body.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>

                <div className="border border-[#D4AF6E]/25 bg-[#14161F] p-4 space-y-1">
                  <div className="text-xs font-medium text-[#D4AF6E]">Margin Observation</div>
                  <p className="text-xs text-[#B8B1A4] leading-relaxed">{note.clueSummary}</p>
                </div>
              </>
            ) : (
              <div className="text-sm text-[#8D867A]">
                Select a recovered document to read its contents.
              </div>
            )}

            {/* Current Thread Summary */}
            <div className="mt-auto border-t border-white/10 pt-4">
              <div className="text-xs text-[#8D867A] mb-1">Current Investigation Thread</div>
              <p className="text-xs text-[#E8E2D5]">{guidance}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
