import { Card, Hand } from '@poker-apprentice/types';
import { simulatePineapple } from '../../helpers/simulatePineapple';
import * as simulateModule from '../../simulate';

describe('simulatePineapple', () => {
  it('delegates to `simulate`', () => {
    const simulateSpy = jest.spyOn(simulateModule, 'simulate');

    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts'],
      ['Jd', 'Jh', '2h'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    const generate = simulatePineapple({ allHoleCards, communityCards });
    generate.next();

    expect(simulateSpy).toHaveBeenCalledWith({
      allHoleCards,
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

    expect(() => simulatePineapple({ allHoleCards, communityCards })).toThrow(
      'Each collection of hole cards accept a maximum of 3 elements',
    );
  });

  it('throws if too many community cards are provided', () => {
    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts'],
      ['Jd', 'Jh', '2h'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s', 'Td'];

    expect(() => simulatePineapple({ allHoleCards, communityCards })).toThrow(
      'communityCards accepts a maximum of 5 elements',
    );
  });
});
