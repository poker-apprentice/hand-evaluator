import { Card, Hand } from '@poker-apprentice/types';
import { Odds } from './types';
import { getHandMask } from './utils/getHandMask';
import { getHandValueMask } from './utils/getHandValueMask';
import { iterateCardMasks } from './utils/iterateCardMasks';

export interface OddsOptions {
  communityCards: Card[];
  deadCards?: Card[];
  expectedCommunityCardCount: number;
  expectedHoleCardCount: number;
  minimumHoleCardsUsed: number;
  maximumHoleCardsUsed: number;
}

export const odds = (allHoleCards: Hand[], options: OddsOptions): Odds[] => {
  const odds: Odds[] = allHoleCards.map(() => ({ wins: 0, ties: 0, total: 0, equity: 0 }));

  const allDeadCardsMask = [
    ...allHoleCards.reduce((acc, cards) => [...acc, ...cards]),
    ...options.communityCards,
    ...(options.deadCards ?? []),
  ];

  // TODO: We're not using options.minimumHoleCardsUsed, options.maximumHoleCardsUsed,
  //       options.expectedHoleCardCount, or ~options.expectedCommunityCardCount~.
  // TODO: This only iterates community cards, which won't work for games like stud where
  //       there are no community cards (i.e.: cards must be added to players' hands).
  // Resolving both of these TODO items will require having a for-loop similar to the
  // boardMasks loop over `iterateCardMasks`, but one that iterates over `allHoleCards`,
  // which in turn calls `iterateCardMasks` as well.  We'll basically need to construct
  // masks based upon the hole cards that are selected to be iterated over.
  const boardMasks = iterateCardMasks(
    getHandMask(options.communityCards),
    getHandMask(allDeadCardsMask),
    options.expectedCommunityCardCount,
  );

  let total = 0;

  for (const boardMask of boardMasks) {
    let handMask = getHandMask(allHoleCards[0]) | boardMask;
    let bestHandValue = getHandValueMask(handMask);
    let bestHandIndices = new Set([0]);

    for (let i = 1; i < allHoleCards.length; i += 1) {
      handMask = getHandMask(allHoleCards[i]) | boardMask;
      const currentHandValue = getHandValueMask(handMask);
      if (currentHandValue > bestHandValue) {
        bestHandValue = currentHandValue;
        bestHandIndices = new Set([i]);
      } else if (currentHandValue === bestHandValue) {
        bestHandIndices.add(i);
      }
    }

    const isTie = bestHandIndices.size > 1;
    const equity = isTie ? 1 / bestHandIndices.size : 1;
    for (let i = 0; i < allHoleCards.length; i += 1) {
      if (bestHandIndices.has(i)) {
        if (isTie) {
          odds[i].ties += 1;
          odds[i].equity += equity;
        } else {
          odds[i].wins += 1;
        }
      }
    }

    total += 1;
  }

  for (let i = 0; i < allHoleCards.length; i += 1) {
    odds[i].total = total;
    odds[i].equity = (odds[i].wins + odds[i].equity) / odds[i].total;
  }

  return odds;
};
