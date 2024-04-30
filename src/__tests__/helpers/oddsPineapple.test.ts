import { Card, Hand } from '@poker-apprentice/types';
import { oddsPineapple } from '../../helpers/oddsPineapple';
import * as oddsModule from '../../odds';

describe('oddsPineapple', () => {
  it('delegates to `odds`', () => {
    const oddsSpy = jest.spyOn(oddsModule, 'odds');
    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts'],
      ['Jd', 'Jh', '2h'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    oddsPineapple(allHoleCards, communityCards);
    expect(oddsSpy).toHaveBeenCalledWith(allHoleCards, {
      communityCards,
      expectedCommunityCardCount: 5,
      expectedHoleCardCount: 3,
      minimumHoleCardsUsed: 0,
      maximumHoleCardsUsed: 2,
    });
  });

  it('throws if too many hole cards are provided', () => {
    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts', 'Td'],
      ['Jd', 'Jh', '2h', '5c'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    expect(() => oddsPineapple(allHoleCards, communityCards)).toThrow(
      'Each collection of hole cards accept a maximum of 3 elements',
    );
  });

  it('throws if too many community cards are provided', () => {
    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts'],
      ['Jd', 'Jh', '2h'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s', 'Td'];

    expect(() => oddsPineapple(allHoleCards, communityCards)).toThrow(
      'communityCards accepts a maximum of 5 elements',
    );
  });
});
