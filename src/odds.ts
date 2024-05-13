import { Card, Hand } from '@poker-apprentice/types';
import { Odds } from './types';
import { getHandMask } from './utils/getHandMask';
import { getHandValueMask } from './utils/getHandValueMask';
import { iterateCardMasks } from './utils/iterateCardMasks';
import { iterateHoleCardMasks } from './utils/iterateHoleCardMasks';

export interface OddsOptions {
  communityCards: Card[];
  deadCards?: Card[];
  expectedCommunityCardCount: number;
  expectedHoleCardCount: number;
  minimumHoleCardsUsed: number;
  maximumHoleCardsUsed: number;
}

export const odds = (allHoleCards: Hand[], options: OddsOptions): Odds[] => {
  let total = 0;

  const odds: Odds[] = allHoleCards.map(() => ({ wins: 0, ties: 0, total: 0, equity: 0 }));

  const initialDeadCardsMask = getHandMask([
    ...allHoleCards.reduce((acc, cards) => [...acc, ...cards]),
    ...options.communityCards,
    ...(options.deadCards ?? []),
  ]);

  const allHoleCardMasksIterator = iterateHoleCardMasks(
    allHoleCards.map(getHandMask),
    initialDeadCardsMask,
    options.expectedHoleCardCount,
  );

  for (const allHoleCardMasks of allHoleCardMasksIterator) {
    const currentDeadCardsMask = allHoleCardMasks.reduce(
      (acc, mask) => acc | mask,
      initialDeadCardsMask,
    );

    const boardMasks = iterateCardMasks(
      getHandMask(options.communityCards),
      currentDeadCardsMask,
      options.expectedCommunityCardCount,
    );

    for (const boardMask of boardMasks) {
      let handMask = allHoleCardMasks[0] | boardMask;
      let bestHandValue = getHandValueMask(handMask);
      let bestHandIndices = new Set([0]);

      for (let i = 1; i < allHoleCardMasks.length; i += 1) {
        handMask = allHoleCardMasks[i] | boardMask;
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
      for (let i = 0; i < allHoleCardMasks.length; i += 1) {
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

    for (let i = 0; i < allHoleCardMasks.length; i += 1) {
      odds[i].total = total;
      odds[i].equity = (odds[i].wins + odds[i].equity) / odds[i].total;
    }
  }

  return odds;
};
