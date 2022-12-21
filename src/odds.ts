import { rankOrder } from './constants';
import { Card, Hand } from './types';

interface Options {
  communityCards: Card[];
  expectedCommunityCardCount: number;
  expectedHoleCardCount: number;
}

interface HelperOptions extends Options {
  remainingCards: Card[];
}

const allCards: Card[] = rankOrder
  .split('')
  .flatMap((rank) => ['c', 'd', 'h', 's'].map((suit) => `${rank}${suit}` as Card));

const oddsHelper = (
  hands: Hand[],
  { communityCards, expectedCommunityCardCount, expectedHoleCardCount, remainingCards }: HelperOptions,
): number[] => {
  // 1. While communityCards.length < expectedCommunityCardCount & each
  //    hands.length < expectedHoleCardCount, loop through each possible
  //    `remainingCards` entry and assign it to each empty card position.
  //    Use the `compare` function to determine the best hand(s).  (Note
  //    there will be some ties.)

  // 2. Return an array of numbers.  The array index represents the same
  //    `hands` index provided to the function.  Each number represents
  //    the calculated odds of that hand winning.
  return [];
};

export const odds = (
  hands: Hand[],
  { communityCards, expectedCommunityCardCount, expectedHoleCardCount }: Options,
): number[] => {
  // 1. TODO: determine all the possible remaining cards in the deck based
  //    upon the accounted for cards in `hands` and `communityCards`.
  const remainingCards: Card[] = [];

  // 2. TODO: call `oddsHelper` with all options & `remainingCards` value,
  //    returning the value.
  return oddsHelper(hands, {
    communityCards,
    expectedCommunityCardCount,
    expectedHoleCardCount,
    remainingCards,
  });
};
