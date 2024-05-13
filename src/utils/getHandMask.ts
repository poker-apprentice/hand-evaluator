import { Card, Hand, Rank, Suit, getRank, getSuit } from '@poker-apprentice/types';
import { RANK_BITS_MAP, SUIT_BITS_MAP } from '../constants/bitmasks';

export const getRankMask = (rank: Rank): bigint => 1n << RANK_BITS_MAP[rank];

const getSuitOffset = (suit: Suit): bigint => 13n * SUIT_BITS_MAP[suit];

const getCardMask = (card: Card): bigint => {
  const rank = getRankMask(getRank(card));
  const suit = getSuitOffset(getSuit(card));
  return rank << suit;
};

export const getHandMask = (hand: Hand): bigint => {
  let handMask = 0n;

  for (const card of hand) {
    handMask |= getCardMask(card);
  }

  return handMask;
};
