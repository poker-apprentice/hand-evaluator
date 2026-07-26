import { InvalidCommunityCardCountError, InvalidHoleCardCountError } from '../errors';
import { evaluate, EvaluateOptions } from '../evaluate';

export type EvaluateHoldemOptions = Omit<EvaluateOptions, 'minimumHoleCards' | 'maximumHoleCards'>;

export const evaluateHoldem = (options: EvaluateHoldemOptions) => {
  if (options.holeCards.length > 2) {
    throw new InvalidHoleCardCountError(2, options.holeCards.length);
  }
  if (options.communityCards && options.communityCards.length > 5) {
    throw new InvalidCommunityCardCountError(5, options.communityCards.length);
  }
  return evaluate({ minimumHoleCards: 0, maximumHoleCards: 2, ...options });
};
