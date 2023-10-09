import { Card, Hand } from '../types';

interface Options {
  allHoleCards: Hand[];
  communityCards: Card[];
  expectedCommunityCardCount: number;
  expectedHoleCardCount: number;
}

export const getRemainingCardCount = ({
  allHoleCards,
  communityCards,
  expectedCommunityCardCount,
  expectedHoleCardCount,
}: Options) => {
  const remainingHoleCardCount = Math.max(
    0,
    allHoleCards.reduce(
      (count, holeCards) => count + (expectedHoleCardCount - holeCards.length),
      0,
    ),
  );
  const remainingCommunityCardCount = Math.max(
    0,
    expectedCommunityCardCount - communityCards.length,
  );
  return remainingHoleCardCount + remainingCommunityCardCount;
};
