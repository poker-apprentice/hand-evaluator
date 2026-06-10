import * as constants from './constants';

// Performance: ES module imports are live bindings, so the CommonJS build reads an imported
// name as a property access on the required module (`constants_1.RANK_COUNT`) on every use.
// That is harmless in cold code, but `hashQuinary` runs in the innermost loop of every odds
// calculation, where the per-read overhead benchmarks ~10% slower than a local const.  Copying
// the (never-reassigned) values once at module load keeps `constants.ts` as the single source
// of truth without that cost.
const MAX_RANKABLE_CARDS = constants.MAX_RANKABLE_CARDS;
const RANK_COUNT = constants.RANK_COUNT;
const SUIT_COUNT = constants.SUIT_COUNT;

// suffixCounts[length][sum] is the number of digit vectors of the given length, where each digit
// is between 0 and SUIT_COUNT (a rank appears at most once per suit), whose digits add up to
// `sum`.
const buildSuffixCounts = (): number[][] => {
  const counts: number[][] = [];
  for (let length = 0; length <= RANK_COUNT; length += 1) {
    counts.push(new Array<number>(MAX_RANKABLE_CARDS + 1).fill(0));
  }
  counts[0][0] = 1;
  for (let length = 1; length <= RANK_COUNT; length += 1) {
    for (let sum = 0; sum <= MAX_RANKABLE_CARDS; sum += 1) {
      for (let digit = 0; digit <= SUIT_COUNT && digit <= sum; digit += 1) {
        counts[length][sum] += counts[length - 1][sum - digit];
      }
    }
  }
  return counts;
};

const suffixCounts = buildSuffixCounts();

/**
 * Computes a perfect hash of a "quinary" rank-count vector.  A hand containing no flush is fully
 * described by how many cards of each rank it holds: a vector of 13 digits, each between 0 and 4.
 * Every such vector with a fixed total card count (`handSize`) is mapped to a unique index in the
 * range [0, quinaryTableSize(handSize)), allowing hand ranks to be stored in a compact table.
 * @param {ArrayLike<number>} rankCounts Number of cards held of each of the 13 ranks.
 * @param {number} handSize Total number of cards described by `rankCounts`.
 * @returns {number} The lexicographic position of `rankCounts` among all same-sum vectors.
 */
export const hashQuinary = (rankCounts: ArrayLike<number>, handSize: number): number => {
  let index = 0;
  let remaining = handSize;
  for (let rank = 0; rank < RANK_COUNT && remaining > 0; rank += 1) {
    const digit = rankCounts[rank];
    for (let smaller = 0; smaller < digit; smaller += 1) {
      index += suffixCounts[RANK_COUNT - 1 - rank][remaining - smaller];
    }
    remaining -= digit;
  }
  return index;
};

/**
 * Determines the number of distinct rank-count vectors for a hand of the given size, which is the
 * lookup table size required to hold every value produced by `hashQuinary`.
 * @param {number} handSize Total number of cards in a hand.
 * @returns {number} The number of distinct rank-count vectors.
 */
export const quinaryTableSize = (handSize: number): number => suffixCounts[RANK_COUNT][handSize];
