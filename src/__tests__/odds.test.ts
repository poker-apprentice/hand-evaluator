import { odds } from '../odds';
import { Hand } from '../types';

describe('odds', () => {
  it.skip('recognizes straights', () => {
    const hand1: Hand = ['As', 'Ks'];
    const hand2: Hand = ['Jd', 'Jh'];

    expect(
      odds([hand1, hand2], {
        communityCards: ['Qd', 'Js', '8d'],
        expectedCommunityCardCount: 5,
        expectedHoleCardCount: 2,
      }),
    ).toEqual([20, 80]);
  });
});
