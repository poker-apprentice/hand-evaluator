// A frozen copy of the v3 `evaluateHand` implementation from `src/evaluate.ts`, kept as an
// independent oracle for cross-validating the integer evaluation core (`src/core/rank.ts`).
// Do not refactor this file to share code with production sources; its value is that it cannot
// drift along with them.
import { Card, HandStrength, Rank, Suit, getRank, getSuit } from '@poker-apprentice/types';
import { compare } from '../../compare';
import { rankOrder } from '../../constants';
import { EvaluatedHand } from '../../types';
import { cardComparator } from '../../utils/cardComparator';
import { getCombinations } from '../../utils/getCombinations';
import { handComparator } from '../../utils/handComparator';

const HAND_SIZE = 5;

const uniq = <T>(items: T[]) => Array.from(new Set(items));

const getStraights = (cards: Card[]): Card[][] => {
  const straights: Card[][] = [];

  // allow ace to be treated as high or low
  const lastAceIndex = cards.findLastIndex((card) => getRank(card) === 'A');
  const adjustedCards =
    lastAceIndex === -1 ? cards : [...cards, ...cards.slice(0, lastAceIndex + 1)];

  for (let i = 0; i < adjustedCards.length - HAND_SIZE + 1; i += 1) {
    const currentHands: Card[][] = [[adjustedCards[i]]];
    for (let j = i + 1; j < adjustedCards.length; j += 1) {
      const card = adjustedCards[j];
      const rank = getRank(card);
      const lastRank = getRank(currentHands[0][currentHands[0].length - 1]);

      if (currentHands[0].length < HAND_SIZE) {
        if (rank === lastRank) {
          const newHand = currentHands[0].slice(0, -1);
          newHand.push(card);
          currentHands.push(newHand);
        } else if (rankOrder.indexOf(rank) === rankOrder.indexOf(lastRank) - 1) {
          currentHands.forEach((currentHand) => currentHand.push(card));
        } else if (
          rankOrder.indexOf(rank) === rankOrder.length - 1 &&
          rankOrder.indexOf(lastRank) === 0
        ) {
          currentHands.forEach((currentHand) => currentHand.push(card));
        }
      }
    }
    straights.push(...currentHands.filter((hand) => hand.length === HAND_SIZE));
  }

  return straights.sort(handComparator);
};

const getDuplicates = (cards: Card[]): Map<Rank, Card[]> => {
  const duplicates: Map<Rank, Card[]> = new Map();
  cards.forEach((card) => {
    const rank = getRank(card);
    const current = duplicates.get(rank) ?? [];
    current.push(card);
    duplicates.set(rank, current);
  });
  return duplicates;
};

const getCardsOfLength = <T>(cardGroups: Map<T, Card[]>, count: number): Card[][] => {
  const values = [...cardGroups.values()];
  return values.filter((cards) => cards.length === count).sort(handComparator);
};

const getFlushes = (cards: Card[]): Card[][] => {
  const suitedCards: Map<Suit, Card[]> = new Map();
  cards.forEach((card) => {
    const suit = getSuit(card);
    const current = suitedCards.get(suit) ?? [];
    current.push(card);
    suitedCards.set(suit, current);
  });

  suitedCards.forEach((current) => {
    current.splice(HAND_SIZE);
  });

  return getCardsOfLength(suitedCards, HAND_SIZE);
};

const getKickers = (hand: Card[], allCards: Card[]) => {
  const kickerCount = HAND_SIZE - hand.length;
  return allCards.filter((card) => !hand.includes(card)).slice(0, kickerCount);
};

/**
 * Evaluates the best 5-card hand makeable from the provided cards, exactly as v3 did.
 * @param {Card[]} unsortedCards The cards to evaluate (5 or more).
 * @returns {EvaluatedHand} The strength and best 5-card hand.
 */
