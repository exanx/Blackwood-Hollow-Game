import React from 'react';
import { X, Layers } from 'lucide-react';
import { ITEMS } from '../data/manorData';
import { InventoryItemId } from '../types/game';
import { ItemIcon } from './ItemIcon';

interface ItemInspectModalProps {
  itemId: InventoryItemId;
  onStartCombine: () => void;
  onClose: () => void;
}

export const ItemInspectModal: React.FC<ItemInspectModalProps> = ({
  itemId,
  onStartCombine,
  onClose,
}) => {
  const item = ITEMS[itemId];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-md border border-[#D4AF6E]/25 bg-[#0D0E14] text-[#E8E2D5] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="text-xs text-[#D4AF6E]">{item.category}</div>
          <button
            onClick={onClose}
            aria-label="Close inspection"
            className="p-1.5 text-[#A9A295] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 shrink-0 flex items-center justify-center border border-[#D4AF6E]/35 bg-[#151721] text-[#D4AF6E]">
              <ItemIcon id={itemId} className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-[#F4EFE6]">
                {item.name}
              </h2>
              <p className="text-xs text-[#9C9588]">{item.shortHint}</p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-[#CBC4B7] leading-relaxed">
            <p>{item.description}</p>
            <p className="text-xs text-[#A9A295] border-t border-white/10 pt-3">
              {item.inspectDetail}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {item.combinableWith && (
              <button
                onClick={onStartCombine}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium border border-[#D4AF6E]/45 bg-[#171923] text-[#D4AF6E] hover:bg-[#D4AF6E]/15 transition-colors whitespace-nowrap shrink-0"
              >
                <Layers className="w-3.5 h-3.5" />
                Combine with another item
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium bg-[#D4AF6E] text-[#090A0F] hover:bg-[#E3C183] transition-colors whitespace-nowrap shrink-0"
            >
              Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
