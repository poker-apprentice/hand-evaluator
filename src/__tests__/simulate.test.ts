import { Card, Hand } from '@poker-apprentice/types';
import { simulate } from '../simulate';

describe('simulate', () => {
  const allHoleCards: Hand[] = [
    ['As', 'Ks'],
    ['Jd', 'Jh'],
  ];
  const communityCards: Card[] = ['Qd', 'Js', '8d'];
  const options = {
    allHoleCards,
    communityCards,
    expectedCommunityCardCount: 5,
    expectedHoleCardCount: 2,
    minimumHoleCardsUsed: 0,
    maximumHoleCardsUsed: 2,
  };

  it('yields results the correct number of times', () => {
    const generate = simulate(options);
    expect(generate.next().value[0].total).toEqual(1);
    expect(generate.next().value[0].total).toEqual(2);
    expect(generate.next().value[0].total).toEqual(3);
  });

  it('returns after yielding the maximum number of possible times', () => {
    let count = 0;
    for (const _result of simulate(options)) {
      count += 1;
    }
    const remainingCardCount =
      52 - communityCards.length - allHoleCards.map((c) => c.length).reduce((a, c) => a + c, 0);
    const permutationCount = remainingCardCount * (remainingCardCount - 1);
    expect(count).toEqual(permutationCount);
  });
});
