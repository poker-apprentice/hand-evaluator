import { Card, Hand } from '@poker-apprentice/types';
import * as simulateModule from '../../simulate';
import { simulateOmaha } from '../../helpers/simulateOmaha';

describe('simulateOmaha', () => {
  const callback = () => {};

  it('delegates to `simulate`', () => {
    const simulateSpy = jest.spyOn(simulateModule, 'simulate');

    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts', 'Td'],
      ['Jd', 'Jh', '2h', '5c'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    const abort = simulateOmaha({ allHoleCards, communityCards, callback });
    abort();

    expect(simulateSpy).toHaveBeenCalledWith({
      allHoleCards,
      communityCards,
      expectedCommunityCardCount: 5,
      expectedHoleCardCount: 4,
      minimumHoleCardsUsed: 2,
      maximumHoleCardsUsed: 2,
      callback,
    });
  });

  it('throws if too many hole cards are provided', () => {
    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts', 'Td'],
      ['Jd', 'Jh', '2h', '5c', '2c'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    expect(() => simulateOmaha({ allHoleCards, communityCards, callback })).toThrow(
      'Each collection of hole cards accept a maximum of 4 elements',
    );
  });

  it('throws if too many community cards are provided', () => {
    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts', 'Td'],
      ['Jd', 'Jh', '2h', '5c'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s', 'Td'];

    expect(() => simulateOmaha({ allHoleCards, communityCards, callback })).toThrow(
      'communityCards accepts a maximum of 5 elements',
    );
  });
});
