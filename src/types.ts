import { Hand, HandStrength } from '@poker-apprentice/types';

export interface EvaluatedHand {
  strength: HandStrength;
  hand: Hand;
}

export interface Odds {
  /** Number of evaluated scenarios in which this hand is the sole winner. */
  wins: number;
  /** Number of evaluated scenarios in which this hand ties for the win. */
  ties: number;
  /** Total number of evaluated scenarios. */
  total: number;
  /**
   * This hand's share of the pot across all evaluated scenarios, between 0 and 1.  Tied
   * scenarios contribute a fractional share, so all hands' equities sum to 1.
   */
  equity: number;
}
