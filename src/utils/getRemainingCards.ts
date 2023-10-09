import { ALL_CARDS, Card, Hand } from '@poker-apprentice/types';

// Determine all the possible remaining cards in the deck based upon
// the accounted for cards in `allHoleCards` and `communityCards`.
export const getRemainingCards = (allHoleCards: Hand[], communityCards: Card[] = []): Card[] => {
  const usedCards: Card[] = [...allHoleCards.flat(), ...communityCards];
  return ALL_CARDS.filter((card) => !usedCards.includes(card));
};
