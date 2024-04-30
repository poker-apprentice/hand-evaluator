import { Card, getRank } from '@poker-apprentice/types';
import { rankOrder } from '../constants/rankOrder';

export const cardComparator = (a: Card, b: Card) => {
  const rankA = getRank(a);
  const rankB = getRank(b);
  if (rankA === rankB) {
    return 0;
  }
  return rankOrder.indexOf(rankA) > rankOrder.indexOf(rankB) ? -1 : 1;
};
