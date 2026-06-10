import { Card } from '@poker-apprentice/types';
import { compare } from './compare';
import { handToIds } from './core/cards';
import { GamePlan, compilePlan } from './core/plan';
import { WORST_RANK, handStrengthFromRank, rankN } from './core/rank';
import { evaluateHand, getAllHandCombinations } from './describe/legacyEvaluate';
import { EvaluatedHand } from './types';
import { getCombinations } from './utils/getCombinations';

export interface EvaluateOptions {
  holeCards: Card[];
  communityCards?: Card[];
  minimumHoleCards?: number;
  maximumHoleCards?: number;
}

const HAND_SIZE = 5;

// v3 evaluation path: enumerate every candidate combination and describe each one.  Used when
// the lookup-table core cannot apply: fewer than 5 total cards, or constraints under which
// only partial (sub-5-card) hands can be formed.
const evaluateLegacy = (options: Required<EvaluateOptions>): EvaluatedHand =>
  getAllHandCombinations(options).map(evaluateHand).sort(compare)[0];

/**
 * Determines the best 5-card hand makeable from the provided hole and community cards, given
 * the hole-card usage constraints of the game being played.
 * @param {EvaluateOptions} options The cards available and usage constraints.
 * @returns {EvaluatedHand} The strength and cards of the best hand.
 */
export const evaluate = ({
  holeCards,
  communityCards = [],
  ...options
}: EvaluateOptions): EvaluatedHand => {
  const minimumHoleCards = Math.max(0, options.minimumHoleCards ?? 0);
  const maximumHoleCards = Math.min(
    holeCards.length,
    options.maximumHoleCards ?? holeCards.length,
    HAND_SIZE,
  );

  if (holeCards.length === 0 && communityCards.length === 0) {
    throw new Error('Must supply at least one holeCard or communityCard');
  }
  if (minimumHoleCards > holeCards.length) {
    throw new Error('minimumHoleCards cannot be greater than number of supplied hole cards');
  }
  if (minimumHoleCards > maximumHoleCards) {
    throw new Error('minimumHoleCards cannot be greater than maximumHoleCards');
  }
  if (maximumHoleCards <= 0) {
    throw new Error('maximumHoleCards cannot be less then or equal to zero');
  }

  let plan: GamePlan;
  try {
    plan = compilePlan(holeCards.length, communityCards.length, minimumHoleCards, maximumHoleCards);
  } catch {
    // Fewer than 5 cards total (or constraints that only permit partial hands): evaluate the
    // partial-hand combinations exactly as v3 did.
    return evaluateLegacy({ holeCards, communityCards, minimumHoleCards, maximumHoleCards });
  }

  const holeIds = handToIds(holeCards);
  const boardIds = handToIds(communityCards);

  // Find the best candidate card set permitted by the plan.  Candidates are visited in the
  // same order v3 enumerated them, so rank ties resolve to the same cards v3 returned.
  let bestRank = WORST_RANK + 1;
  let bestCards: Card[] = [];

  if (plan.mode === 'single') {
    bestRank = rankN([...holeIds, ...boardIds], holeIds.length + boardIds.length);
    bestCards = [...holeCards, ...communityCards];
  } else if (plan.mode === 'holeSubsets') {
    plan.holeSubsets.forEach((subset) => {
      const ids = subset.map((index) => holeIds[index]).concat(boardIds);
      const rank = rankN(ids, ids.length);
      if (rank < bestRank) {
        bestRank = rank;
        bestCards = subset.map((index) => holeCards[index]).concat(communityCards);
      }
    });
  } else {
    plan.pairedSubsets.forEach(({ holeIndexes, boardIndexes }) => {
      const ids = holeIndexes
        .map((index) => holeIds[index])
        .concat(boardIndexes.map((index) => boardIds[index]));
      const rank = rankN(ids, HAND_SIZE);
      if (rank < bestRank) {
        bestRank = rank;
        bestCards = holeIndexes
          .map((index) => holeCards[index])
          .concat(boardIndexes.map((index) => communityCards[index]));
      }
    });
  }

  const described = evaluateHand(bestCards);
  if (described.strength === handStrengthFromRank(bestRank)) {
    return described;
  }

  // The legacy describe logic missed the hand the integer core found (it can overlook a
  // straight flush in hands of more than 5 cards); describe the exact 5 cards instead.
  const fiveCardSets = getCombinations(bestCards, HAND_SIZE);
  for (let i = 0; i < fiveCardSets.length; i += 1) {
    if (rankN(handToIds(fiveCardSets[i]), HAND_SIZE) === bestRank) {
      return evaluateHand(fiveCardSets[i]);
    }
  }
  return described;
};
