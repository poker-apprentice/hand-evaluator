import { InvalidHoleCardCountError } from '../errors';
import { simulate, SimulateOptions } from '../simulate';

export type SimulateStudOptions = Omit<
  SimulateOptions,
  | 'expectedCommunityCardCount'
  | 'expectedHoleCardCount'
  | 'minimumHoleCardsUsed'
  | 'maximumHoleCardsUsed'
  | 'communityCards'
>;

export const simulateStud = (options: SimulateStudOptions) => {
  const invalidHandIndex = options.allHoleCards.findIndex((holeCards) => holeCards.length > 7);
  if (invalidHandIndex !== -1) {
    throw new InvalidHoleCardCountError(
      7,
      options.allHoleCards[invalidHandIndex].length,
      invalidHandIndex,
    );
  }
  return simulate({
    ...options,
    communityCards: [],
    expectedCommunityCardCount: 0,
    expectedHoleCardCount: 7,
    minimumHoleCardsUsed: 0,
    maximumHoleCardsUsed: 7,
  });
};
