import { oddsAsync, OddsAsyncOptions } from '../oddsAsync';

type Options = Omit<
  OddsAsyncOptions,
  'expectedCommunityCardCount' | 'expectedHoleCardCount' | 'minimumHoleCardsUsed' | 'maximumHoleCardsUsed'
>;

export const oddsOmahaAsync = (options: Options) => {
  if (options.allHoleCards.some((holeCards) => holeCards.length > 4)) {
    throw new Error('Each collection of hole cards accept a maximum of 4 elements');
  }
  if (options.communityCards && options.communityCards.length > 5) {
    throw new Error('communityCards accepts a maximum of 5 elements');
  }
  return oddsAsync({
    ...options,
    expectedCommunityCardCount: 5,
    expectedHoleCardCount: 4,
    minimumHoleCardsUsed: 2,
    maximumHoleCardsUsed: 2,
  });
};
