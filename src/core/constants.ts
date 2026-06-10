import { ALL_CARDS, ALL_RANKS, ALL_SUITS } from '@poker-apprentice/types';

// Deck dimensions, derived from the types package so they can never drift from it.  ALL_RANKS
// and ALL_SUITS are typed tuples, so RANK_COUNT and SUIT_COUNT are compile-time literals.
export const RANK_COUNT = ALL_RANKS.length; // 13
export const SUIT_COUNT = ALL_SUITS.length; // 4
export const CARD_COUNT = ALL_CARDS.length; // 52

// The rank index of an ace (card ids encode ranks 2..A as 0..12).
export const ACE_RANK = RANK_COUNT - 1;

// A complete poker hand is always exactly 5 cards.
export const HAND_SIZE = 5;

// The most cards the lookup-table core can rank in one evaluation (see src/core/rank.ts).
export const MAX_RANKABLE_CARDS = 7;
