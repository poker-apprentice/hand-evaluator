import { Card, Hand } from '@poker-apprentice/types';
import { Odds } from '../types';
import { cardToId } from './cards';
import { CARD_COUNT } from './constants';
import { GamePlan, bestRankForPlan, compilePlan } from './plan';
import { WORST_RANK, rankN } from './rank';

export interface EngineOptions {
  communityCards: Card[];
  expectedCommunityCardCount: number;
  expectedHoleCardCount: number;
  minimumHoleCardsUsed: number;
  maximumHoleCardsUsed: number;
}

// A slot for one not-yet-dealt card: which buffer it belongs to and where.
interface WriteTarget {
  buffer: Uint8Array;
  offset: number;
}

// One "group" of unknown cards (a single player's missing hole cards, or the missing community
// cards).  Card order within a group is irrelevant, so scenarios are enumerated as one
// combination of remaining deck cards per group rather than as permutations.
interface Group {
  targets: WriteTarget[];
}

export interface Engine {
  /** Number of hands being compared. */
  players: number;
  /** Number of distinct scenarios (combinations of unknown cards across all groups). */
  scenarioCount: number;
  /** Estimated total number of table lookups required to evaluate every scenario. */
  estimatedEvaluations: number;
  /** Exhaustively enumerates every scenario, tallying each into the accumulators. */
  enumerate: () => void;
  /** Deals one uniformly random scenario, tallying it into the accumulators. */
  sample: (random: () => number) => void;
  /** Returns the accumulated odds for each hand. */
  snapshot: () => Odds[];
}

// Largest board-subset size for which board-subset memoization is considered; C(52,3) = 22,100
// entries per player keeps the tables small and their precomputation nearly free.
const MEMO_MAX_SUBSET_SIZE = 3;

// C(n, k), computed so every intermediate value is an exact integer.
const choose = (n: number, k: number): number => {
  let result = 1;
  for (let i = 1; i <= k; i += 1) {
    result = (result * (n - k + i)) / i;
  }
  return result;
};

// binomials[k][n] = C(n, k) for the small k needed to rank card subsets in colex order.
const binomials: number[][] = [];
for (let k = 0; k <= MEMO_MAX_SUBSET_SIZE; k += 1) {
  binomials.push(Array.from({ length: CARD_COUNT + 1 }, (_, n) => choose(n, k)));
}

/**
 * Builds the shared engine behind `odds` and `simulate`: converts hands to integer card ids,
 * validates them, compiles the game plan, and prepares zero-allocation scenario enumeration
 * and sampling over the unknown (not-yet-dealt) cards.
 * @param {Hand[]} allHoleCards Each player's known hole cards.
 * @param {EngineOptions} options Game rules: expected card counts and hole-card usage limits.
 * @returns {Engine} The prepared engine.
 */
