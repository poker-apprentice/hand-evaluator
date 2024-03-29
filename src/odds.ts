import { Card, Hand } from '@poker-apprentice/types';
import { Odds } from './types';
import { buildScenario } from './utils/buildScenario';
import { Scenario, evaluateScenario } from './utils/evaluateScenario';
import { getPermutations } from './utils/getPermutations';
import { getRemainingCardCount } from './utils/getRemainingCardCount';
import { getRemainingCards } from './utils/getRemainingCards';

export interface OddsOptions {
  communityCards: Card[];
  expectedCommunityCardCount: number;
  expectedHoleCardCount: number;
  minimumHoleCardsUsed: number;
  maximumHoleCardsUsed: number;
}

interface HelperOptions extends Omit<OddsOptions, 'minimumHoleCardsUsed' | 'maximumHoleCardsUsed'> {
  allHoleCards: Hand[];
  remainingCards: Card[];
}

const getAllScenarios = ({
  allHoleCards,
  communityCards,
  expectedCommunityCardCount,
  expectedHoleCardCount,
  remainingCards,
}: HelperOptions): Scenario[] => {
  // Determine how many more cards need to be selected to fill any unspecified
  // hole cards or community cards.
  const remainingCardCount = getRemainingCardCount({
    allHoleCards,
    communityCards,
    expectedCommunityCardCount,
    expectedHoleCardCount,
  });

  // Get all permutations of remaining cards that can be used.  We want permutations rather than
  // combinations because the results are different when a card ends up being treated as a hole
  // card vs. community card.
  const remainingCardPermutations = getPermutations(remainingCards, remainingCardCount);

  if (remainingCardPermutations.length === 0) {
    return [{ allHoleCards, communityCards }];
  }

  // Generate all possible hole card + community card scenarios based upon the remaining cards.
  return remainingCardPermutations.reduce((scenarios: Scenario[], cards) => {
    scenarios.push(
      buildScenario({
        allHoleCards,
        communityCards,
        expectedHoleCardCount,
        selectedCards: cards,
      }),
    );
    return scenarios;
  }, []);
};

export const odds = (allHoleCards: Hand[], options: OddsOptions): Odds[] => {
  const remainingCards = getRemainingCards(allHoleCards, options.communityCards);
  const allScenarios = getAllScenarios({ ...options, allHoleCards, remainingCards });

  // Call `evaluate` on every scenario, then use the `compare` function to determine the winner for
  // each scenario.  Return an array of objects containing the counts of possible winning
  // scenarios, tying scenarios, and total number of scenarios.
  return allScenarios.reduce((accum: Odds[], scenario) => {
    const scenarioEvaluations = evaluateScenario(scenario, {
      minimumHoleCardsUsed: options.minimumHoleCardsUsed,
      maximumHoleCardsUsed: options.maximumHoleCardsUsed,
    });
    scenarioEvaluations.forEach((evaluation, index) => {
      accum[index].wins += evaluation.wins;
      accum[index].ties += evaluation.ties;
      accum[index].total += evaluation.total;
    });
    return accum;
  }, allHoleCards.map(() => ({ wins: 0, ties: 0, total: 0 })) as Odds[]);
};
