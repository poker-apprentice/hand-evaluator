import { oddsAsync, OddsAsyncOptions } from '../oddsAsync';

type Options = Omit<
  OddsAsyncOptions,
  | 'expectedCommunityCardCount'
  | 'expectedHoleCardCount'
  | 'minimumHoleCardsUsed'
  | 'maximumHoleCardsUsed'
  | 'communityCards'
>;

export const oddsStudAsync = (options: Options) => {
  if (options.allHoleCards.some((holeCards) => holeCards.length > 7)) {
    throw new Error('Each collection of hole cards accept a maximum of 7 elements');
  }
  return oddsAsync({
    ...options,
    communityCards: [],
    expectedCommunityCardCount: 0,
    expectedHoleCardCount: 7,
    minimumHoleCardsUsed: 0,
    maximumHoleCardsUsed: 7,
  });
};
