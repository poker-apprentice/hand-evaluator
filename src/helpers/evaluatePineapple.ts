import { InvalidCommunityCardCountError, InvalidHoleCardCountError } from '../errors';
import { evaluate, EvaluateOptions } from '../evaluate';

export type EvaluatePineappleOptions = Omit<
  EvaluateOptions,
  'minimumHoleCards' | 'maximumHoleCards'
>;

export const evaluatePineapple = (options: EvaluatePineappleOptions) => {
  if (options.holeCards.length > 3) {
    throw new InvalidHoleCardCountError(3, options.holeCards.length);
  }
  if (options.communityCards && options.communityCards.length > 5) {
    throw new InvalidCommunityCardCountError(5, options.communityCards.length);
  }
  return evaluate({ minimumHoleCards: 0, maximumHoleCards: 2, ...options });
};
