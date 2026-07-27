import { Card, Hand } from '@poker-apprentice/types';
import { EquityOptions, equity } from '../equity';
import { InvalidCommunityCardCountError, InvalidHoleCardCountError } from '../errors';

export type EquityPineappleOptions = Pick<EquityOptions, 'maximumEvaluations'>;

/** @deprecated Use {@link EquityPineappleOptions} instead. */
export type OddsPineappleOptions = EquityPineappleOptions;

export const equityPineapple = (
  allHoleCards: Hand[],
  communityCards: Card[],
  options: EquityPineappleOptions = {},
) => {
  const invalidHandIndex = allHoleCards.findIndex((holeCards) => holeCards.length > 3);
  if (invalidHandIndex !== -1) {
    throw new InvalidHoleCardCountError(3, allHoleCards[invalidHandIndex].length, invalidHandIndex);
  }
  if (communityCards && communityCards.length > 5) {
    throw new InvalidCommunityCardCountError(5, communityCards.length);
  }
  return equity(allHoleCards, {
    communityCards,
    expectedCommunityCardCount: 5,
    expectedHoleCardCount: 3,
    ...options,
    minimumHoleCardsUsed: 0,
    maximumHoleCardsUsed: 2,
  });
};

/** @deprecated Use {@link equityPineapple} instead. */
export const oddsPineapple = equityPineapple;
