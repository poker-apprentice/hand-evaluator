import { Card, Suit } from '../types';

export const getSuit = (card: Card): Suit => card[1] as Suit;