export const createEngine = (allHoleCards: Hand[], options: EngineOptions): Engine => {
  const {
    communityCards,
    expectedCommunityCardCount,
    expectedHoleCardCount,
    minimumHoleCardsUsed,
    maximumHoleCardsUsed,
  } = options;

  const players = allHoleCards.length;
  const plan: GamePlan = compilePlan(
    expectedHoleCardCount,
    expectedCommunityCardCount,
    minimumHoleCardsUsed,
    maximumHoleCardsUsed,
  );

  if (communityCards.length > expectedCommunityCardCount) {
    throw new Error(`communityCards accepts a maximum of ${expectedCommunityCardCount} elements`);
  }

  // Convert all known cards to ids, rejecting duplicates.
  const seen = new Uint8Array(CARD_COUNT);
  const claim = (card: Card): number => {
    const id = cardToId(card);
    if (seen[id] !== 0) {
      throw new Error(`Duplicate card: ${card}`);
    }
    seen[id] = 1;
    return id;
  };

  const holeBuffers: Uint8Array[] = [];
  const groups: Group[] = [];
  let playerGroupCount = 0;
  allHoleCards.forEach((holeCards) => {
    if (holeCards.length > expectedHoleCardCount) {
      throw new Error(
        `Each collection of hole cards accepts a maximum of ${expectedHoleCardCount} elements`,
      );
    }
    const buffer = new Uint8Array(expectedHoleCardCount);
    holeCards.forEach((card, index) => {
      buffer[index] = claim(card);
    });
    if (holeCards.length < expectedHoleCardCount) {
      const targets: WriteTarget[] = [];
      for (let offset = holeCards.length; offset < expectedHoleCardCount; offset += 1) {
        targets.push({ buffer, offset });
      }
      groups.push({ targets });
      playerGroupCount += 1;
    }
    holeBuffers.push(buffer);
  });

  const boardBuffer = new Uint8Array(expectedCommunityCardCount);
  communityCards.forEach((card, index) => {
    boardBuffer[index] = claim(card);
  });
  if (communityCards.length < expectedCommunityCardCount) {
    const targets: WriteTarget[] = [];
    for (let offset = communityCards.length; offset < expectedCommunityCardCount; offset += 1) {
      targets.push({ buffer: boardBuffer, offset });
    }
    groups.push({ targets });
  }

  // The unseen cards from which all unknown slots are filled.
  let deckSize = 0;
  const deck = new Uint8Array(CARD_COUNT);
  for (let id = 0; id < CARD_COUNT; id += 1) {
    if (seen[id] === 0) {
      deck[deckSize] = id;
      deckSize += 1;
    }
  }

  const unknownCount = groups.reduce((sum, group) => sum + group.targets.length, 0);
  if (unknownCount > deckSize) {
    throw new Error('Not enough cards remain in the deck to complete every hand');
  }

  let scenarioCount = 1;
  let remaining = deckSize;
  groups.forEach((group) => {
    scenarioCount *= choose(remaining, group.targets.length);
    remaining -= group.targets.length;
  });

  // Accumulators.  Ties are counted once per tied player; equity splits each tied scenario
  // evenly among the tied players, so the players' equities always sum to 1.
  const wins = new Float64Array(players);
  const ties = new Float64Array(players);
  const equity = new Float64Array(players);
  const bestRanks = new Uint16Array(players);
  let samples = 0;

  const computeBestRanksDirect = (): void => {
    for (let p = 0; p < players; p += 1) {
      bestRanks[p] = bestRankForPlan(plan, holeBuffers[p], boardBuffer);
    }
  };

  // Board-subset memoization for uniform 'pairedSubsets' games (e.g. omaha): when every
  // player's hole cards are fully known, each player's best rank for a scenario is
  // min-over-board-subsets of min-over-hole-subsets, and the inner minimum depends only on
  // which cards form the board subset.  Precomputing it for every possible board subset turns
  // each scenario into a handful of table lookups instead of `unitsPerHand` evaluations.
  let computeBestRanksMemo: (() => void) | null = null;
  let memoCost = 0;
  let memoLookupsPerScenario = 0;
  const pairing = plan.uniformPairing;
  if (plan.mode === 'pairedSubsets' && pairing !== undefined && playerGroupCount === 0) {
    const subsetSize = pairing.boardSubsets[0].length;
    const possibleBoardCardCount = communityCards.length + deckSize;
    const tableSize = choose(possibleBoardCardCount, subsetSize);
    memoCost = tableSize * pairing.holeSubsets.length * players;
    const directCost = scenarioCount * plan.unitsPerHand * players;

    if (subsetSize >= 1 && subsetSize <= MEMO_MAX_SUBSET_SIZE && memoCost < directCost) {
      // Index every card that can appear on the board (known community cards + unseen deck).
      const boardCardIndexById = new Int16Array(CARD_COUNT).fill(-1);
      const possibleBoardCards = new Uint8Array(possibleBoardCardCount);
      for (let i = 0; i < communityCards.length; i += 1) {
        possibleBoardCards[i] = boardBuffer[i];
      }
      for (let i = 0; i < deckSize; i += 1) {
        possibleBoardCards[communityCards.length + i] = deck[i];
      }
      for (let i = 0; i < possibleBoardCardCount; i += 1) {
        boardCardIndexById[possibleBoardCards[i]] = i;
      }

      // Each player's hole-card id selections, resolved once.
      const holeSelections: number[][][] = holeBuffers.map((buffer) =>
        pairing.holeSubsets.map((subset) => subset.map((index) => buffer[index])),
      );

      // Fill the tables: for every `subsetSize`-card combination of possible board cards (in
      // ascending index order, ranked by colex position), the best rank per player across all
      // of their hole-card selections.  Combinations containing a player's own hole cards are
      // computed but never looked up.
      const tables = holeBuffers.map(() => new Uint16Array(tableSize));
      const evalCards = new Uint8Array(5);
      const subsetIndexes = new Int16Array(subsetSize);
      const fill = (depth: number, start: number, colex: number): void => {
        if (depth === subsetSize) {
          for (let p = 0; p < players; p += 1) {
            const selections = holeSelections[p];
            let best = WORST_RANK + 1;
            for (let s = 0; s < selections.length; s += 1) {
              const selection = selections[s];
              let count = 0;
              for (let i = 0; i < selection.length; i += 1) {
                evalCards[count] = selection[i];
                count += 1;
              }
              for (let i = 0; i < subsetSize; i += 1) {
                evalCards[count] = possibleBoardCards[subsetIndexes[i]];
                count += 1;
              }
              const rank = rankN(evalCards, count);
              if (rank < best) {
                best = rank;
              }
            }
            tables[p][colex] = best;
          }
          return;
        }
        for (
          let index = start;
          index <= possibleBoardCardCount - (subsetSize - depth);
          index += 1
        ) {
          subsetIndexes[depth] = index;
          fill(depth + 1, index + 1, colex + binomials[depth + 1][index]);
        }
      };
      fill(0, 0, 0);

      // Per-scenario state: the board's card indexes (sorted ascending so every position
      // subset of them is itself ascending) and the colex rank of each board subset.
      const boardSubsets = pairing.boardSubsets;
      memoLookupsPerScenario = boardSubsets.length;
      const sortedIndexes = new Int16Array(plan.communityCount);
      computeBestRanksMemo = () => {
        for (let i = 0; i < plan.communityCount; i += 1) {
          const value = boardCardIndexById[boardBuffer[i]];
          let j = i;
          while (j > 0 && sortedIndexes[j - 1] > value) {
            sortedIndexes[j] = sortedIndexes[j - 1];
            j -= 1;
          }
          sortedIndexes[j] = value;
        }
        for (let p = 0; p < players; p += 1) {
          bestRanks[p] = WORST_RANK + 1;
        }
        for (let t = 0; t < boardSubsets.length; t += 1) {
          const subset = boardSubsets[t];
          let colex = 0;
          for (let i = 0; i < subsetSize; i += 1) {
            colex += binomials[i + 1][sortedIndexes[subset[i]]];
          }
          for (let p = 0; p < players; p += 1) {
            const rank = tables[p][colex];
            if (rank < bestRanks[p]) {
              bestRanks[p] = rank;
            }
          }
        }
      };
    }
  }

  const computeBestRanks = computeBestRanksMemo ?? computeBestRanksDirect;
  const estimatedEvaluations =
    computeBestRanksMemo !== null
      ? memoCost + scenarioCount * players * memoLookupsPerScenario
      : scenarioCount * players * plan.unitsPerHand;

  const tally = (): void => {
    samples += 1;
    computeBestRanks();
    let best = WORST_RANK + 1;
    let bestIndex = -1;
    let bestCount = 0;
    for (let p = 0; p < players; p += 1) {
      const rank = bestRanks[p];
      if (rank < best) {
        best = rank;
        bestIndex = p;
        bestCount = 1;
      } else if (rank === best) {
        bestCount += 1;
      }
    }
    if (bestCount === 1) {
      wins[bestIndex] += 1;
      equity[bestIndex] += 1;
    } else if (bestCount > 1) {
      const share = 1 / bestCount;
      for (let p = 0; p < players; p += 1) {
        if (bestRanks[p] === best) {
          ties[p] += 1;
          equity[p] += share;
        }
      }
    }
  };

  // Exhaustive enumeration: one ascending-position combination per group, composed across
  // groups via a shared "used" mask.  Groups are distinguishable (each owns fixed slots), so
  // this visits every scenario exactly once.
  const used = new Uint8Array(deckSize);
  const enumerateGroup = (groupIndex: number): void => {
    if (groupIndex === groups.length) {
      tally();
      return;
    }
    const { targets } = groups[groupIndex];
    const size = targets.length;
    const pick = (slot: number, startPosition: number): void => {
      if (slot === size) {
        enumerateGroup(groupIndex + 1);
        return;
      }
      const target = targets[slot];
      for (let position = startPosition; position <= deckSize - (size - slot); position += 1) {
        if (used[position] === 0) {
          used[position] = 1;
          target.buffer[target.offset] = deck[position];
          pick(slot + 1, position + 1);
          used[position] = 0;
        }
      }
    };
    pick(0, 0);
  };

  // Random sampling: a partial Fisher-Yates shuffle deals the unknown slots uniformly.  The
  // deck array is reused across samples; reordering it never affects correctness because only
  // membership matters.
  const allTargets = groups.reduce<WriteTarget[]>((all, group) => all.concat(group.targets), []);
  const sample = (random: () => number): void => {
    for (let i = 0; i < unknownCount; i += 1) {
      const j = i + Math.floor(random() * (deckSize - i));
      const swap = deck[i];
      deck[i] = deck[j];
      deck[j] = swap;
      const target = allTargets[i];
      target.buffer[target.offset] = deck[i];
    }
    tally();
  };

  const snapshot = (): Odds[] => {
    const results: Odds[] = [];
    for (let p = 0; p < players; p += 1) {
      results.push({
        wins: wins[p],
        ties: ties[p],
        total: samples,
        equity: samples === 0 ? 0 : equity[p] / samples,
      });
    }
    return results;
  };

  return {
    players,
    scenarioCount,
    estimatedEvaluations,
    enumerate: () => enumerateGroup(0),
    sample,
    snapshot,
  };
};
