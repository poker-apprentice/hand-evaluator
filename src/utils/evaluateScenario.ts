import { compare } from '../compare';
import { evaluate } from '../evaluate';
import { Odds, Scenario } from '../types';

interface Options {
  minimumHoleCardsUsed: number;
  maximumHoleCardsUsed: number;
}

export const evaluateScenario = (
  scenario: Scenario,
  { minimumHoleCardsUsed, maximumHoleCardsUsed }: Options,
): Odds[] => {
  const scenarioEvaluations = scenario.allHoleCards.map((holeCards) =>
    evaluate({
      holeCards,
      communityCards: scenario.communityCards,
      minimumHoleCards: minimumHoleCardsUsed,
      maximumHoleCards: maximumHoleCardsUsed,
    }),
  );

  const bestHandIndices = scenarioEvaluations.reduce((bestIndices, evaluation, index) => {
    const result = compare(evaluation, scenarioEvaluations[[...bestIndices][0]]);
    if (result === 1) {
      return bestIndices;
    }
    if (result === -1) {
      return new Set([index]);
    }
    bestIndices.add(index);
    return bestIndices;
  }, new Set([0]));

  const isTie = bestHandIndices.size > 1;

  return scenario.allHoleCards.map((_holeCards, index) => ({
    wins: bestHandIndices.has(index) && !isTie ? 1 : 0,
    ties: bestHandIndices.has(index) && isTie ? 1 : 0,
    total: 1,
  }));
};
