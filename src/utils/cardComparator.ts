import { rankOrder } from '../constants';
import { Card } from '../types';
import { getRank } from './getRank';

export const cardComparator = (a: Card, b: Card) => {
  const rankA = getRank(a);
  const rankB = getRank(b);
  if (rankA === rankB) {
    return 0;
  }
  return rankOrder.indexOf(rankA) > rankOrder.indexOf(rankB) ? -1 : 1;
};
