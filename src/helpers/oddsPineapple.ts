import { Card, Hand } from '@poker-apprentice/types';
import { InvalidCommunityCardCountError, InvalidHoleCardCountError } from '../errors';
import { OddsOptions, odds } from '../odds';

export type OddsPineappleOptions = Pick<OddsOptions, 'maximumEvaluations'>;

export const oddsPineapple = (
  allHoleCards: Hand[],
  communityCards: Card[],
  options: OddsPineappleOptions = {},
) => {
  const invalidHandIndex = allHoleCards.findIndex((holeCards) => holeCards.length > 3);
  if (invalidHandIndex !== -1) {
    throw new InvalidHoleCardCountError(3, allHoleCards[invalidHandIndex].length, invalidHandIndex);
  }
  if (communityCards && communityCards.length > 5) {
    throw new InvalidCommunityCardCountError(5, communityCards.length);
  }
  return odds(allHoleCards, {
    communityCards,
    expectedCommunityCardCount: 5,
    expectedHoleCardCount: 3,
    ...options,
    minimumHoleCardsUsed: 0,
    maximumHoleCardsUsed: 2,
  });
};
