import { InvalidCommunityCardCountError, InvalidHoleCardCountError } from '../errors';
import { simulate, SimulateOptions } from '../simulate';

export type SimulateHoldemOptions = Omit<
  SimulateOptions,
  | 'expectedCommunityCardCount'
  | 'expectedHoleCardCount'
  | 'minimumHoleCardsUsed'
  | 'maximumHoleCardsUsed'
>;

export const simulateHoldem = (options: SimulateHoldemOptions) => {
  const invalidHandIndex = options.allHoleCards.findIndex((holeCards) => holeCards.length > 2);
  if (invalidHandIndex !== -1) {
    throw new InvalidHoleCardCountError(
      2,
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
    expectedHoleCardCount: 2,
    minimumHoleCardsUsed: 0,
    maximumHoleCardsUsed: 2,
  });
};
