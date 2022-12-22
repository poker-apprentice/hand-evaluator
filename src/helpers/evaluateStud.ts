import { evaluate, EvaluateOptions } from '../evaluate';

type Options = Omit<EvaluateOptions, 'minimumHoleCards' | 'maximumHoleCards' | 'communityCards'>;

export const evaluateStud = (options: Options) => {
  if (options.holeCards.length > 7) {
    throw new Error('holeCards accepts a maximum of 7 elements');
  }
  return evaluate({ minimumHoleCards: 0, maximumHoleCards: 7, ...options });
};
