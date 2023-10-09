import { Hand } from '@poker-apprentice/types';
import { odds } from '../odds';

export const oddsStud = (allHoleCards: Hand[]) => {
  if (allHoleCards.some((holeCards) => holeCards.length > 7)) {
    throw new Error('Each collection of hole cards accept a maximum of 7 elements');
  }
  return odds(allHoleCards, {
    communityCards: [],
    expectedCommunityCardCount: 0,
    expectedHoleCardCount: 7,
    minimumHoleCardsUsed: 0,
    maximumHoleCardsUsed: 7,
  });
};
