import cloneDeep from 'lodash/cloneDeep';
import { compare } from './compare';
import { rankOrder } from './constants';
import { evaluate } from './evaluate';
import { Card, Hand, Odds } from './types';
import { getCombinations } from './utils/getCombinations';

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

interface Scenario {
  allHoleCards: Hand[];
  communityCards: Card[];
}

const allCards: Card[] = rankOrder
  .split('')
  .flatMap((rank) => ['c', 'd', 'h', 's'].map((suit) => `${rank}${suit}` as Card));

const getAllScenarios = ({
  allHoleCards,
  communityCards,
  expectedCommunityCardCount,
  expectedHoleCardCount,
  remainingCards,
}: HelperOptions): Scenario[] => {
  // Determine how many more cards need to be selected to fill any unspecified
  // hole cards or community cards.
  const remainingHoleCardCount = Math.max(
    0,
    allHoleCards.reduce((count, holeCards) => count + (expectedHoleCardCount - holeCards.length), 0),
  );
  const remainingCommunityCardCount = Math.max(0, expectedCommunityCardCount - communityCards.length);
  const remainingCardCount = remainingHoleCardCount + remainingCommunityCardCount;

  // Get all combinations of remaining cards that can be used.
  const remainingCardCombinations = getCombinations(remainingCards, remainingCardCount);

  if (remainingCardCombinations.length === 0) {
    return [{ allHoleCards, communityCards }];
  }

  // Generate all possible hole card + community card scenarios based upon the remaining cards.
  return remainingCardCombinations.reduce((scenarios: Scenario[], cards) => {
    const scenario = {
      allHoleCards: cloneDeep(allHoleCards),
      communityCards: cloneDeep(communityCards),
    };
    cards.forEach((card) => {
      // Determine which set of hole cards or community cards to place the current card.
      const placementIndex = scenario.allHoleCards.findIndex((hand) => hand.length < expectedHoleCardCount);

      if (placementIndex === -1) {
        scenario.communityCards.push(card);
      } else {
        scenario.allHoleCards[placementIndex].push(card);
      }
    });
    scenarios.push(scenario);
    return scenarios;
  }, []);
};

export const odds = (allHoleCards: Hand[], options: OddsOptions): Odds[] => {
  // Determine all the possible remaining cards in the deck based upon
  // the accounted for cards in `allHoleCards` and `communityCards`.
  const usedCards: Card[] = [...allHoleCards.flat(), ...options.communityCards];
  const remainingCards: Card[] = allCards.filter((card) => !usedCards.includes(card));

  const allScenarios = getAllScenarios({ ...options, allHoleCards, remainingCards });
  const scenarioCount = allScenarios.length;

  // Call `evaluate` on every scenario, then use the `compare` function to determine the winner for
  // each scenario.  Return an array of objects containing the counts of possible winning
  // scenarios, tying scenarios, and total number of scenarios.
  return allScenarios.reduce((accum: Odds[], scenario) => {
    const scenarioEvaluations = scenario.allHoleCards.map((holeCards) =>
      evaluate({
        holeCards,
        communityCards: scenario.communityCards,
        minimumHoleCards: options.minimumHoleCardsUsed,
        maximumHoleCards: options.maximumHoleCardsUsed,
      }),
    );
    const bestHandIndices = scenarioEvaluations.reduce(
      (bestIndices: number[], evaluation, index) => {
        const result = compare(evaluation, scenarioEvaluations[bestIndices[0]]);
        if (result === 1) {
          return bestIndices;
        }
        if (result === -1) {
          return [index];
        }
        return bestIndices.includes(index) ? bestIndices : [...bestIndices, index];
      },
      [0],
    );
    const isTie = bestHandIndices.length > 1;
    bestHandIndices.forEach((holeCardsIndex) => {
      accum[holeCardsIndex][isTie ? 'ties' : 'wins'] += 1;
    });
    return accum;
  }, allHoleCards.map(() => ({ wins: 0, ties: 0, total: scenarioCount })) as Odds[]);
};
