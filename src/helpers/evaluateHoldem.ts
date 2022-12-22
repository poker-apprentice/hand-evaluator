import { evaluate, EvaluateOptions } from '../evaluate';

type Options = Omit<EvaluateOptions, 'minimumHoleCards' | 'maximumHoleCards'>;

export const evaluateHoldem = (options: Options) => {
  if (options.holeCards.length > 2) {
    throw new Error('holeCards accepts a maximum of 2 elements');
  }
  if (options.communityCards && options.communityCards.length > 5) {
    throw new Error('communityCards accepts a maximum of 5 elements');
  }
  return evaluate({ minimumHoleCards: 0, maximumHoleCards: 2, ...options });
};
