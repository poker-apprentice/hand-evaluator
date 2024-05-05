import { Card, Hand } from '@poker-apprentice/types';
import { Odds } from './types';
import { buildScenario } from './utils/buildScenario';
import { Scenario, evaluateScenario } from './utils/evaluateScenario';
import { getRemainingCardCount } from './utils/getRemainingCardCount';
import { getRemainingCards } from './utils/getRemainingCards';
import { iteratePermutations } from './utils/iteratePermutations';

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

function* iterateAllScenarios({
  allHoleCards,
  communityCards,
  expectedCommunityCardCount,
  expectedHoleCardCount,
  remainingCards,
}: HelperOptions): Generator<Scenario, void> {
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
  for (const cards of iteratePermutations(remainingCards, remainingCardCount)) {
    // Generate all possible hole card + community card scenarios based upon the remaining cards.
    yield buildScenario({
      allHoleCards,
      communityCards,
      expectedHoleCardCount,
      selectedCards: cards,
    });
  }
}

export const odds = (allHoleCards: Hand[], options: OddsOptions): Odds[] => {
  const remainingCards = getRemainingCards(allHoleCards, options.communityCards);

  const odds: Odds[] = allHoleCards.map(() => ({ wins: 0, ties: 0, total: 0 }));

  for (const scenario of iterateAllScenarios({ ...options, allHoleCards, remainingCards })) {
    // Call `evaluate` on every scenario, then use the `compare` function to determine the winner for
    // each scenario.  Return an array of objects containing the counts of possible winning
    // scenarios, tying scenarios, and total number of scenarios.
    const scenarioEvaluations = evaluateScenario(scenario, {
      minimumHoleCardsUsed: options.minimumHoleCardsUsed,
      maximumHoleCardsUsed: options.maximumHoleCardsUsed,
    });
    scenarioEvaluations.forEach((evaluation, index) => {
      odds[index].wins += evaluation.wins;
      odds[index].ties += evaluation.ties;
      odds[index].total += evaluation.total;
    });
  }

  return odds;
};
