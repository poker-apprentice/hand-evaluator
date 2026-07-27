import { InvalidHoleCardCountError } from '../errors';
import { evaluate, EvaluateOptions } from '../evaluate';

export type EvaluateStudOptions = Omit<
  EvaluateOptions,
  'minimumHoleCards' | 'maximumHoleCards' | 'communityCards'
>;

export const evaluateStud = (options: EvaluateStudOptions) => {
  if (options.holeCards.length > 7) {
    throw new InvalidHoleCardCountError(7, options.holeCards.length);
  }
  return evaluate({ minimumHoleCards: 0, maximumHoleCards: 7, ...options });
};
