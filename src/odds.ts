import { Card, Hand } from '@poker-apprentice/types';
import { createEngine } from './core/enumerate';
import { Odds } from './types';

export interface OddsOptions {
  communityCards: Card[];
  expectedCommunityCardCount: number;
  expectedHoleCardCount: number;
  minimumHoleCardsUsed: number;
  maximumHoleCardsUsed: number;
  /**
   * Maximum number of hand evaluations allowed before `odds` refuses to run (default 500
   * million, roughly a few seconds of computation).  Exhaustive enumeration guarantees exact
   * results but grows combinatorially with the number of unknown cards; beyond this limit,
   * `simulate` should be used instead.
   */
  maximumEvaluations?: number;
}

const DEFAULT_MAXIMUM_EVALUATIONS = 500_000_000;

/**
 * Determines the exact odds of each hand winning by exhaustively enumerating every possible
 * combination of the not-yet-dealt cards (any unspecified hole cards and the remaining
 * community cards) and evaluating every hand in each resulting scenario.
 * @param {Hand[]} allHoleCards Each player's known hole cards.
 * @param {OddsOptions} options Game rules: expected card counts and hole-card usage limits.
 * @returns {Odds[]} The win/tie counts and pot equity of each hand, in the order provided.
 */
export const odds = (allHoleCards: Hand[], options: OddsOptions): Odds[] => {
  if (allHoleCards.length === 0) {
    return [];
  }

  const engine = createEngine(allHoleCards, options);

  const maximumEvaluations = options.maximumEvaluations ?? DEFAULT_MAXIMUM_EVALUATIONS;
  const requiredEvaluations = engine.scenarioCount * engine.evaluationsPerScenario;
  if (requiredEvaluations > maximumEvaluations) {
    throw new Error(
      `odds() would require ${requiredEvaluations} hand evaluations, which exceeds ` +
        `maximumEvaluations (${maximumEvaluations}). Use simulate() for an approximate ` +
        `result, or increase options.maximumEvaluations.`,
    );
  }

  engine.enumerate();
  return engine.snapshot();
};
