import { Card, Hand } from '@poker-apprentice/types';
import { odds } from '../odds';

export const oddsOmaha = (allHoleCards: Hand[], communityCards: Card[]) => {
  if (allHoleCards.some((holeCards) => holeCards.length > 4)) {
    throw new Error('Each collection of hole cards accept a maximum of 4 elements');
  }
  if (communityCards && communityCards.length > 5) {
    throw new Error('communityCards accepts a maximum of 5 elements');
  }
  return odds(allHoleCards, {
    communityCards,
    expectedCommunityCardCount: 5,
    expectedHoleCardCount: 4,
    minimumHoleCardsUsed: 2,
    maximumHoleCardsUsed: 2,
  });
};
