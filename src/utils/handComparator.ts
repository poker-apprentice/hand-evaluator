import { Card } from '@poker-apprentice/types';
import { cardComparator } from './cardComparator';

export const handComparator = (a: Card[], b: Card[]) => {
  for (let i = 0; i < a.length; i += 1) {
    if (!b[i]) {
      return -1;
    }
    const result = cardComparator(a[i], b[i]);
    if (result !== 0) {
      return result;
    }
  }
  return b.length > a.length ? 1 : 0;
};
