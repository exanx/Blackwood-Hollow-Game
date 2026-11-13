import { InventoryItem, InventoryItemId, LoreNote } from '../types/game';

export const ITEMS: Record<InventoryItemId, InventoryItem> = {
  brass_key: {
    id: 'brass_key',
    name: 'Brass Skeleton Key',
    category: 'Key',
    shortHint: 'Bears the Blackwood study crest',
    description:
      'A heavy tarnished brass key resting inside the velvet lining of the parlour music box.',
    inspectDetail:
      'The bow is cast in the shape of a weeping willow, and "STUDY" is faintly engraved along the collar.',
  },
  phosphor_lens: {
    id: 'phosphor_lens',
    name: 'Phosphor Glass Lens',
    category: 'Optical Relic',
    shortHint: 'Reveals hidden alchemical inks',
    description:
      'A cobalt-tinted magnifying monocle rimmed in blackened pewter and dusted with luminescent salts.',
    inspectDetail:
      'Looking through the glass bends candlelight into eerie violet threads. Alistair used these lenses to read murals painted in invisible phosphor.',
  },
  torn_sheet: {
    id: 'torn_sheet',
    name: 'Torn Sheet Music',
    category: 'Clue',
    shortHint: 'Annotated with chime numerals & an hour',
    description:
      'A brittle page torn from a nocturne score, marked in dried crimson ink across four chime staves.',
    inspectDetail:
      'Beneath four circled notes are Roman numerals in heavy ink: III (Raven) · I (Crescent) · IV (Chalice) · II (Crown). In the margin: "Strike at 11:45."',
  },
  silver_pendulum: {
    id: 'silver_pendulum',
    name: 'Silver Pendulum',
    category: 'Mechanism',
    shortHint: 'Weighted bob for the foyer clock',
    description:
      'An ornate silver clock pendulum etched with concentric zodiac rings, still cool to the touch.',
    inspectDetail:
      'Its hook is notched specifically for the tall grandfather clock standing vigil in the Grand Foyer.',
  },
  winch_handle: {
    id: 'winch_handle',
    name: 'Iron Winch Handle',
    category: 'Mechanism Part',
    shortHint: 'Missing its toothed drive gear',
    description:
      'A forged iron crank arm with a square spindle socket, found beside the study inkwell.',
    inspectDetail:
      'The socket is clean and greased, waiting for a matching toothed iron gear to form a working winch crank.',
    combinableWith: 'iron_gear',
    combinesInto: 'assembled_crank',
  },
  iron_gear: {
    id: 'iron_gear',
    name: 'Toothed Iron Gear',
    category: 'Mechanism Part',
    shortHint: 'Fits a square winch spindle',
    description:
      'A heavy twelve-toothed iron cog recovered from the dark alcove behind the study bookcase.',
    inspectDetail:
      'Its center bore matches the square shaft of a hand-winch arm. Combining both parts will restore a gate winch.',
    combinableWith: 'winch_handle',
    combinesInto: 'assembled_crank',
  },
  assembled_crank: {
    id: 'assembled_crank',
    name: 'Assembled Winch Crank',
    category: 'Mechanism',
    shortHint: 'Opens the Conservatory lattice gate',
    description:
      'The forged winch arm locked firmly onto the twelve-toothed iron gear, ready to turn heavy chains.',
    inspectDetail:
      'Sturdy enough to haul up the rusted iron portcullis guarding the East Conservatory wing.',
  },
  crimson_seal: {
    id: 'crimson_seal',
    name: 'Crimson Wax Seal',
    category: 'Sanctum Relic',
    shortHint: 'One of three Blackwood binding seals',
    description:
      'A solidified disc of blood-red wax encased in a copper bezel, stamped with an unbroken hourglass.',
    inspectDetail:
      'Warmth lingers in the copper rim despite the freezing draft. One of three seals required at the Sanctum Altar.',
  },
  moonstone_medallion: {
    id: 'moonstone_medallion',
    name: 'Moonstone Medallion',
    category: 'Sanctum Relic',
    shortHint: 'One of three Blackwood binding seals',
    description:
      'A pale opalescent stone set in silver filigree, liberated from the Conservatory astrolabe.',
    inspectDetail:
      'Under lantern light, faint silvery veins shift across the stone like mist trapped behind glass.',
  },
  signet_ring: {
    id: 'signet_ring',
    name: 'Blackwood Signet Ring',
    category: 'Sanctum Relic',
    shortHint: 'Evelyn’s heirloom ring from the walls',
    description:
      'A tarnished silver signet ring hidden inside a loose brick cavity within the manor’s inner walls.',
    inspectDetail:
      'Engraved inside the band: "E.B. — Never let the walls remember." The final relic for the Sanctum Altar.',
  },
};

