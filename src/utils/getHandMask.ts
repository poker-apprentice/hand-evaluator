import { Card, Hand, getRank, getSuit } from '@poker-apprentice/types';
import { RANK_BITS_MAP, SUIT_BITS_MAP } from '../constants/bitmasks';

const getCardValue = (card: Card): bigint => {
  const rank = RANK_BITS_MAP[getRank(card)];
  const suit = SUIT_BITS_MAP[getSuit(card)];
  return rank + suit * 13n;
};

export const getHandMask = (hand: Hand): bigint => {
  let handMask = 0n;

  for (const card of hand) {
    const cardValue = getCardValue(card);
    handMask |= 1n << cardValue;
  }

  return handMask;
};
