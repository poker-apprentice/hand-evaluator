import { Card, Rank } from '../types';

export const getRank = (card: Card): Rank => card[0] as Rank;