export const LORE_NOTES: Record<string, LoreNote> = {
  archivist_brief: {
    id: 'archivist_brief',
    title: 'Archivist’s Ledger Entry',
    author: 'Julian Vance',
    date: 'November 12, 1894',
    location: 'Grand Foyer',
    excerpt: 'Arrived past ten beneath a hollow gale. The manor breathes behind its wainscoting.',
    body: [
      'The solicitor’s carriage refused to wait past the iron gates. Blackwood Hollow has stood shuttered since the winter of 1889, yet dry cedar smoke still clings to the foyer air.',
      'Only the West Parlour stands unlatched. Both the Study to the north-west and the Conservatory gate to the east are sealed fast. Someone—or something—left the grandfather clock stopped with its pendulum removed.',
      'I must inspect every wing carefully. The estate blueprints mention thick masonry chimneys, yet the foyer walls sound hollow when tapped.',
    ],
    clueSummary:
      'Explore the unlocked West Parlour first to look for keys or tools that open the sealed wings.',
  },
  alistair_ledger: {
    id: 'alistair_ledger',
    title: 'Alistair’s Private Ledger',
    author: 'Alistair Blackwood',
    date: 'October 19, 1889',
    location: 'Study & Library',
    excerpt: 'The chimney chimes answer only the old cadence. At quarter to twelve, the shelves yield.',
    body: [
      'Evelyn insists the house watches us from between the studs. She does not understand that stone remembers what flesh forgets. By tuning the parlour mantle chimes to the family dirge, I concealed our work from prying eyes.',
      'The parlour mantle sequence must be struck in strict order: III (Raven), then I (Crescent), then IV (Chalice), and finally II (Crown).',
      'When the silver pendulum hangs once more in the foyer clock and its hands rest at quarter to midnight—11:45—the counterweight inside the north wall will draw the study bookcase aside.',
    ],
    clueSummary:
      'Mantle Chimes: III · I · IV · II. Foyer Grandfather Clock: insert Silver Pendulum and set to 11:45.',
  },
  masons_confession: {
    id: 'masons_confession',
    title: 'The Mason’s Confession',
    author: 'Thomas Hallow, Master Mason',
    date: 'November 2, 1889',
    location: 'Hidden Alcove',
    excerpt: 'We built a second skin of lath and plaster around the east wing—large enough for a man to walk unseen.',
    body: [
      'Lord Blackwood paid triple sovereigns in silence and had us mortar a false wall behind the study bookshelves and another behind the conservatory vines. Between the outer brick and the parlor paneling runs a narrow timber gallery.',
      'On the final night, I heard chimes from the chimney and a woman weeping behind the plaster. I dropped my drive cog in the alcove, barred the conservatory lattice, and walked down the moor road before dawn.',
      'If any soul searches for the lost daughter, look to the lunar fresco in the east conservatory—only cobalt phosphor reveals the stars Alistair painted.',
    ],
    clueSummary:
      'Combine the Iron Winch Handle and Toothed Iron Gear in your inventory to open the East Conservatory gate, then examine the Conservatory fresco with the Phosphor Glass Lens.',
  },
  evelyn_letter: {
    id: 'evelyn_letter',
    title: 'Evelyn’s Final Letter',
    author: 'Evelyn Blackwood',
    date: 'Undated',
    location: 'Passage Within the Walls',
    excerpt: 'If you are reading this inside the dark timbers, you have already heard the walls whisper.',
    body: [
      'Father believed a binding ritual could freeze our family out of time’s reach, locking grief and decay inside these oak ribs forever. Instead, the house drank our names and left only echoes pacing the crawlspace.',
      'I hid my signet ring here inside the wall brick so he could never complete the altar alone. Do not fear the shadows behind you—they only wish to rest.',
      'Carry the Crimson Wax Seal, the Moonstone Medallion, and my Signet Ring to the Sanctum Altar at the end of this gallery. Set all three in their stone hollows to unbind Blackwood Hollow.',
    ],
    clueSummary:
      'Place all three relics—Crimson Wax Seal, Moonstone Medallion, and Blackwood Signet Ring—upon the Sanctum Altar.',
  },
  epilogue_record: {
    id: 'epilogue_record',
    title: 'Dawn Over Blackwood Hollow',
    author: 'Julian Vance',
    date: 'November 13, 1894',
    location: 'The Inner Sanctum',
    excerpt: 'When the third seal settled into stone, the oppressive hush inside the walls exhaled at last.',
    body: [
      'As the signet clicked beside the moonstone and crimson wax, the low hum beneath the floorboards fell silent. Through the high conservatory panes, a pale November dawn broke across the frost-rimed lawn.',
      'The whispers that had shadowed every corridor dissolved like chimney smoke. Whatever pact Alistair Blackwood forged inside the manor’s bones was finally laid to rest—and the front doors stood unlatched to the morning air.',
    ],
    clueSummary: 'Mystery complete.',
  },
};

