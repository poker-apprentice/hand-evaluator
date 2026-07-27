import { Hand } from '@poker-apprentice/types';
import { EquityOptions, equity } from '../equity';
import { InvalidHoleCardCountError } from '../errors';

export type EquityStudOptions = Pick<EquityOptions, 'maximumEvaluations'>;

/** @deprecated Use {@link EquityStudOptions} instead. */
export type OddsStudOptions = EquityStudOptions;

export const equityStud = (allHoleCards: Hand[], options: EquityStudOptions = {}) => {
  const invalidHandIndex = allHoleCards.findIndex((holeCards) => holeCards.length > 7);
  if (invalidHandIndex !== -1) {
    throw new InvalidHoleCardCountError(7, allHoleCards[invalidHandIndex].length, invalidHandIndex);
  }
  return equity(allHoleCards, {
    communityCards: [],
    expectedCommunityCardCount: 0,
    expectedHoleCardCount: 7,
    ...options,
    minimumHoleCardsUsed: 0,
    maximumHoleCardsUsed: 7,
  });
};

/** @deprecated Use {@link equityStud} instead. */
export const oddsStud = equityStud;
