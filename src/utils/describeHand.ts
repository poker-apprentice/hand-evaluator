import { Card, HandStrength } from '@poker-apprentice/types';
import { handToIds, rankOfId, suitOfId } from '../core/cards';
import { handStrengthFromRank, rankN } from '../core/rank';
import { EvaluatedHand } from '../types';
import { cardComparator } from './cardComparator';

const HAND_SIZE = 5;
const ACE_RANK = 12;

// Returns the cards grouped by rank, in descending rank order.  Cards within a group keep
// their relative order from the (stably) sorted input, which determines which suit is chosen
// when equally-ranked cards are interchangeable.
const groupByRank = (sortedCards: Card[], ids: number[]): Card[][] => {
  const groups: Card[][] = [];
  for (let i = 0; i < sortedCards.length; i += 1) {
    if (i > 0 && rankOfId(ids[i]) === rankOfId(ids[i - 1])) {
      groups[groups.length - 1].push(sortedCards[i]);
    } else {
      groups.push([sortedCards[i]]);
    }
  }
  return groups;
};

// Builds the canonical hand for group-based strengths (pairs through quads, and high cards):
// the primary groups first, then the highest remaining cards as kickers.
const fromGroups = (sortedCards: Card[], groups: Card[][], strength: HandStrength): Card[] => {
  const ofSize = (size: number): Card[][] => groups.filter((group) => group.length === size);
  const withKickers = (hand: Card[]): Card[] => [
    ...hand,
    ...sortedCards.filter((card) => !hand.includes(card)).slice(0, HAND_SIZE - hand.length),
  ];

  switch (strength) {
    case HandStrength.FourOfAKind:
      return withKickers(ofSize(4)[0]);
    case HandStrength.FullHouse: {
      // The pair is either the highest actual pair or, when the hand holds trips twice, the
      // first two cards of the lower trips (e.g. KKK55 from KKK + 555).
      const trips = ofSize(3);
      const pairs = ofSize(2);
      const pair = pairs.length > 0 ? pairs[0] : trips[1].slice(0, 2);
      return [...trips[0], ...pair];
    }
    case HandStrength.ThreeOfAKind:
      return withKickers(ofSize(3)[0]);
    case HandStrength.TwoPair: {
      const pairs = ofSize(2);
      return withKickers([...pairs[0], ...pairs[1]]);
    }
    case HandStrength.OnePair:
      return withKickers(ofSize(2)[0]);
    default:
      return sortedCards.slice(0, HAND_SIZE);
  }
};

// Builds a straight (or straight flush, when `suit` is provided) downward from its known high
// rank, picking the first card of each rank.  An ace serves as the low end of a wheel.
const fromStraight = (
  sortedCards: Card[],
  ids: number[],
  high: number,
  suit: number | null,
): Card[] => {
  const hand: Card[] = [];
  for (let offset = 0; offset < HAND_SIZE; offset += 1) {
    const rank = high - offset >= 0 ? high - offset : ACE_RANK;
    for (let i = 0; i < ids.length; i += 1) {
      if (rankOfId(ids[i]) === rank && (suit === null || suitOfId(ids[i]) === suit)) {
        hand.push(sortedCards[i]);
        break;
      }
    }
  }
  return hand;
};

// The strength of a hand of fewer than 5 cards, which can only be made of rank groups
// (straights and flushes require 5 cards).
const partialStrength = (groups: Card[][]): HandStrength => {
  const largest = Math.max(...groups.map((group) => group.length));
  if (largest === 4) return HandStrength.FourOfAKind;
  if (largest === 3) return HandStrength.ThreeOfAKind;
  if (largest === 2) {
    return groups.filter((group) => group.length === 2).length >= 2
      ? HandStrength.TwoPair
      : HandStrength.OnePair;
  }
  return HandStrength.HighCard;
};

/**
 * Determines the strength and canonical best-5-cards representation of a hand.  For 5 or more
 * cards, the hand's class comes from the integer evaluation core, and the returned cards are
 * constructed directly from it (e.g. a straight's known high card selects the run); fewer than
 * 5 cards are described from their rank groups alone.  Cards are returned in conventional
 * order: primary groups first, kickers descending, straights high-to-low (wheels as 5-4-3-2-A).
 * @param {Card[]} unsortedCards The cards to describe (1 to 7).
 * @returns {EvaluatedHand} The strength and best 5-card hand.
 */
export const describeHand = (unsortedCards: Card[]): EvaluatedHand => {
  const cards = unsortedCards.slice().sort(cardComparator);
  const ids = handToIds(cards);

  if (cards.length < HAND_SIZE) {
    const groups = groupByRank(cards, ids);
    const strength = partialStrength(groups);
    return { strength, hand: fromGroups(cards, groups, strength) };
  }

  const rank = rankN(ids, ids.length);
  const strength = handStrengthFromRank(rank);

  switch (strength) {
    case HandStrength.RoyalFlush:
    case HandStrength.StraightFlush:
    case HandStrength.Flush: {
      const suitCounts = [0, 0, 0, 0];
      ids.forEach((id) => {
        suitCounts[suitOfId(id)] += 1;
      });
      const suit = suitCounts.findIndex((count) => count >= HAND_SIZE);
      if (strength === HandStrength.Flush) {
        const hand = cards.filter((_card, i) => suitOfId(ids[i]) === suit).slice(0, HAND_SIZE);
        return { strength, hand };
      }
      // Straight-flush ranks run 1 (ace high) through 10 (five-high wheel).
      return { strength, hand: fromStraight(cards, ids, ACE_RANK - (rank - 1), suit) };
    }
    case HandStrength.Straight:
      // Straight ranks run 1600 (ace high) through 1609 (five-high wheel).
      return { strength, hand: fromStraight(cards, ids, ACE_RANK - (rank - 1600), null) };
    default:
      return { strength, hand: fromGroups(cards, groupByRank(cards, ids), strength) };
  }
};
