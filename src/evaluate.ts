import { Card, Rank, Suit, getRank, getSuit } from '@poker-apprentice/types';
import { compare } from './compare';
import { rankOrder } from './constants';
import { EvaluatedHand, Strength } from './types';
import { cardComparator } from './utils/cardComparator';
import { getCombinations } from './utils/getCombinations';
import { handComparator } from './utils/handComparator';

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

const getStraights = (cards: Card[]): Card[][] => {
  const straights: Card[][] = [];

  // allow ace to be treated as high or low
  const lastAceIndex = cards.findLastIndex((card) => getRank(card) === 'A');
  const adjustedCards =
    lastAceIndex === -1 ? cards : [...cards, ...cards.slice(0, lastAceIndex + 1)];

  for (let i = 0; i < adjustedCards.length - HAND_SIZE + 1; i += 1) {
    const currentHands: Card[][] = [[adjustedCards[i]]];
    for (let j = i + 1; j < adjustedCards.length; j += 1) {
      const card = adjustedCards[j];
      const rank = getRank(card);
      const lastRank = getRank(currentHands[0][currentHands[0].length - 1]);

      if (currentHands[0].length < HAND_SIZE) {
        if (rank === lastRank) {
          // If the current card is the same rank as the last card added, then append it
          // to the list of possible hands.
          const newHand = currentHands[0].slice(0, -1);
          newHand.push(card);
          currentHands.push(newHand);
        } else if (rankOrder.indexOf(rank) === rankOrder.indexOf(lastRank) - 1) {
          // If the current card is one rank lower than the last card, then append it
          // to all possible hands.
          currentHands.forEach((currentHand) => currentHand.push(card));
        } else if (
          rankOrder.indexOf(rank) === rankOrder.length - 1 &&
          rankOrder.indexOf(lastRank) === 0
        ) {
          // If the current card is an ace, and the last card was a deuce, then append it
          // to all possible hands.
          currentHands.forEach((currentHand) => currentHand.push(card));
        }
      }
    }
    straights.push(...currentHands.filter((hand) => hand.length === HAND_SIZE));
  }

  // order straights from biggest to smallest
  return straights.sort(handComparator);
};

const getDuplicates = (cards: Card[]): Map<Rank, Card[]> => {
  const duplicates: Map<Rank, Card[]> = new Map();
  cards.forEach((card) => {
    const rank = getRank(card);
    const current = duplicates.get(rank) ?? [];
    current.push(card);
    duplicates.set(rank, current);
  });
  return duplicates;
};

const getOfAKinds = (cardGroups: Map<Rank, Card[]>, count: number): Card[][] => {
  return [...cardGroups.values()]
    .filter((cards) => cards.length === count)
    .sort((a, b) => cardComparator(a[0], b[0]));
};

const getFlushes = (cards: Card[]): Card[][] => {
  const suitedCards: Map<Suit, Card[]> = new Map();
  cards.forEach((card) => {
    const suit = getSuit(card);
    const current = suitedCards.get(suit) ?? [];
    current.push(card);
    suitedCards.set(suit, current);
  });

  // only use the first 5 cards of the same suit to make up a hand
  suitedCards.forEach((current) => {
    current.splice(HAND_SIZE);
  });

  // only return flushes made up of a legitimate hand size
  return [...suitedCards.values()].filter((hand) => hand.length === HAND_SIZE).sort(handComparator);
};

const getKickers = (hand: Card[], allCards: Card[]) => {
  const kickerCount = HAND_SIZE - hand.length;
  return allCards.filter((card) => !hand.includes(card)).slice(0, kickerCount);
};

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

const evaluateHand = (unsortedCards: Card[]): EvaluatedHand => {
  const cards = unsortedCards.sort(cardComparator);
  const straights = getStraights(cards);

  // straight flush/royal flush
  const straightFlushes = straights.filter((straight) => uniq(straight.map(getSuit)).length === 1);
  if (straightFlushes.length > 0) {
    const strength =
      getRank(straightFlushes[0][0]) === 'A' ? Strength.ROYAL_FLUSH : Strength.STRAIGHT_FLUSH;
    return { strength, hand: straightFlushes[0] };
  }

  const duplicates = getDuplicates(cards);

  // four of a kind
  const allQuads = getOfAKinds(duplicates, 4);
  if (allQuads.length > 0) {
    const quads = allQuads[0];
    const kickers = getKickers(quads, cards);
    return { strength: Strength.FOUR_OF_A_KIND, hand: [...quads, ...kickers] };
  }

  // full house
  const allTrips = getOfAKinds(duplicates, 3);
  const allPairs = getOfAKinds(duplicates, 2);
  if (allTrips.length > 0 && allPairs.length > 0) {
    return { strength: Strength.FULL_HOUSE, hand: [...allTrips[0], ...allPairs[0]] };
  }

  // flush
  const flushes = getFlushes(cards);
  if (flushes.length > 0) {
    return { strength: Strength.FLUSH, hand: flushes[0] };
  }

  // straight
  if (straights.length > 0) {
    return { strength: Strength.STRAIGHT, hand: straights[0] };
  }

  // three of a kind
  if (allTrips.length > 0) {
    const trips = allTrips[0];
    const kickers = getKickers(trips, cards);
    return { strength: Strength.THREE_OF_A_KIND, hand: [...trips, ...kickers] };
  }

  // two pair
  if (allPairs.length >= 2) {
    const twoPair = [...allPairs[0], ...allPairs[1]];
    const kickers = getKickers(twoPair, cards);
    return { strength: Strength.TWO_PAIR, hand: [...twoPair, ...kickers] };
  }

  // one pair
  if (allPairs.length > 0) {
    const pair = allPairs[0];
    const kickers = getKickers(pair, cards);
    return { strength: Strength.ONE_PAIR, hand: [...pair, ...kickers] };
  }

  // high card
  return { strength: Strength.HIGH_CARD, hand: getKickers([], cards) };
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

  return allHandCombinations.map(evaluateHand).sort(compare)[0];
};
