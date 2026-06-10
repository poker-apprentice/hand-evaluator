import { Card, Hand } from '@poker-apprentice/types';
import { Odds } from '../types';
import { CARD_ID_COUNT, cardToId } from './cards';
import { GamePlan, bestRankForPlan, compilePlan } from './plan';
import { WORST_RANK } from './rank';

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
  /** Number of `rankN` lookups required per scenario. */
  evaluationsPerScenario: number;
  /** Exhaustively enumerates every scenario, tallying each into the accumulators. */
  enumerate: () => void;
  /** Deals one uniformly random scenario, tallying it into the accumulators. */
  sample: (random: () => number) => void;
  /** Returns the accumulated odds for each hand. */
  snapshot: () => Odds[];
}

// C(n, k), computed so every intermediate value is an exact integer.
const choose = (n: number, k: number): number => {
  let result = 1;
  for (let i = 1; i <= k; i += 1) {
    result = (result * (n - k + i)) / i;
  }
  return result;
};

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
  const seen = new Uint8Array(CARD_ID_COUNT);
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
  const deck = new Uint8Array(CARD_ID_COUNT);
  for (let id = 0; id < CARD_ID_COUNT; id += 1) {
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

  const tally = (): void => {
    samples += 1;
    let best = WORST_RANK + 1;
    let bestIndex = -1;
    let bestCount = 0;
    for (let p = 0; p < players; p += 1) {
      const rank = bestRankForPlan(plan, holeBuffers[p], boardBuffer);
      bestRanks[p] = rank;
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
    } else {
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
    evaluationsPerScenario: players * plan.unitsPerHand,
    enumerate: () => enumerateGroup(0),
    sample,
    snapshot,
  };
};
