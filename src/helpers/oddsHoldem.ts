import { Card, Hand } from '@poker-apprentice/types';
import { OddsOptions, odds } from '../odds';

type HelperOptions = Pick<OddsOptions, 'maximumEvaluations'>;

export const oddsHoldem = (
  allHoleCards: Hand[],
  communityCards: Card[],
  options: HelperOptions = {},
) => {
  if (allHoleCards.some((holeCards) => holeCards.length > 2)) {
    throw new Error('Each collection of hole cards accept a maximum of 2 elements');
  }
  if (communityCards && communityCards.length > 5) {
    throw new Error('communityCards accepts a maximum of 5 elements');
  }
  return odds(allHoleCards, {
    communityCards,
    expectedCommunityCardCount: 5,
    expectedHoleCardCount: 2,
    ...options,
    minimumHoleCardsUsed: 0,
    maximumHoleCardsUsed: 2,
  });
};
