import { Card, Hand } from '@poker-apprentice/types';
import { EquityOptions, equity } from '../equity';
import { InvalidCommunityCardCountError, InvalidHoleCardCountError } from '../errors';

export type EquityOmahaOptions = Pick<EquityOptions, 'maximumEvaluations'>;

/** @deprecated Use {@link EquityOmahaOptions} instead. */
export type OddsOmahaOptions = EquityOmahaOptions;

export const equityOmaha = (
  allHoleCards: Hand[],
  communityCards: Card[],
  options: EquityOmahaOptions = {},
) => {
  const invalidHandIndex = allHoleCards.findIndex((holeCards) => holeCards.length > 4);
  if (invalidHandIndex !== -1) {
    throw new InvalidHoleCardCountError(4, allHoleCards[invalidHandIndex].length, invalidHandIndex);
  }
  if (communityCards && communityCards.length > 5) {
    throw new InvalidCommunityCardCountError(5, communityCards.length);
  }
  return equity(allHoleCards, {
    communityCards,
    expectedCommunityCardCount: 5,
    expectedHoleCardCount: 4,
    ...options,
    minimumHoleCardsUsed: 2,
    maximumHoleCardsUsed: 2,
  });
};

/** @deprecated Use {@link equityOmaha} instead. */
export const oddsOmaha = equityOmaha;
