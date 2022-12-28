import { rankOrder } from '../constants';
import { Card, Hand } from '../types';

const allCards: Card[] = rankOrder
  .split('')
  .flatMap((rank) => ['c', 'd', 'h', 's'].map((suit) => `${rank}${suit}` as Card));

// Determine all the possible remaining cards in the deck based upon
// the accounted for cards in `allHoleCards` and `communityCards`.
export const getRemainingCards = (allHoleCards: Hand[], communityCards: Card[] = []): Card[] => {
  const usedCards: Card[] = [...allHoleCards.flat(), ...communityCards];
  return allCards.filter((card) => !usedCards.includes(card));
};
