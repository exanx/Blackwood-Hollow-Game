import React from 'react';
import { InventoryItemId } from '../types/game';

interface ItemIconProps {
  id: InventoryItemId;
  className?: string;
}

export const ItemIcon: React.FC<ItemIconProps> = ({ id, className = 'w-6 h-6' }) => {
  switch (id) {
    case 'brass_key':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
          <circle cx="7.5" cy="12" r="3.5" />
          <path d="M11 12h9.5m-2.5 0v3m-3-3v2" strokeLinecap="round" />
        </svg>
      );
    case 'phosphor_lens':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
          <circle cx="10.5" cy="10.5" r="5.5" />
          <path d="M14.5 14.5L20 20" strokeLinecap="round" />
          <path d="M8.5 9.5a2.5 2.5 0 0 1 3-1.5" strokeLinecap="round" />
        </svg>
      );
    case 'torn_sheet':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
          <path d="M6 4h9l3 3v13l-3-1.5-3 1.5-3-1.5L6 20V4z" strokeLinejoin="round" />
          <path d="M9 9h6M9 12.5h5M9 16h3" strokeLinecap="round" />
        </svg>
      );
    case 'silver_pendulum':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
          <path d="M12 3v10" strokeLinecap="round" />
          <circle cx="12" cy="16.5" r="4" />
          <circle cx="12" cy="16.5" r="1.2" />
        </svg>
      );
    case 'winch_handle':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
          <path d="M5 17l7-7h6v-4" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="3.5" y="15.5" width="3.5" height="3.5" rx="0.5" />
        </svg>
      );
    case 'iron_gear':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
          <circle cx="12" cy="12" r="3" />
          <path
            d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="6.2" />
        </svg>
      );
    case 'assembled_crank':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
          <circle cx="8" cy="15" r="4.5" />
          <circle cx="8" cy="15" r="1.5" />
          <path d="M11 12l6-6h3v3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'crimson_seal':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
          <polygon points="12,3 19,7 21,14 16,20 8,20 3,14 5,7" strokeLinejoin="round" />
          <path d="M9 8h6l-6 8h6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'moonstone_medallion':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
          <polygon points="12,3 18,12 12,21 6,12" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="2.2" />
        </svg>
      );
    case 'signet_ring':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
          <circle cx="12" cy="14" r="5.5" />
          <polygon points="9.5,8.5 12,5 14.5,8.5" strokeLinejoin="round" />
        </svg>
      );
  }
};
