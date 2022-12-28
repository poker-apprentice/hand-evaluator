import { cloneDeep } from 'lodash';
import { Card, Hand, Scenario } from '../types';

interface BuildScenarioOptions {
  allHoleCards: Hand[];
  communityCards: Card[];
  expectedHoleCardCount: number;
  selectedCards: Card[];
}

export const buildScenario = ({
  allHoleCards,
  communityCards,
  expectedHoleCardCount,
  selectedCards,
}: BuildScenarioOptions): Scenario => {
  const scenario = {
    allHoleCards: cloneDeep(allHoleCards),
    communityCards: cloneDeep(communityCards),
  };
  selectedCards.forEach((card) => {
    // Determine which set of hole cards or community cards to place the current card.
    const placementIndex = scenario.allHoleCards.findIndex((hand) => hand.length < expectedHoleCardCount);

    if (placementIndex === -1) {
      scenario.communityCards.push(card);
    } else {
      scenario.allHoleCards[placementIndex].push(card);
    }
  });
  return scenario;
};
