import { WORST_RANK, rankN } from './rank';

const HAND_SIZE = 5;
const MAX_RANKABLE_CARDS = 7;

export type EvalMode = 'single' | 'holeSubsets' | 'pairedSubsets';

interface PairedSubset {
  holeIndexes: number[];
  boardIndexes: number[];
}

export interface GamePlan {
  mode: EvalMode;
  holeCount: number;
  communityCount: number;
  /** Hole-card index subsets, each combined with the full board ('holeSubsets' mode only). */
  holeSubsets: number[][];
  /** Pairs of hole/board index subsets forming exactly 5 cards ('pairedSubsets' mode only). */
  pairedSubsets: PairedSubset[];
  /** Number of `rankN` lookups required to evaluate one hand. */
  unitsPerHand: number;
}

// Enumerates all `size`-element index subsets of [0, count) in lexicographic order.  Unlike
// `getCombinations`, a zero-element subset yields [[]] rather than [].
const getIndexSubsets = (count: number, size: number): number[][] => {
  if (size === 0) {
    return [[]];
  }
  if (size > count) {
    return [];
  }
  const subsets: number[][] = [];
  const current = new Array<number>(size);
  const visit = (start: number, depth: number): void => {
    if (depth === size) {
      subsets.push(current.slice());
      return;
    }
    for (let index = start; index <= count - (size - depth); index += 1) {
      current[depth] = index;
      visit(index + 1, depth + 1);
    }
  };
  visit(0, 0);
  return subsets;
};

/**
 * Compiles the hole-card usage rules of a game into a reusable evaluation plan: the list of
 * (hole, board) card-index combinations that must be considered to find a hand's best 5-card
 * hand.  Compiling once per call lets scenario enumeration reuse the index lists across every
 * evaluated scenario.  Three strategies exist, from fastest to most general:
 *
 *  - 'single': no effective constraint; all cards are ranked together in one lookup.
 *  - 'holeSubsets': only a maximum constraint; each maximal hole subset joins the full board.
 *  - 'pairedSubsets': exact 5-card combinations of hole and board subsets are enumerated.
 * @param {number} holeCount Number of hole cards each hand holds.
 * @param {number} communityCount Number of community cards available.
 * @param {number} minimumHoleCards Minimum number of hole cards that must be used.
 * @param {number} maximumHoleCards Maximum number of hole cards that may be used.
 * @returns {GamePlan} The compiled plan.
 */
export const compilePlan = (
  holeCount: number,
  communityCount: number,
  minimumHoleCards: number,
  maximumHoleCards: number,
): GamePlan => {
  const minUsed = Math.max(0, minimumHoleCards);
  const maxUsed = Math.min(holeCount, maximumHoleCards, HAND_SIZE);
  const totalCards = holeCount + communityCount;

  if (totalCards < HAND_SIZE) {
    throw new Error(`Cannot evaluate hands of fewer than ${HAND_SIZE} cards`);
  }
  if (minUsed > maxUsed) {
    throw new Error('minimumHoleCardsUsed cannot be greater than maximumHoleCardsUsed');
  }

  const basePlan = {
    holeCount,
    communityCount,
    holeSubsets: [] as number[][],
    pairedSubsets: [] as PairedSubset[],
  };

  if (
    minUsed <= 0 &&
    maxUsed >= Math.min(holeCount, HAND_SIZE) &&
    totalCards <= MAX_RANKABLE_CARDS
  ) {
    return { ...basePlan, mode: 'single', unitsPerHand: 1 };
  }

  if (
    minUsed <= 0 &&
    communityCount >= HAND_SIZE &&
    maxUsed + communityCount <= MAX_RANKABLE_CARDS
  ) {
    // Subsets smaller than maxUsed need no enumeration: the board alone provides 5 cards, so
    // every hand using fewer hole cards is already covered by some maximal subset's ranking.
    const holeSubsets = getIndexSubsets(holeCount, maxUsed);
    return { ...basePlan, mode: 'holeSubsets', holeSubsets, unitsPerHand: holeSubsets.length };
  }

  const pairedSubsets: PairedSubset[] = [];
  const minHoleUsed = Math.max(minUsed, HAND_SIZE - communityCount);
  for (let used = minHoleUsed; used <= maxUsed; used += 1) {
    const holeSubsets = getIndexSubsets(holeCount, used);
    const boardSubsets = getIndexSubsets(communityCount, HAND_SIZE - used);
    holeSubsets.forEach((holeIndexes) => {
      boardSubsets.forEach((boardIndexes) => {
        pairedSubsets.push({ holeIndexes, boardIndexes });
      });
    });
  }
  if (pairedSubsets.length === 0) {
    throw new Error('Hole card usage constraints cannot produce a 5-card hand');
  }
  return { ...basePlan, mode: 'pairedSubsets', pairedSubsets, unitsPerHand: pairedSubsets.length };
};

// Reused scratch buffer; like `rankN`, plan evaluation performs no allocation per call.
const evalBuffer = new Uint8Array(MAX_RANKABLE_CARDS);

/**
 * Determines the rank of the best 5-card hand formable from the provided hole and community
 * cards under the constraints encoded in the plan (see `rankN` for the rank scale).
 * @param {GamePlan} plan The compiled game plan.
 * @param {ArrayLike<number>} holeIds Integer card ids of the hand's hole cards.
 * @param {ArrayLike<number>} boardIds Integer card ids of the community cards.
 * @returns {number} The rank of the best permissible 5-card hand, between 1 and 7462.
 */
export const bestRankForPlan = (
  plan: GamePlan,
  holeIds: ArrayLike<number>,
  boardIds: ArrayLike<number>,
): number => {
  if (plan.mode === 'single') {
    let count = 0;
    for (let i = 0; i < plan.holeCount; i += 1) {
      evalBuffer[count] = holeIds[i];
      count += 1;
    }
    for (let i = 0; i < plan.communityCount; i += 1) {
      evalBuffer[count] = boardIds[i];
      count += 1;
    }
    return rankN(evalBuffer, count);
  }

  let best = WORST_RANK + 1;
  if (plan.mode === 'holeSubsets') {
    for (let s = 0; s < plan.holeSubsets.length; s += 1) {
      const subset = plan.holeSubsets[s];
      let count = 0;
      for (let i = 0; i < subset.length; i += 1) {
        evalBuffer[count] = holeIds[subset[i]];
        count += 1;
      }
      for (let i = 0; i < plan.communityCount; i += 1) {
        evalBuffer[count] = boardIds[i];
        count += 1;
      }
      const rank = rankN(evalBuffer, count);
      if (rank < best) {
        best = rank;
      }
    }
    return best;
  }

  for (let s = 0; s < plan.pairedSubsets.length; s += 1) {
    const { holeIndexes, boardIndexes } = plan.pairedSubsets[s];
    let count = 0;
    for (let i = 0; i < holeIndexes.length; i += 1) {
      evalBuffer[count] = holeIds[holeIndexes[i]];
      count += 1;
    }
    for (let i = 0; i < boardIndexes.length; i += 1) {
      evalBuffer[count] = boardIds[boardIndexes[i]];
      count += 1;
    }
    const rank = rankN(evalBuffer, count);
    if (rank < best) {
      best = rank;
    }
  }
  return best;
};
