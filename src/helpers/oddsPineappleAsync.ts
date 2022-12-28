import { oddsAsync, OddsAsyncOptions } from '../oddsAsync';

type Options = Omit<
  OddsAsyncOptions,
  'expectedCommunityCardCount' | 'expectedHoleCardCount' | 'minimumHoleCardsUsed' | 'maximumHoleCardsUsed'
>;

export const oddsPineappleAsync = (options: Options) => {
  if (options.allHoleCards.some((holeCards) => holeCards.length > 3)) {
    throw new Error('Each collection of hole cards accept a maximum of 3 elements');
  }
  if (options.communityCards && options.communityCards.length > 5) {
    throw new Error('communityCards accepts a maximum of 5 elements');
  }
  return oddsAsync({
    ...options,
    expectedCommunityCardCount: 5,
    expectedHoleCardCount: 3,
    minimumHoleCardsUsed: 0,
    maximumHoleCardsUsed: 2,
  });
};
