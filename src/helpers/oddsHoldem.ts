import { Card, Hand } from '@poker-apprentice/types';
import { InvalidCommunityCardCountError, InvalidHoleCardCountError } from '../errors';
import { OddsOptions, odds } from '../odds';

export type OddsHoldemOptions = Pick<OddsOptions, 'maximumEvaluations'>;

export const oddsHoldem = (
  allHoleCards: Hand[],
  communityCards: Card[],
  options: OddsHoldemOptions = {},
) => {
  const invalidHandIndex = allHoleCards.findIndex((holeCards) => holeCards.length > 2);
  if (invalidHandIndex !== -1) {
    throw new InvalidHoleCardCountError(2, allHoleCards[invalidHandIndex].length, invalidHandIndex);
  }
  if (communityCards && communityCards.length > 5) {
    throw new InvalidCommunityCardCountError(5, communityCards.length);
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
