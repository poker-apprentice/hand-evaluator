import { Card } from '@poker-apprentice/types';
import { EvaluatedHand } from './types';
import { getCombinations } from './utils/getCombinations';
import { getHandMask } from './utils/getHandMask';
import { getHandValueMask } from './utils/getHandValueMask';
import { unmaskHand } from './utils/unmaskHand';
import { unmaskHandStrength } from './utils/unmaskHandStrength';

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

interface EvaluatedCombination {
  cards: Card[];
  mask: bigint;
  value: bigint;
}

const evaluateCombination = (cards: Card[]): EvaluatedCombination => {
  const mask = getHandMask(cards);
  const value = getHandValueMask(mask);
  return { cards, mask, value };
};

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

  const allHandCombinations = getAllHandCombinations({
    holeCards,
    communityCards,
    minimumHoleCards,
    maximumHoleCards,
  });

  let best = evaluateCombination(allHandCombinations[0]);
  for (let i = 1; i < allHandCombinations.length; i += 1) {
    const current = evaluateCombination(allHandCombinations[i]);
    if (current.value > best.value) {
      best = current;
    }
  }

  const strength = unmaskHandStrength(best.value);
  const hand = unmaskHand(best.cards, best.mask, best.value, strength);

  return { strength, hand, value: best.value };
};
