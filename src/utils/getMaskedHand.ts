import {
  ALL_SUITS,
  Hand,
  HandStrength,
  Rank,
  Suit,
  getRank,
  isRank,
} from '@poker-apprentice/types';
import { assertNever } from 'assert-never';
import {
  CARD_1_BIT_SHIFT,
  CARD_2_BIT_SHIFT,
  CARD_3_BIT_SHIFT,
  CARD_4_BIT_SHIFT,
  CARD_5_BIT_SHIFT,
  CARD_MASK,
  RANK_BITS_MAP,
} from '../constants/bitmasks';
import { rankOrder } from '../constants/rankOrder';
import { findKey } from './findKey';
import { getRankMask } from './getHandMask';
import { getMaskedCardRank } from './getMaskedCardRank';
import { getSuitedRankMasks } from './getSuitedRankMasks';

const constructHand = (
  handMask: bigint,
  cardMasks: bigint[],
  maskIndices: [number, number, number, number, number],
  isSuited = false,
): Hand => {
  const suits = getSuitedRankMasks(handMask);

  const getReferencedRank = (hand: Hand, offset: number) => {
    const referencedCard = hand[hand.length - 1];
    const referencedRank = rankOrder.indexOf(getRank(referencedCard));
    return rankOrder.at((referencedRank + offset + 13) % 13) as Rank;
  };

  if (isSuited) {
    const combinedCardMasks = cardMasks.reduce(
      (acc, current) => acc | getRankMask(getMaskedCardRank(current)),
      0n,
    );
    for (const suit of ALL_SUITS) {
      const suitedCardsMask = suits[suit];
      if ((suitedCardsMask & combinedCardMasks) === combinedCardMasks) {
        return maskIndices.reduce((hand: Hand, maskIndex) => {
          const rank =
            maskIndex >= 0
              ? getMaskedCardRank(cardMasks[maskIndex])
              : getReferencedRank(hand, maskIndex);
          hand.push(`${rank}${suit}`);
          return hand;
        }, []);
      }
    }
  }

  const getMatchingSuit = (
    hand: Hand,
    maskIndex: number,
  ): [bigint, Suit] | [undefined, undefined] => {
    if (maskIndex >= 0) {
      const cardMask = cardMasks[maskIndex];
      const rankMask = getRankMask(getMaskedCardRank(cardMask));
      const matchingSuit = findKey(
        suits,
        (suitedCardsMask) => (rankMask & suitedCardsMask) === rankMask,
      );
      if (matchingSuit) {
        return [cardMask, matchingSuit];
      }
    }

    const nextRank = getReferencedRank(hand, maskIndex);
    if (nextRank !== undefined && isRank(nextRank)) {
      const rankMask = getRankMask(nextRank);
      const matchingSuit = findKey(
        suits,
        (suitedCardsMask) => (rankMask & suitedCardsMask) === rankMask,
      );
      if (matchingSuit) {
        return [RANK_BITS_MAP[nextRank], matchingSuit];
      }
    }

    return [undefined, undefined];
  };

  return maskIndices.reduce((hand: Hand, maskIndex) => {
    const [cardMask, matchingSuit] = getMatchingSuit(hand, maskIndex);
    if (matchingSuit) {
      suits[matchingSuit] -= getRankMask(getMaskedCardRank(cardMask));
      hand.push(`${getMaskedCardRank(cardMask)}${matchingSuit}`);
    }
    return hand;
  }, []);
};

export const getMaskedHand = (
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

  switch (strength) {
    case HandStrength.HighCard:
      return constructHand(handMask, cardMasks, [0, 1, 2, 3, 4]);
    case HandStrength.OnePair:
      return constructHand(handMask, cardMasks, [0, 0, 1, 2, 3]);
    case HandStrength.TwoPair:
      return constructHand(handMask, cardMasks, [0, 0, 1, 1, 2]);
    case HandStrength.ThreeOfAKind:
      return constructHand(handMask, cardMasks, [0, 0, 0, 1, 2]);
    case HandStrength.Straight:
      return constructHand(handMask, cardMasks, [0, -1, -1, -1, -1]);
    case HandStrength.Flush:
      return constructHand(handMask, cardMasks, [0, 1, 2, 3, 4], true);
    case HandStrength.FullHouse:
      return constructHand(handMask, cardMasks, [0, 0, 0, 1, 1]);
    case HandStrength.FourOfAKind:
      return constructHand(handMask, cardMasks, [0, 0, 0, 0, 1]);
    case HandStrength.StraightFlush:
      return constructHand(handMask, cardMasks, [0, -1, -1, -1, -1], true);
    case HandStrength.RoyalFlush:
      return constructHand(handMask, cardMasks, [0, -1, -1, -1, -1], true);
    default:
      return assertNever(strength);
  }
};
