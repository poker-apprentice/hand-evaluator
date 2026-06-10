import { Hand } from '@poker-apprentice/types';
import { OddsOptions, odds } from '../odds';

type HelperOptions = Pick<OddsOptions, 'maximumEvaluations'>;

export const oddsStud = (allHoleCards: Hand[], options: HelperOptions = {}) => {
  if (allHoleCards.some((holeCards) => holeCards.length > 7)) {
    throw new Error('Each collection of hole cards accept a maximum of 7 elements');
  }
  return odds(allHoleCards, {
    communityCards: [],
    expectedCommunityCardCount: 0,
    expectedHoleCardCount: 7,
    ...options,
    minimumHoleCardsUsed: 0,
    maximumHoleCardsUsed: 7,
  });
};
