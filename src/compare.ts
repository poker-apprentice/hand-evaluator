import { EvaluatedHand } from './types';

export const compare = (a: EvaluatedHand, b: EvaluatedHand) => {
  if (a.value === b.value) {
    return 0;
  }
  return a.value < b.value ? 1 : -1;
};
