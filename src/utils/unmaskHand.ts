import { Card, Hand, HandStrength, getRank, getSuit } from '@poker-apprentice/types';
import { assertNever } from 'assert-never';
import {
  CARD_1_BIT_SHIFT,
  CARD_2_BIT_SHIFT,
  CARD_3_BIT_SHIFT,
  CARD_4_BIT_SHIFT,
  CARD_5_BIT_SHIFT,
  CARD_MASK,
} from '../constants/bitmasks';
import { rankOrder } from '../constants/rankOrder';
import { findKey } from './findKey';
import { getRankMask } from './getHandMask';
import { getMaskedCardRank } from './getMaskedCardRank';
import { getSuitedRankMasks } from './getSuitedRankMasks';

const combineCardMasks = (acc: bigint, cardMask: bigint) =>
  acc | getRankMask(getMaskedCardRank(cardMask));

const take = <T>(array: T[], index: number): T => {
  const [item] = array.splice(index, 1);
  return item;
};

const constructHand = (
  cards: Card[],
  cardMasks: bigint[],
  maskIndices: [number, number, number, number, number],
): Hand =>
  maskIndices.reduce((result: Hand, maskIndex) => {
    if (maskIndex >= 0) {
      const cardMask = cardMasks[maskIndex];
      const maskedCardRank = getMaskedCardRank(cardMask);
      const cardIndex = cards.findIndex((card) => getRank(card) === maskedCardRank);
      const card = take(cards, cardIndex);
      if (card !== undefined) {
        result.push(card);
      }
    } else {
      const referencedCard = result[result.length - 1];
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

export const unmaskHand = (
  cards: Card[],
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

  const combinedCardMasks = cardMasks.reduce(combineCardMasks, 0n);
  const flushSuit = findKey(
    suits,
    (suitedCardsMask) => (combinedCardMasks & suitedCardsMask) === combinedCardMasks,
  );
  cards = flushSuit ? cards.filter((card) => getSuit(card) === flushSuit) : cards;

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
