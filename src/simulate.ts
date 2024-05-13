import { Card, Hand } from '@poker-apprentice/types';
import { Odds } from './types';
import { buildScenario } from './utils/buildScenario';
import { evaluateScenario } from './utils/evaluateScenario';
import { getPermutations } from './utils/getPermutations';
import { getRemainingCardCount } from './utils/getRemainingCardCount';
import { getRemainingCards } from './utils/getRemainingCards';

export interface SimulateOptions {
  allHoleCards: Hand[];
  communityCards: Card[];
  expectedCommunityCardCount: number;
  expectedHoleCardCount: number;
  minimumHoleCardsUsed: number;
  maximumHoleCardsUsed: number;
}

/**
 * TODO
 * @param {SimulateOptions} options Options for Monte Carlo simulation.
 * @yields {Odds[]} The combined odds of all simulations run against the provided options.
 * @returns {Odds[]} The combined odds of all simulations run against the provided options.
 */
export function* simulate({
  allHoleCards,
  communityCards,
  expectedCommunityCardCount,
  expectedHoleCardCount,
  minimumHoleCardsUsed,
  maximumHoleCardsUsed,
}: SimulateOptions): Generator<Odds[], Odds[]> {
  const results: Odds[] = allHoleCards.map(() => ({ wins: 0, ties: 0, total: 0, equity: 0 }));

  const remainingCards = getRemainingCards(allHoleCards, communityCards);

  // Determine how many more cards need to be selected to fill any unspecified
  // hole cards or community cards.
  const remainingCardCount = getRemainingCardCount({
    allHoleCards,
    communityCards,
    expectedCommunityCardCount,
    expectedHoleCardCount,
  });

  const remainingCardPermutations = getPermutations(remainingCards, remainingCardCount);

  while (remainingCardPermutations.length > 0) {
    const randomIndex = Math.floor(Math.random() * remainingCardPermutations.length);
    const [cards] = remainingCardPermutations.splice(randomIndex, 1);

    const scenario = buildScenario({
      allHoleCards,
      communityCards,
      expectedHoleCardCount,
      selectedCards: cards,
    });

    const scenarioEvaluations = evaluateScenario(scenario, {
      minimumHoleCardsUsed,
      maximumHoleCardsUsed,
    });

    for (let index = 0; index < scenarioEvaluations.length; index += 1) {
      const evaluation = scenarioEvaluations[index];
      results[index].equity =
        (results[index].equity * results[index].total + evaluation.equity) /
        (results[index].total + evaluation.total);
      results[index].wins += evaluation.wins;
      results[index].ties += evaluation.ties;
      results[index].total += evaluation.total;
    }

    if (remainingCardPermutations.length >= 0) {
      yield results;
    } else {
      return results;
    }
  }

  return results;
}
