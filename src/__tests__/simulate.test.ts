import { Card, Hand } from '@poker-apprentice/types';
import { odds } from '../odds';
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

  it('evaluates multiple samples per update when requested', () => {
    const generate = simulate({ ...options, samplesPerUpdate: 500 });
    expect(generate.next().value[0].total).toEqual(500);
    expect(generate.next().value[0].total).toEqual(1000);
  });

  it('converges toward the exact odds', () => {
    const exact = odds(allHoleCards, options);

    const generate = simulate({ ...options, samplesPerUpdate: 20000 });
    const results = generate.next().value;

    // 20,000 samples have a standard error around 0.25%; a 3% tolerance keeps this test from
    // ever flaking while still catching systematic bias.
    results.forEach((result, index) => {
      expect(result.equity).toBeGreaterThan(exact[index].equity - 0.03);
      expect(result.equity).toBeLessThan(exact[index].equity + 0.03);
    });

    const totalEquity = results.reduce((sum, result) => sum + result.equity, 0);
    expect(totalEquity).toBeCloseTo(1, 12);
  });
});
