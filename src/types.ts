import { Hand, HandStrength } from '@poker-apprentice/types';

export interface EvaluatedHand {
  strength: HandStrength;
  hand: Hand;
}

export interface Odds {
  wins: number;
  ties: number;
  total: number;
  equity: number;
}
