/* eslint-disable no-console */
// Generates the lookup tables used by the integer hand-evaluation core (`src/core/rank.ts`),
// writing them to `src/core/tables/tables.generated.ts`.  Run via `yarn generate:tables`.
//
// The generator builds a simple, obviously-correct 5-card evaluator, enumerates all C(52,5)
// hands to derive the canonical 7,462 hand equivalence classes (rank 1 = royal flush, rank
// 7462 = worst high card), and then fills:
//
//  - FLUSH: indexed by the 13-bit rank mask of a hand's >=5-card suit, holding the best rank
//    achievable from any 5 of those suited cards.
//  - NOFLUSH5/6/7: indexed by the perfect hash of a hand's rank-count vector (`hashQuinary`),
//    holding the best rank achievable from any 5 cards of a hand containing no 5-flush.
//
// Every table slot is asserted to be written exactly once, validating the perfect hash, and
// class/frequency counts are asserted against the known combinatorics of poker hands.
import fs from 'fs';
import path from 'path';
import { rankOfId, suitOfId } from '../src/core/cards';
import { hashQuinary, quinaryTableSize } from '../src/core/hash';
import { getCombinations } from '../src/utils/getCombinations';

const RANK_COUNT = 13;
const CARD_COUNT = 52;
const CLASS_COUNT = 7462;

// Hand categories used while deriving equivalence classes (higher = stronger).  Royal flushes
// are simply the best straight flush class; they are not a distinct category here.
enum Category {
  HighCard = 0,
  OnePair = 1,
  TwoPair = 2,
  ThreeOfAKind = 3,
  Straight = 4,
  Flush = 5,
  FullHouse = 6,
  FourOfAKind = 7,
  StraightFlush = 8,
}

const EXPECTED_CLASS_COUNTS: Record<Category, number> = {
  [Category.StraightFlush]: 10,
  [Category.FourOfAKind]: 156,
  [Category.FullHouse]: 156,
  [Category.Flush]: 1277,
  [Category.Straight]: 10,
  [Category.ThreeOfAKind]: 858,
  [Category.TwoPair]: 858,
  [Category.OnePair]: 2860,
  [Category.HighCard]: 1277,
};

const EXPECTED_HAND_COUNTS: Record<Category, number> = {
  [Category.StraightFlush]: 40,
  [Category.FourOfAKind]: 624,
  [Category.FullHouse]: 3744,
  [Category.Flush]: 5108,
  [Category.Straight]: 10200,
  [Category.ThreeOfAKind]: 54912,
  [Category.TwoPair]: 123552,
  [Category.OnePair]: 1098240,
  [Category.HighCard]: 1302540,
};

// The worst (largest) rank expected within each category; doubles as the category boundary
// relied upon by `handStrengthFromRank` in `src/core/rank.ts`.
const EXPECTED_WORST_RANKS: Record<Category, number> = {
  [Category.StraightFlush]: 10,
  [Category.FourOfAKind]: 166,
  [Category.FullHouse]: 322,
  [Category.Flush]: 1599,
  [Category.Straight]: 1609,
  [Category.ThreeOfAKind]: 2467,
  [Category.TwoPair]: 3325,
  [Category.OnePair]: 6185,
  [Category.HighCard]: CLASS_COUNT,
};

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`generateTables: ${message}`);
  }
};

// Encodes a hand category plus up to five base-13 tie-break digits (most significant first)
// into a single comparable integer, where greater = stronger.
const encodeClass = (category: Category, digits: number[]): number => {
  let value = category;
  for (let i = 0; i < 5; i += 1) {
    value = value * 13 + (digits[i] ?? 0);
  }
  return value;
};

const categoryOfClass = (value: number): Category => Math.floor(value / 13 ** 5);

// Returns the high-card rank index of the straight formed by 5 distinct ranks, or -1 if the
// ranks do not form a straight.  The wheel (A-2-3-4-5) reports its high card as the 5.
const getStraightHigh = (ranksDesc: number[]): number => {
  const unique = Array.from(new Set(ranksDesc));
  if (unique.length !== 5) {
    return -1;
  }
  if (unique[0] - unique[4] === 4) {
    return unique[0];
  }
  if (unique[0] === 12 && unique[1] === 3) {
    return 3;
  }
  return -1;
};

