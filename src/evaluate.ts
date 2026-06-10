import { Card } from '@poker-apprentice/types';
import { compare } from './compare';
import { handToIds } from './core/cards';
import { GamePlan, compilePlan } from './core/plan';
import { WORST_RANK, rankN } from './core/rank';
import { EvaluatedHand } from './types';
import { describeHand } from './utils/describeHand';
import { getCombinations } from './utils/getCombinations';

export interface EvaluateOptions {
  holeCards: Card[];
  communityCards?: Card[];
  minimumHoleCards?: number;
  maximumHoleCards?: number;
}

const HAND_SIZE = 5;

const uniq = <T>(items: T[]) => Array.from(new Set(items));

const max = <T>(items: T[]) =>
  items.reduce((accum, current) => (current > accum ? current : accum));

// Enumerates every candidate card combination permitted by the hole-card usage constraints,
// exactly as v3 did.  Only used when the lookup-table core cannot apply: fewer than 5 total
// cards, or constraints under which only partial (sub-5-card) hands can be formed.
const getAllHandCombinations = ({
  holeCards,
  communityCards,
  minimumHoleCards,
  maximumHoleCards,
}: Required<EvaluateOptions>): Card[][] => {
  // when minimum <= 0 AND maximum >= holeCards.length, we can just combine
  // holeCards & communityCards
  if (minimumHoleCards <= 0 && maximumHoleCards >= holeCards.length) {
    return [[...holeCards, ...communityCards]];
  }

  // when minimum <= 0, we can get all combinations of holeCards of length (maximum), then
  // combine each of those combinations w/ communityCards
  if (minimumHoleCards <= 0) {
    return getCombinations(holeCards, maximumHoleCards).map((cards) => [
      ...cards,
      ...communityCards,
    ]);
  }

  // otherwise, we need to find all combinations possible by combining exact combinations of
  // N holeCards + M communityCards, where N=minimum and M=HAND_SIZE-minimum.
  const sameMinMax = minimumHoleCards === maximumHoleCards;
  const allHoleCardCombinations = new Array(sameMinMax ? 1 : maximumHoleCards - minimumHoleCards)
    .fill(undefined)
    .flatMap((i, index) =>
      getCombinations(holeCards, index + minimumHoleCards + (sameMinMax ? 0 : 1)),
    );

  const remainingCardCounts = uniq(
    allHoleCardCombinations.map((currentHoleCards) => {
      const count = HAND_SIZE - currentHoleCards.length;
      return count > communityCards.length ? communityCards.length : count;
    }),
  );

  const remainingCardsMap = Object.fromEntries(
    remainingCardCounts.map((count) => {
      return [count, getCombinations(communityCards, count)];
    }),
  );

  const allHandCombinations = allHoleCardCombinations.flatMap((currentHoleCards) => {
    const remainingCardCount = HAND_SIZE - currentHoleCards.length;
    const allCommunityCards = remainingCardsMap[remainingCardCount] ?? [];
    if (allCommunityCards.length === 0) {
      return [currentHoleCards];
    }
    return allCommunityCards.map((currentCommunityCards) => [
      ...currentHoleCards,
      ...currentCommunityCards,
    ]);
  });

  // only include combinations that are the longest, as shorter combinations will
  // never possibly be better due to not having kickers to improve their hand strenth
  const longestCombination = max(allHandCombinations.map((cards) => cards.length));

  return allHandCombinations.filter((cards) => cards.length === longestCombination);
};

/**
 * Determines the best 5-card hand makeable from the provided hole and community cards, given
 * the hole-card usage constraints of the game being played.
 * @param {EvaluateOptions} options The cards available and usage constraints.
 * @returns {EvaluatedHand} The strength and cards of the best hand.
 */
export const evaluate = ({
  holeCards,
  communityCards = [],
  ...options
}: EvaluateOptions): EvaluatedHand => {
  const minimumHoleCards = Math.max(0, options.minimumHoleCards ?? 0);
  const maximumHoleCards = Math.min(
    holeCards.length,
    options.maximumHoleCards ?? holeCards.length,
    HAND_SIZE,
  );

  if (holeCards.length === 0 && communityCards.length === 0) {
    throw new Error('Must supply at least one holeCard or communityCard');
  }
  if (minimumHoleCards > holeCards.length) {
    throw new Error('minimumHoleCards cannot be greater than number of supplied hole cards');
  }
  if (minimumHoleCards > maximumHoleCards) {
    throw new Error('minimumHoleCards cannot be greater than maximumHoleCards');
  }
  if (maximumHoleCards <= 0) {
    throw new Error('maximumHoleCards cannot be less then or equal to zero');
  }

  let plan: GamePlan;
  try {
    plan = compilePlan(holeCards.length, communityCards.length, minimumHoleCards, maximumHoleCards);
  } catch {
    // Fewer than 5 cards total (or constraints that only permit partial hands): describe every
    // candidate combination and keep the best.
    return getAllHandCombinations({
      holeCards,
      communityCards,
      minimumHoleCards,
      maximumHoleCards,
    })
      .map(describeHand)
      .sort(compare)[0];
  }

  const holeIds = handToIds(holeCards);
  const boardIds = handToIds(communityCards);

  // Find the best candidate card set permitted by the plan.  Candidates are visited in the
  // same order v3 enumerated them, so rank ties resolve to the same cards v3 returned.
  let bestRank = WORST_RANK + 1;
  let bestCards: Card[] = [];

  if (plan.mode === 'single') {
    bestCards = [...holeCards, ...communityCards];
  } else if (plan.mode === 'holeSubsets') {
    plan.holeSubsets.forEach((subset) => {
      const ids = subset.map((index) => holeIds[index]).concat(boardIds);
      const rank = rankN(ids, ids.length);
      if (rank < bestRank) {
        bestRank = rank;
        bestCards = subset.map((index) => holeCards[index]).concat(communityCards);
      }
    });
  } else {
    plan.pairedSubsets.forEach(({ holeIndexes, boardIndexes }) => {
      const ids = holeIndexes
        .map((index) => holeIds[index])
        .concat(boardIndexes.map((index) => boardIds[index]));
      const rank = rankN(ids, HAND_SIZE);
      if (rank < bestRank) {
        bestRank = rank;
        bestCards = holeIndexes
          .map((index) => holeCards[index])
          .concat(boardIndexes.map((index) => communityCards[index]));
      }
    });
  }

  return describeHand(bestCards);
};
