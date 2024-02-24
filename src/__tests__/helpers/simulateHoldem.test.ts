import { Card, Hand } from '@poker-apprentice/types';
import * as simulateModule from '../../simulate';
import { simulateHoldem } from '../../helpers/simulateHoldem';

describe('simulateHoldem', () => {
  it('delegates to `simulate`', () => {
    const simulateSpy = jest.spyOn(simulateModule, 'simulate');

    const allHoleCards: Hand[] = [
      ['As', 'Kd'],
      ['Jd', 'Jh'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    const generate = simulateHoldem({ allHoleCards, communityCards });
    generate.next();

    expect(simulateSpy).toHaveBeenCalledWith({
      allHoleCards,
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

    expect(() => simulateHoldem({ allHoleCards, communityCards })).toThrow(
      'Each collection of hole cards accept a maximum of 2 elements',
    );
  });

  it('throws if too many community cards are provided', () => {
    const allHoleCards: Hand[] = [
      ['As', 'Kd'],
      ['Jd', 'Jh'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s', 'Td'];

    expect(() => simulateHoldem({ allHoleCards, communityCards })).toThrow(
      'communityCards accepts a maximum of 5 elements',
    );
  });
});
