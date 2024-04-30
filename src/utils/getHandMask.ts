import { Card, Hand, Rank, Suit, getRank, getSuit } from '@poker-apprentice/types';
import invert from 'lodash/invert';
import { bigintKey } from './bigintKey';

const RANK_BITS_MAP: Record<Rank, bigint> = {
  '2': 0n,
  '3': 1n,
  '4': 2n,
  '5': 3n,
  '6': 4n,
  '7': 5n,
  '8': 6n,
  '9': 7n,
  T: 8n,
  J: 9n,
  Q: 10n,
  K: 11n,
  A: 12n,
};

const SUIT_BITS_MAP: Record<Suit, bigint> = {
  c: 0n,
  d: 1n,
  h: 2n,
  s: 3n,
};

const BITS_RANK_MAP = invert(RANK_BITS_MAP) as Record<number, Rank>;

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

export const getMaskedCardRank = (cardMask: bigint): Rank =>
  BITS_RANK_MAP[bigintKey(cardMask % 13n)];
