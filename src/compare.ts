import { EvaluatedHand } from './types';
import { handComparator } from './utils/handComparator';

export const compare = (a: EvaluatedHand, b: EvaluatedHand) => {
  if (a.strength === b.strength) {
    return handComparator(a.hand, b.hand);
  }
  return a.strength < b.strength ? 1 : -1;
};
