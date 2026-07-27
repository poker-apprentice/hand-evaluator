import { Hand } from '@poker-apprentice/types';
import { InvalidHoleCardCountError } from '../errors';
import { OddsOptions, odds } from '../odds';

export type OddsStudOptions = Pick<OddsOptions, 'maximumEvaluations'>;

export const oddsStud = (allHoleCards: Hand[], options: OddsStudOptions = {}) => {
  const invalidHandIndex = allHoleCards.findIndex((holeCards) => holeCards.length > 7);
  if (invalidHandIndex !== -1) {
    throw new InvalidHoleCardCountError(7, allHoleCards[invalidHandIndex].length, invalidHandIndex);
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
