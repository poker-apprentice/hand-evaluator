import { InvalidCommunityCardCountError, InvalidHoleCardCountError } from '../errors';
import { evaluate, EvaluateOptions } from '../evaluate';

export type EvaluateOmahaOptions = Omit<EvaluateOptions, 'minimumHoleCards' | 'maximumHoleCards'>;

export const evaluateOmaha = (options: EvaluateOmahaOptions) => {
  if (options.holeCards.length > 4) {
    throw new InvalidHoleCardCountError(4, options.holeCards.length);
  }
  if (options.communityCards && options.communityCards.length > 5) {
    throw new InvalidCommunityCardCountError(5, options.communityCards.length);
  }
  return evaluate({ minimumHoleCards: 2, maximumHoleCards: 2, ...options });
};