export const MANTLE_SEQUENCE = [3, 1, 4, 2] as const;
export const MANTLE_SYMBOLS = [
  { index: 1, numeral: 'I', label: 'Crescent', pitch: 261.63 },
  { index: 2, numeral: 'II', label: 'Crown', pitch: 293.66 },
  { index: 3, numeral: 'III', label: 'Raven', pitch: 329.63 },
  { index: 4, numeral: 'IV', label: 'Chalice', pitch: 392.0 },
];

export const LUNAR_PHASES = [
  'New Moon',
  'Waning Crescent',
  'Half Moon',
  'Total Eclipse',
  'Blood Moon',
] as const;

export const ASTROLABE_SOLUTION = [1, 3, 4] as const; // Waning Crescent, Total Eclipse, Blood Moon

export function getRoomGuidance(flags: {
  foyerNoteRead: boolean;
  studyDoorUnlocked: boolean;
  mantleSolved: boolean;
  clockSolved: boolean;
  conservatoryGateUnlocked: boolean;
  frescoRevealed: boolean;
  astrolabeSolved: boolean;
  ritualBroken: boolean;
}, inventory: InventoryItemId[]): string {
  if (flags.ritualBroken) {
    return 'The binding upon Blackwood Hollow has been broken.';
  }
  if (flags.astrolabeSolved) {
    return 'Enter the revealed passage inside the Conservatory wall and bring all three relics to the Sanctum Altar.';
  }
  if (flags.conservatoryGateUnlocked) {
    if (!flags.frescoRevealed) {
      return 'Inspect the faded fresco on the south Conservatory wall using the Phosphor Glass Lens.';
    }
    return 'Align the Conservatory Lunar Astrolabe rings to Waning Crescent, Total Eclipse, and Blood Moon.';
  }
  if (flags.clockSolved) {
    if (inventory.includes('assembled_crank')) {
      return 'Use the Assembled Winch Crank on the East Conservatory lattice gate in the Foyer.';
    }
    return 'Search the alcove behind the Study bookcase, then combine the Iron Winch Handle and Toothed Iron Gear.';
  }
  if (flags.mantleSolved) {
    return 'Insert the Silver Pendulum into the Foyer Grandfather Clock and set the hands to 11:45.';
  }
  if (flags.studyDoorUnlocked) {
    return 'Search the Study & Library desk for clues to the Parlour chimney chimes and the Foyer clock.';
  }
  if (inventory.includes('brass_key')) {
    return 'Use the Brass Skeleton Key from your inventory to unlock the Study door in the north-west corner.';
  }
  return 'Explore the unlocked West Parlour and examine the music box and cabinets.';
}
