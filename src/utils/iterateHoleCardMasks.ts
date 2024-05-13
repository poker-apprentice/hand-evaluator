import { iterateCardMasks } from './iterateCardMasks';

// eslint-disable-next-line jsdoc/require-jsdoc
export function* iterateHoleCardMasks(
  allHoleCardMasks: bigint[],
  deadCardsMask: bigint,
  expectedHoleCardCount: number,
): Generator<bigint[], void> {
  if (allHoleCardMasks.length === 0) {
    return;
  }

  const [holeCardsMask, ...allRemainingHoleCardMasks] = allHoleCardMasks;

  const cardMasks = iterateCardMasks(holeCardsMask, deadCardsMask, expectedHoleCardCount);

  if (allRemainingHoleCardMasks.length > 0) {
    for (const cardMask of cardMasks) {
      for (const remainingHoleCardMasks of iterateHoleCardMasks(
        allRemainingHoleCardMasks,
        cardMask | deadCardsMask,
        expectedHoleCardCount,
      )) {
        yield [cardMask, ...remainingHoleCardMasks];
      }
    }
  } else {
    for (const cardMask of cardMasks) {
      yield [cardMask];
    }
  }
}
