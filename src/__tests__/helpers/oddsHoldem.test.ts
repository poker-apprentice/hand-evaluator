import * as oddsModule from '../../odds';
import { oddsHoldem } from '../../helpers/oddsHoldem';
import { Card, Hand } from '../../types';

describe('oddsHoldem', () => {
  it('delegates to `odds`', () => {
    const oddsSpy = jest.spyOn(oddsModule, 'odds');
    const allHoleCards: Hand[] = [
      ['As', 'Kd'],
      ['Jd', 'Jh'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    oddsHoldem(allHoleCards, communityCards);
    expect(oddsSpy).toHaveBeenCalledWith(allHoleCards, {
      communityCards,
      expectedCommunityCardCount: 5,
      expectedHoleCardCount: 2,
      minimumHoleCardsUsed: 0,
      maximumHoleCardsUsed: 2,
    });
  });

  it('throws if too many hole cards are provided', () => {
    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ks'],
      ['Jd', 'Jh'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    expect(() => oddsHoldem(allHoleCards, communityCards)).toThrow(
      'Each collection of hole cards accept a maximum of 2 elements',
    );
  });

  it('throws if too many community cards are provided', () => {
    const allHoleCards: Hand[] = [
      ['As', 'Kd'],
      ['Jd', 'Jh'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s', 'Td'];

    expect(() => oddsHoldem(allHoleCards, communityCards)).toThrow(
      'communityCards accepts a maximum of 5 elements',
    );
  });
});
