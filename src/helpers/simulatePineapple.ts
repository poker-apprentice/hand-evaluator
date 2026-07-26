import { InvalidCommunityCardCountError, InvalidHoleCardCountError } from '../errors';
import { simulate, SimulateOptions } from '../simulate';

export type SimulatePineappleOptions = Omit<
  SimulateOptions,
  | 'expectedCommunityCardCount'
  | 'expectedHoleCardCount'
  | 'minimumHoleCardsUsed'
  | 'maximumHoleCardsUsed'
>;

export const simulatePineapple = (options: SimulatePineappleOptions) => {
  const invalidHandIndex = options.allHoleCards.findIndex((holeCards) => holeCards.length > 3);
  if (invalidHandIndex !== -1) {
    throw new InvalidHoleCardCountError(
      3,
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
    expectedHoleCardCount: 3,
    minimumHoleCardsUsed: 0,
    maximumHoleCardsUsed: 2,
  });
};
