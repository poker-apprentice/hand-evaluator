import { Card, Hand } from '@poker-apprentice/types';
import { createEngine } from './core/enumerate';
import { MaximumEvaluationsExceededError } from './errors';
import { EquityResult } from './types';

export interface EquityOptions {
  communityCards: Card[];
  expectedCommunityCardCount: number;
  expectedHoleCardCount: number;
  minimumHoleCardsUsed: number;
  maximumHoleCardsUsed: number;
  /**
   * Maximum number of hand evaluations allowed before `equity` refuses to run (default 500
   * million, roughly a few seconds of computation).  Exhaustive enumeration guarantees exact
   * results but grows combinatorially with the number of unknown cards; beyond this limit,
   * `simulate` should be used instead.
   */
  maximumEvaluations?: number;
}

/** @deprecated Use {@link EquityOptions} instead. */
export type OddsOptions = EquityOptions;

const DEFAULT_MAXIMUM_EVALUATIONS = 500_000_000;

/**
 * Determines the exact equity of each hand by exhaustively enumerating every possible
 * combination of the not-yet-dealt cards (any unspecified hole cards and the remaining
 * community cards) and evaluating every hand in each resulting scenario.
 * @param {Hand[]} allHoleCards Each player's known hole cards.
 * @param {EquityOptions} options Game rules: expected card counts and hole-card usage limits.
 * @returns {EquityResult[]} The win/tie counts and pot equity of each hand, in the order provided.
 */
export const equity = (allHoleCards: Hand[], options: EquityOptions): EquityResult[] => {
  if (allHoleCards.length === 0) {
    return [];
  }

  const engine = createEngine(allHoleCards, options);

  const maximumEvaluations = options.maximumEvaluations ?? DEFAULT_MAXIMUM_EVALUATIONS;
  const requiredEvaluations = engine.estimatedEvaluations;
  if (requiredEvaluations > maximumEvaluations) {
    throw new MaximumEvaluationsExceededError(requiredEvaluations, maximumEvaluations);
  }

  engine.enumerate();
  return engine.snapshot();
};

/** @deprecated Use {@link equity} instead. */
export const odds = equity;
