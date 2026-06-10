import { HandStrength } from '@poker-apprentice/types';
import * as constants from './constants';
import { hashQuinary } from './hash';
import { FLUSH, NOFLUSH5, NOFLUSH6, NOFLUSH7 } from './tables';

// Performance: ES module imports are live bindings, so the CommonJS build reads an imported
// name as a property access on the required module (`constants_1.SUIT_COUNT`) on every use.
// That is harmless in cold code, but `rankN` runs in the innermost loop of every odds
// calculation, where the per-read overhead benchmarks ~10% slower than a local const.  Copying
// the (never-reassigned) values once at module load keeps `constants.ts` as the single source
// of truth without that cost.
const HAND_SIZE = constants.HAND_SIZE;
const RANK_COUNT = constants.RANK_COUNT;
const SUIT_COUNT = constants.SUIT_COUNT;

// The strongest possible hand rank returned by `rankN` (a royal flush).
export const BEST_RANK = 1;

// The weakest possible hand rank returned by `rankN` (7-5-4-3-2 unsuited).
export const WORST_RANK = 7462;

const NOFLUSH_BY_SIZE: Array<Int16Array | undefined> = [
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  NOFLUSH5,
  NOFLUSH6,
  NOFLUSH7,
];

// Reused scratch buffers; `rankN` performs no allocation, which also means it is not reentrant.
const suitCounts = new Uint8Array(SUIT_COUNT);
const rankCounts = new Uint8Array(RANK_COUNT);

/**
 * Evaluates the best 5-card poker hand makeable from 5, 6, or 7 cards, provided as integer card
 * ids (see `src/core/cards.ts`).  Returns the hand's rank among all 7,462 distinct 5-card hand
 * equivalence classes, where 1 is the best possible hand (a royal flush) and 7462 the worst;
 * any two hands can be compared directly by comparing their ranks.
 * @param {ArrayLike<number>} cards Integer card ids to evaluate.
 * @param {number} length Number of cards to read from `cards` (5, 6, or 7).
 * @returns {number} The rank of the best 5-card hand, between 1 and 7462.
 */
export const rankN = (cards: ArrayLike<number>, length: number): number => {
  suitCounts[0] = 0;
  suitCounts[1] = 0;
  suitCounts[2] = 0;
  suitCounts[3] = 0;
  for (let i = 0; i < length; i += 1) {
    suitCounts[cards[i] & 3] += 1;
  }

  // At most one suit can hold 5 of up to 7 cards, and a hand containing a flush can never make
  // a better non-flush hand (quads/full house require 4+ off-suit cards), so the suited cards
  // alone determine the hand's rank.
  for (let suit = 0; suit < SUIT_COUNT; suit += 1) {
    if (suitCounts[suit] >= HAND_SIZE) {
      let mask = 0;
      for (let i = 0; i < length; i += 1) {
        if ((cards[i] & 3) === suit) {
          mask |= 1 << (cards[i] >> 2);
        }
      }
      return FLUSH[mask];
    }
  }

  rankCounts.fill(0);
  for (let i = 0; i < length; i += 1) {
    rankCounts[cards[i] >> 2] += 1;
  }
  return (NOFLUSH_BY_SIZE[length] as Int16Array)[hashQuinary(rankCounts, length)];
};

/**
 * Maps a hand rank produced by `rankN` to its corresponding hand strength.
 * @param {number} rank A hand rank between 1 and 7462.
 * @returns {HandStrength} The strength of the hand.
 */
export const handStrengthFromRank = (rank: number): HandStrength => {
  if (rank === 1) return HandStrength.RoyalFlush;
  if (rank <= 10) return HandStrength.StraightFlush;
  if (rank <= 166) return HandStrength.FourOfAKind;
  if (rank <= 322) return HandStrength.FullHouse;
  if (rank <= 1599) return HandStrength.Flush;
  if (rank <= 1609) return HandStrength.Straight;
  if (rank <= 2467) return HandStrength.ThreeOfAKind;
  if (rank <= 3325) return HandStrength.TwoPair;
  if (rank <= 6185) return HandStrength.OnePair;
  return HandStrength.HighCard;
};