export const referenceEvaluate = (unsortedCards: Card[]): EvaluatedHand => {
  const cards = unsortedCards.slice().sort(cardComparator);
  const straights = getStraights(cards);

  // straight flush/royal flush
  const straightFlushes = straights.filter((straight) => uniq(straight.map(getSuit)).length === 1);
  if (straightFlushes.length > 0) {
    const strength =
      getRank(straightFlushes[0][0]) === 'A' ? HandStrength.RoyalFlush : HandStrength.StraightFlush;
    return { strength, hand: straightFlushes[0] };
  }

  const duplicates: Map<Rank, Card[]> = getDuplicates(cards);

  // four of a kind
  const allQuads = getCardsOfLength(duplicates, 4);
  if (allQuads.length > 0) {
    const quads = allQuads[0];
    const kickers = getKickers(quads, cards);
    return { strength: HandStrength.FourOfAKind, hand: [...quads, ...kickers] };
  }

  // full house (via trips and a pair)
  const allTrips = getCardsOfLength(duplicates, 3);
  const allPairs = getCardsOfLength(duplicates, 2);

  if (allTrips.length > 0 && allPairs.length > 0) {
    return { strength: HandStrength.FullHouse, hand: [...allTrips[0], ...allPairs[0]] };
  }

  // full house (via trips twice)
  if (allTrips.length >= 2) {
    allTrips.sort((a, b) => cardComparator(a[0], b[0]));
    return { strength: HandStrength.FullHouse, hand: [...allTrips[0], ...allTrips[1].slice(0, 2)] };
  }

  // flush
  const flushes = getFlushes(cards);
  if (flushes.length > 0) {
    return { strength: HandStrength.Flush, hand: flushes[0] };
  }

  // straight
  if (straights.length > 0) {
    return { strength: HandStrength.Straight, hand: straights[0] };
  }

  // three of a kind
  if (allTrips.length > 0) {
    const trips = allTrips[0];
    const kickers = getKickers(trips, cards);
    return { strength: HandStrength.ThreeOfAKind, hand: [...trips, ...kickers] };
  }

  // two pair
  if (allPairs.length >= 2) {
    const twoPair = [...allPairs[0], ...allPairs[1]];
    const kickers = getKickers(twoPair, cards);
    return { strength: HandStrength.TwoPair, hand: [...twoPair, ...kickers] };
  }

  // one pair
  if (allPairs.length > 0) {
    const pair = allPairs[0];
    const kickers = getKickers(pair, cards);
    return { strength: HandStrength.OnePair, hand: [...pair, ...kickers] };
  }

  // high card
  return { strength: HandStrength.HighCard, hand: getKickers([], cards) };
};

/**
 * Evaluates the best 5-card hand makeable from the provided cards by exhaustively evaluating
 * every 5-card subset with the v3 evaluator.  The v3 evaluator is only fully correct for
 * exactly 5 cards: given more, its straight detection can drop a duplicate-rank suit variant
 * and miss a straight flush (e.g. it reports Kh-Qh-Jh-Th-9h-9d-3s as a flush).  Evaluating
 * subsets sidesteps that bug, making this the preferred oracle for 6- and 7-card hands.
 * @param {Card[]} cards The cards to evaluate (5 or more).
 * @returns {EvaluatedHand} The strength and best 5-card hand.
 */
export const referenceBest = (cards: Card[]): EvaluatedHand => {
  if (cards.length === 5) {
    return referenceEvaluate(cards);
  }
  return getCombinations(cards, 5).map(referenceEvaluate).sort(compare)[0];
};

/**
 * Compares two reference evaluations, exactly as v3's `compare` did: -1 when `a` is stronger,
 * 1 when `b` is stronger, 0 when equal.
 * @param {EvaluatedHand} a The first evaluated hand.
 * @param {EvaluatedHand} b The second evaluated hand.
 * @returns {number} The comparison result.
 */
export const referenceCompare = (a: EvaluatedHand, b: EvaluatedHand): number => compare(a, b);
