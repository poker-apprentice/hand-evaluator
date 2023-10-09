import { Card, Hand } from '@poker-apprentice/types';

export enum Strength {
  ROYAL_FLUSH = 1,
  STRAIGHT_FLUSH = 2,
  FOUR_OF_A_KIND = 3,
  FULL_HOUSE = 4,
  FLUSH = 5,
  STRAIGHT = 6,
  THREE_OF_A_KIND = 7,
  TWO_PAIR = 8,
  ONE_PAIR = 9,
  HIGH_CARD = 10,
}

export interface EvaluatedHand {
  strength: Strength;
  hand: Hand;
}

export interface Scenario {
  allHoleCards: Hand[];
  communityCards: Card[];
}

export interface Odds {
  wins: number;
  ties: number;
  total: number;
}
