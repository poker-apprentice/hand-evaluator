import { InvalidCommunityCardCountError, InvalidHoleCardCountError } from '../errors';
import { simulate, SimulateOptions } from '../simulate';

export type SimulateOmahaOptions = Omit<
  SimulateOptions,
  | 'expectedCommunityCardCount'
  | 'expectedHoleCardCount'
  | 'minimumHoleCardsUsed'
  | 'maximumHoleCardsUsed'
>;

export const simulateOmaha = (options: SimulateOmahaOptions) => {
  const invalidHandIndex = options.allHoleCards.findIndex((holeCards) => holeCards.length > 4);
  if (invalidHandIndex !== -1) {
    throw new InvalidHoleCardCountError(
      4,
      options.allHoleCards[invalidHandIndex].length,
      invalidHandIndex,
    );
  }
  if (options.communityCards && options.communityCards.length > 5) {
    throw new InvalidCommunityCardCountError(5, options.communityCards.length);
  }
  return simulate({
    ...options,
    expectedCommunityCardCount: 5,
    expectedHoleCardCount: 4,
    minimumHoleCardsUsed: 2,
    maximumHoleCardsUsed: 2,
  });
};
