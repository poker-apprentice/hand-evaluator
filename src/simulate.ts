import { Card, Hand } from '@poker-apprentice/types';
import { createEngine } from './core/enumerate';
import { Odds } from './types';

export interface SimulateOptions {
  allHoleCards: Hand[];
  communityCards: Card[];
  expectedCommunityCardCount: number;
  expectedHoleCardCount: number;
  minimumHoleCardsUsed: number;
  maximumHoleCardsUsed: number;
  /** Number of random scenarios to evaluate between yields (default 1). */
  samplesPerUpdate?: number;
}

/**
 * Approximates the odds of each hand winning via Monte Carlo simulation, repeatedly dealing
 * the not-yet-dealt cards uniformly at random and evaluating every hand.  Unlike `odds`, the
 * generator never exhausts: consumers decide when the accumulated `total` (and therefore the
 * accuracy of `equity`) is sufficient and stop iterating.
 * @param {SimulateOptions} options The hands to compare and game rules to apply.
 * @yields {Odds[]} The accumulated odds of all simulated scenarios so far.
 * @returns {Odds[]} The accumulated odds of all simulated scenarios.
 */
export function* simulate({
  allHoleCards,
  samplesPerUpdate = 1,
  ...options
}: SimulateOptions): Generator<Odds[], Odds[]> {
  const engine = createEngine(allHoleCards, options);

  while (true) {
    for (let i = 0; i < samplesPerUpdate; i += 1) {
      engine.sample(Math.random);
    }
    yield engine.snapshot();
  }
}
