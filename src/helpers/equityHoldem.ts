import { Card, Hand } from '@poker-apprentice/types';
import { EquityOptions, equity } from '../equity';
import { InvalidCommunityCardCountError, InvalidHoleCardCountError } from '../errors';

export type EquityHoldemOptions = Pick<EquityOptions, 'maximumEvaluations'>;

/** @deprecated Use {@link EquityHoldemOptions} instead. */
export type OddsHoldemOptions = EquityHoldemOptions;

export const equityHoldem = (
  allHoleCards: Hand[],
  communityCards: Card[],
  options: EquityHoldemOptions = {},
) => {
  const invalidHandIndex = allHoleCards.findIndex((holeCards) => holeCards.length > 2);
  if (invalidHandIndex !== -1) {
    throw new InvalidHoleCardCountError(2, allHoleCards[invalidHandIndex].length, invalidHandIndex);
  }
  if (communityCards && communityCards.length > 5) {
    throw new InvalidCommunityCardCountError(5, communityCards.length);
  }
  return equity(allHoleCards, {
    communityCards,
    expectedCommunityCardCount: 5,
    expectedHoleCardCount: 2,
    ...options,
    minimumHoleCardsUsed: 0,
    maximumHoleCardsUsed: 2,
  });
};

/** @deprecated Use {@link equityHoldem} instead. */
export const oddsHoldem = equityHoldem;
