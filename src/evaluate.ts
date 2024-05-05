import { Card, Hand, HandStrength, getRank, getSuit } from '@poker-apprentice/types';
import { assertNever } from 'assert-never';
import findKey from 'lodash/findKey';
import { compare } from './compare';
import {
  CARD_1_BIT_SHIFT,
  CARD_2_BIT_SHIFT,
  CARD_3_BIT_SHIFT,
  CARD_4_BIT_SHIFT,
  CARD_5_BIT_SHIFT,
  CARD_MASK,
  HAND_MASK_BIT_SHIFT,
} from './constants/bitmasks';
import { CARD_RANK_TABLE } from './constants/cardRankTable';
import { rankOrder } from './constants/rankOrder';
import { EvaluatedHand } from './types';
import { bigintKey } from './utils/bigintKey';
import { getCombinations } from './utils/getCombinations';
import { getHandMask } from './utils/getHandMask';
import { getHandValueMask } from './utils/getHandValueMask';
import { getMaskedCardRank } from './utils/getMaskedCardRank';
import { getSuitedRankMasks } from './utils/getSuitedRankMasks';

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

const take = <T>(array: T[], index: number): T => {
  const [item] = array.splice(index, 1);
  return item;
};

const constructHand = (
  cards: Card[],
  cardMasks: bigint[],
  maskIndices: [number, number, number, number, number],
): Hand =>
  maskIndices.reduce((result: Hand, maskIndex, i) => {
    if (maskIndex >= 0) {
      const cardMask = cardMasks[maskIndex];
      const maskedCardRank = getMaskedCardRank(cardMask);
      const cardIndex = cards.findIndex((card) => getRank(card) === maskedCardRank);
      const card = take(cards, cardIndex);
      if (card !== undefined) {
        result.push(card);
      }
    } else {
      const referencedCard = result[i - 1];
      const referencedRank = rankOrder.indexOf(getRank(referencedCard));
      const cardIndex = cards.findIndex(
        (card) => getRank(card) === rankOrder.at((referencedRank + maskIndex + 13) % 13),
      );
      const card = take(cards, cardIndex);
      if (card !== undefined) {
        result.push(card);
      }
    }
    return result;
  }, []);

const getHand = (
  originalCards: Card[],
  handMask: bigint,
  handValueMask: bigint,
  strength: HandStrength,
): Hand => {
  const cardMasks = [
    (handValueMask >> CARD_1_BIT_SHIFT) & CARD_MASK,
    (handValueMask >> CARD_2_BIT_SHIFT) & CARD_MASK,
    (handValueMask >> CARD_3_BIT_SHIFT) & CARD_MASK,
    (handValueMask >> CARD_4_BIT_SHIFT) & CARD_MASK,
    (handValueMask >> CARD_5_BIT_SHIFT) & CARD_MASK,
  ];

  const suits = getSuitedRankMasks(handMask);
  const flushSuit = findKey(suits, (v) => CARD_RANK_TABLE[bigintKey(v)] >= 5);
  const cards = flushSuit
    ? originalCards.filter((card) => getSuit(card) === flushSuit)
    : originalCards;

  switch (strength) {
    case HandStrength.HighCard:
      return constructHand(cards, cardMasks, [0, 1, 2, 3, 4]);
    case HandStrength.OnePair:
      return constructHand(cards, cardMasks, [0, 0, 1, 2, 3]);
    case HandStrength.TwoPair:
      return constructHand(cards, cardMasks, [0, 0, 1, 1, 2]);
    case HandStrength.ThreeOfAKind:
      return constructHand(cards, cardMasks, [0, 0, 0, 1, 2]);
    case HandStrength.Straight:
      return constructHand(cards, cardMasks, [0, -1, -1, -1, -1]);
    case HandStrength.Flush:
      return constructHand(cards, cardMasks, [0, 1, 2, 3, 4]);
    case HandStrength.FullHouse:
      return constructHand(cards, cardMasks, [0, 0, 0, 1, 1]);
    case HandStrength.FourOfAKind:
      return constructHand(cards, cardMasks, [0, 0, 0, 0, 1]);
    case HandStrength.StraightFlush:
      return constructHand(cards, cardMasks, [0, -1, -1, -1, -1]);
    case HandStrength.RoyalFlush:
      return constructHand(cards, cardMasks, [0, -1, -1, -1, -1]);
    default:
      return assertNever(strength);
  }
};

const getStrength = (handMask: bigint): HandStrength => {
  const strength = Number(handMask >> HAND_MASK_BIT_SHIFT);
  const highCardRank = getMaskedCardRank((handMask >> CARD_1_BIT_SHIFT) & CARD_MASK);

  if (strength === HandStrength.StraightFlush && highCardRank === 'A') {
    return HandStrength.RoyalFlush;
  }
  return strength;
};

const evaluateHand = (cards: Card[]): EvaluatedHand => {
  const handMask = getHandMask(cards);
  const value = getHandValueMask(handMask);
  const strength = getStrength(value);
  const hand = getHand(cards, handMask, value, strength);

  return { strength, hand, value };
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
