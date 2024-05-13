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
    for (let i = 0; i < 3; i += 1) {
      const { value: odds } = generate.next();
      expect(odds[0].total).toEqual(i + 1);
      expect(odds.reduce((acc, current) => acc + current.equity, 0)).toBe(1);
    }
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
