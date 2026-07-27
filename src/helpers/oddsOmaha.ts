import { Card, Hand } from '@poker-apprentice/types';
import { InvalidCommunityCardCountError, InvalidHoleCardCountError } from '../errors';
import { OddsOptions, odds } from '../odds';

export type OddsOmahaOptions = Pick<OddsOptions, 'maximumEvaluations'>;

export const oddsOmaha = (
  allHoleCards: Hand[],
  communityCards: Card[],
  options: OddsOmahaOptions = {},
) => {
  const invalidHandIndex = allHoleCards.findIndex((holeCards) => holeCards.length > 4);
  if (invalidHandIndex !== -1) {
    throw new InvalidHoleCardCountError(4, allHoleCards[invalidHandIndex].length, invalidHandIndex);
  }
  if (communityCards && communityCards.length > 5) {
    throw new InvalidCommunityCardCountError(5, communityCards.length);
  }
  return odds(allHoleCards, {
    communityCards,
    expectedCommunityCardCount: 5,
    expectedHoleCardCount: 4,
    ...options,
    minimumHoleCardsUsed: 2,
    maximumHoleCardsUsed: 2,
  });
};