// Reference evaluator: maps exactly 5 card ids to their hand equivalence class value.
const evaluate5 = (ids: number[]): number => {
  const ranks = ids.map(rankOfId).sort((a, b) => b - a);
  const isFlush = ids.every((id) => suitOfId(id) === suitOfId(ids[0]));

  const straightHigh = getStraightHigh(ranks);
  if (straightHigh >= 0) {
    return encodeClass(isFlush ? Category.StraightFlush : Category.Straight, [straightHigh]);
  }

  const counts = new Array<number>(RANK_COUNT).fill(0);
  ranks.forEach((rank) => {
    counts[rank] += 1;
  });

  // Group ranks by count, ordered by count descending then rank descending, producing the
  // tie-break digits for the hand (e.g. full house = [trips rank, pair rank]).
  const groups: Array<[count: number, rank: number]> = [];
  for (let rank = RANK_COUNT - 1; rank >= 0; rank -= 1) {
    if (counts[rank] > 0) {
      groups.push([counts[rank], rank]);
    }
  }
  groups.sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  const digits = groups.map((group) => group[1]);

  switch (groups[0][0]) {
    case 4:
      return encodeClass(Category.FourOfAKind, digits);
    case 3:
      return encodeClass(groups[1][0] === 2 ? Category.FullHouse : Category.ThreeOfAKind, digits);
    case 2:
      return encodeClass(groups[1][0] === 2 ? Category.TwoPair : Category.OnePair, digits);
    default:
      return encodeClass(isFlush ? Category.Flush : Category.HighCard, digits);
  }
};

// Enumerate all C(52,5) hands to derive the 7,462 equivalence classes and their frequencies.
const buildClassRanks = (): Map<number, number> => {
  const classFrequencies = new Map<number, number>();
  const ids = [0, 0, 0, 0, 0];
  for (let a = 0; a < CARD_COUNT - 4; a += 1) {
    ids[0] = a;
    for (let b = a + 1; b < CARD_COUNT - 3; b += 1) {
      ids[1] = b;
      for (let c = b + 1; c < CARD_COUNT - 2; c += 1) {
        ids[2] = c;
        for (let d = c + 1; d < CARD_COUNT - 1; d += 1) {
          ids[3] = d;
          for (let e = d + 1; e < CARD_COUNT; e += 1) {
            ids[4] = e;
            const value = evaluate5(ids);
            classFrequencies.set(value, (classFrequencies.get(value) ?? 0) + 1);
          }
        }
      }
    }
  }

  assert(
    classFrequencies.size === CLASS_COUNT,
    `expected ${CLASS_COUNT} classes, found ${classFrequencies.size}`,
  );

  const classCounts = new Map<Category, number>();
  const handCounts = new Map<Category, number>();
  classFrequencies.forEach((frequency, value) => {
    const category = categoryOfClass(value);
    classCounts.set(category, (classCounts.get(category) ?? 0) + 1);
    handCounts.set(category, (handCounts.get(category) ?? 0) + frequency);
  });
  Object.entries(EXPECTED_CLASS_COUNTS).forEach(([category, expected]) => {
    const actual = classCounts.get(Number(category)) ?? 0;
    assert(
      actual === expected,
      `category ${category}: expected ${expected} classes, got ${actual}`,
    );
  });
  Object.entries(EXPECTED_HAND_COUNTS).forEach(([category, expected]) => {
    const actual = handCounts.get(Number(category)) ?? 0;
    assert(actual === expected, `category ${category}: expected ${expected} hands, got ${actual}`);
  });

  // Rank classes strongest (1) to weakest (7462).
  const sortedValues = Array.from(classFrequencies.keys()).sort((a, b) => b - a);
  const ranksByClass = new Map<number, number>();
  sortedValues.forEach((value, index) => {
    ranksByClass.set(value, index + 1);
  });

  Object.entries(EXPECTED_WORST_RANKS).forEach(([category, expectedWorst]) => {
    let worst = 0;
    ranksByClass.forEach((rank, value) => {
      if (categoryOfClass(value) === Number(category)) {
        worst = Math.max(worst, rank);
      }
    });
    assert(
      worst === expectedWorst,
      `category ${category}: expected worst rank ${expectedWorst}, got ${worst}`,
    );
  });

  return ranksByClass;
};

const ranksByClass = buildClassRanks();

const rank5 = (ids: number[]): number => {
  const rank = ranksByClass.get(evaluate5(ids));
  assert(rank !== undefined, `no class rank for hand [${ids.join(', ')}]`);
  return rank as number;
};

