import uniq from 'lodash/uniq';
import { rankOrder } from './constants';
import { Card, EvaluatedHand, Rank, Strength, Suit } from './types';
import { cardComparator } from './utils/cardComparator';
import { getRank } from './utils/getRank';
import { getSuit } from './utils/getSuit';
import { handComparator } from './utils/handComparator';

const HAND_SIZE = 5;

const getStraights = (cards: Card[]): Card[][] => {
  const straights: Card[][] = [];

  // allow ace to be treated as high or low
  const lastAceIndex = cards.findLastIndex((card) => getRank(card) === 'A');
  const adjustedCards = lastAceIndex === -1 ? cards : [...cards, ...cards.slice(0, lastAceIndex + 1)];

  for (let i = 0; i < adjustedCards.length - HAND_SIZE + 1; i += 1) {
    const currentHands: Card[][] = [[adjustedCards[i]]];
    for (let j = i + 1; j < adjustedCards.length; j += 1) {
      const card = adjustedCards[j];
      const rank = getRank(card);
      const lastRank = getRank(currentHands[0][currentHands[0].length - 1]);

      if (currentHands[0].length < HAND_SIZE) {
        if (rank === lastRank) {
          // If the current card is the same rank as the last card added, then append it
          // to the list of possible hands.
          const newHand = currentHands[0].slice(0, -1);
          newHand.push(card);
          currentHands.push(newHand);
        } else if (rankOrder.indexOf(rank) === rankOrder.indexOf(lastRank) - 1) {
          // If the current card is one rank lower than the last card, then append it
          // to all possible hands.
          currentHands.forEach((currentHand) => currentHand.push(card));
        } else if (rankOrder.indexOf(rank) === rankOrder.length - 1 && rankOrder.indexOf(lastRank) === 0) {
          // If the current card is an ace, and the last card was a deuce, then append it
          // to all possible hands.
          currentHands.forEach((currentHand) => currentHand.push(card));
        }
      }
    }
    straights.push(...currentHands.filter((hand) => hand.length === 5));
  }

  // order straights from biggest to smallest
  return straights.sort(handComparator);
};

const getDuplicates = (cards: Card[]): Record<Rank, Card[]> => {
  const duplicates: Record<Rank, Card[]> = {
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
    8: [],
    9: [],
    T: [],
    J: [],
    Q: [],
    K: [],
    A: [],
  };
  cards.forEach((card) => {
    duplicates[getRank(card)].push(card);
  });
  return duplicates;
};

const getFlushes = (cards: Card[]): Card[][] => {
  const suitedCards: Record<Suit, Card[]> = { c: [], d: [], h: [], s: [] };
  cards.forEach((card) => {
    suitedCards[getSuit(card)].push(card);
  });

  // only use the first 5 cards of the same suit to make up a hand
  (Object.keys(suitedCards) as Suit[]).forEach((suit) => {
    suitedCards[suit] = suitedCards[suit].slice(0, HAND_SIZE);
  });

  // only return flushes made up of a legitimate hand size
  return Object.values(suitedCards)
    .filter((hand) => hand.length === HAND_SIZE)
    .sort(handComparator);
};

const getKickers = (hand: Card[], allCards: Card[]) => {
  const kickerCount = HAND_SIZE - hand.length;
  return allCards.filter((card) => !hand.includes(card)).slice(0, kickerCount);
};

export const evaluate = (unsortedCards: Card[]): EvaluatedHand => {
  const cards = unsortedCards.sort(cardComparator);
  const straights = getStraights(cards);

  // straight flush/royal flush
  const straightFlushes = straights.filter((straight) => uniq(straight.map(getSuit)).length === 1);
  if (straightFlushes.length > 0) {
    const strength = getRank(straightFlushes[0][0]) === 'A' ? Strength.ROYAL_FLUSH : Strength.STRAIGHT_FLUSH;
    return { strength, hand: straightFlushes[0] };
  }

  const duplicates = getDuplicates(cards);

  // four of a kind
  const allQuads = Object.values(duplicates)
    .filter((hand) => hand.length === 4)
    .sort(handComparator);
  if (allQuads.length > 0) {
    const quads = allQuads[0];
    const kickers = getKickers(quads, cards);
    return { strength: Strength.FOUR_OF_A_KIND, hand: [...quads, ...kickers] };
  }

  // full house
  const allTrips = Object.values(duplicates)
    .filter((hand) => hand.length === 3)
    .sort(handComparator);
  const allPairs = Object.values(duplicates)
    .filter((hand) => hand.length === 2)
    .sort(handComparator);
  if (allTrips.length > 0 && allPairs.length > 0) {
    return { strength: Strength.FULL_HOUSE, hand: [...allTrips[0], ...allPairs[0]] };
  }

  // flush
  const flushes = getFlushes(cards);
  if (flushes.length > 0) {
    return { strength: Strength.FLUSH, hand: flushes[0] };
  }

  // straight
  if (straights.length > 0) {
    return { strength: Strength.STRAIGHT, hand: straights[0] };
  }

  // three of a kind
  if (allTrips.length > 0) {
    const trips = allTrips[0];
    const kickers = getKickers(trips, cards);
    return { strength: Strength.THREE_OF_A_KIND, hand: [...trips, ...kickers] };
  }

  // two pair
  if (allPairs.length >= 2) {
    const twoPair = [...allPairs[0], ...allPairs[1]];
    const kickers = getKickers(twoPair, cards);
    return { strength: Strength.TWO_PAIR, hand: [...twoPair, ...kickers] };
  }

  // one pair
  if (allPairs.length > 0) {
    const pair = allPairs[0];
    const kickers = getKickers(pair, cards);
    return { strength: Strength.ONE_PAIR, hand: [...pair, ...kickers] };
  }

  // high card
  return { strength: Strength.HIGH_CARD, hand: getKickers([], cards) };
};
