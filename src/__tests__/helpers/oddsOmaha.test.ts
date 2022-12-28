import * as oddsModule from '../../odds';
import { oddsOmaha } from '../../helpers/oddsOmaha';
import { Card, Hand } from '../../types';

describe('oddsOmaha', () => {
  it('delegates to `odds`', () => {
    const oddsSpy = jest.spyOn(oddsModule, 'odds');
    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts', 'Td'],
      ['Jd', 'Jh', '2h', '5c'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    oddsOmaha(allHoleCards, communityCards);
    expect(oddsSpy).toHaveBeenCalledWith(allHoleCards, {
      communityCards,
      expectedCommunityCardCount: 5,
      expectedHoleCardCount: 4,
      minimumHoleCardsUsed: 2,
      maximumHoleCardsUsed: 2,
    });
  });

  it('throws if too many hole cards are provided', () => {
    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts', 'Td'],
      ['Jd', 'Jh', '2h', '5c', '2c'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    expect(() => oddsOmaha(allHoleCards, communityCards)).toThrow(
      'Each collection of hole cards accept a maximum of 4 elements',
    );
  });

  it('throws if too many community cards are provided', () => {
    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts', 'Td'],
      ['Jd', 'Jh', '2h', '5c'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s', 'Td'];

    expect(() => oddsOmaha(allHoleCards, communityCards)).toThrow('communityCards accepts a maximum of 5 elements');
  });
});