// Best (minimum) rank achievable using any 5 of the provided cards.
const bestRank = (ids: number[]): number => {
  let best = Number.MAX_SAFE_INTEGER;
  getCombinations(ids, 5).forEach((combo) => {
    best = Math.min(best, rank5(combo));
  });
  return best;
};

const buildFlushTable = (): Int16Array => {
  const table = new Int16Array(1 << RANK_COUNT);
  for (let mask = 0; mask < 1 << RANK_COUNT; mask += 1) {
    const ranks: number[] = [];
    for (let rank = 0; rank < RANK_COUNT; rank += 1) {
      if ((mask & (1 << rank)) !== 0) {
        ranks.push(rank);
      }
    }
    if (ranks.length < 5 || ranks.length > 7) {
      continue;
    }
    // Evaluate the suited cards directly; all 5-card subsets are flushes (or straight flushes).
    table[mask] = bestRank(ranks.map((rank) => rank * 4));
  }

  // Spot-check: a royal flush (A-K-Q-J-T suited) must be the best possible hand.
  const royalMask = 0b1111100000000;
  assert(table[royalMask] === 1, `royal flush mask should rank 1, got ${table[royalMask]}`);
  return table;
};

const buildNoFlushTable = (handSize: number): Int16Array => {
  const size = quinaryTableSize(handSize);
  const table = new Int16Array(size);
  const written = new Uint8Array(size);
  const counts = new Uint8Array(RANK_COUNT);
  let writtenCount = 0;

  const visit = (rank: number, remaining: number): void => {
    if (rank === RANK_COUNT) {
      if (remaining !== 0) {
        return;
      }
      // Build a representative multiset of cards with suits assigned cyclically.  At most
      // ceil(7/4) = 2 cards then share any suit, so no 5-card subset can form a flush, and
      // the resulting best-5 rank depends only on the rank counts.
      const ids: number[] = [];
      let suit = 0;
      for (let r = 0; r < RANK_COUNT; r += 1) {
        for (let copy = 0; copy < counts[r]; copy += 1) {
          ids.push(r * 4 + (suit & 3));
          suit += 1;
        }
      }
      const index = hashQuinary(counts, handSize);
      assert(written[index] === 0, `hash collision at index ${index} (hand size ${handSize})`);
      written[index] = 1;
      writtenCount += 1;
      table[index] = bestRank(ids);
      return;
    }
    const maxDigit = Math.min(4, remaining);
    for (let digit = 0; digit <= maxDigit; digit += 1) {
      counts[rank] = digit;
      visit(rank + 1, remaining - digit);
    }
    counts[rank] = 0;
  };

  visit(0, handSize);
  assert(
    writtenCount === size,
    `expected ${size} slots written for hand size ${handSize}, got ${writtenCount}`,
  );
  return table;
};

const toBase64 = (table: Int16Array): string => {
  const bytes = Buffer.alloc(table.length * 2);
  for (let i = 0; i < table.length; i += 1) {
    bytes.writeInt16LE(table[i], i * 2);
  }
  return bytes.toString('base64');
};

const flushTable = buildFlushTable();
const noFlush5 = buildNoFlushTable(5);
const noFlush6 = buildNoFlushTable(6);
const noFlush7 = buildNoFlushTable(7);

console.log(`FLUSH: ${flushTable.length} entries`);
console.log(`NOFLUSH5: ${noFlush5.length} entries`);
console.log(`NOFLUSH6: ${noFlush6.length} entries`);
console.log(`NOFLUSH7: ${noFlush7.length} entries`);

const output = [
  '// AUTO-GENERATED FILE - DO NOT EDIT.',
  '// Generated by scripts/generateTables.ts (`yarn generate:tables`).',
  '//',
  '// Hand-rank lookup tables encoded as base64 little-endian 16-bit integers.  See',
  '// src/core/rank.ts for how they are indexed.',
  `export const FLUSH_B64 = '${toBase64(flushTable)}';`,
  '',
  `export const NOFLUSH5_B64 = '${toBase64(noFlush5)}';`,
  '',
  `export const NOFLUSH6_B64 = '${toBase64(noFlush6)}';`,
  '',
  `export const NOFLUSH7_B64 = '${toBase64(noFlush7)}';`,
  '',
].join('\n');

const outputPath = path.resolve(__dirname, '..', 'src', 'core', 'tables', 'tables.generated.ts');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);
console.log(`Wrote ${outputPath}`);
