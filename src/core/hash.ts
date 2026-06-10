const RANK_COUNT = 13;
const MAX_HAND_SIZE = 7;
const MAX_RANK_DUPES = 4;

// suffixCounts[length][sum] is the number of digit vectors of the given length, where each digit
// is between 0 and MAX_RANK_DUPES, whose digits add up to `sum`.
const buildSuffixCounts = (): number[][] => {
  const counts: number[][] = [];
  for (let length = 0; length <= RANK_COUNT; length += 1) {
    counts.push(new Array<number>(MAX_HAND_SIZE + 1).fill(0));
  }
  counts[0][0] = 1;
  for (let length = 1; length <= RANK_COUNT; length += 1) {
    for (let sum = 0; sum <= MAX_HAND_SIZE; sum += 1) {
      for (let digit = 0; digit <= MAX_RANK_DUPES && digit <= sum; digit += 1) {
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
