import { Card, Hand } from '@poker-apprentice/types';
import { InvalidCommunityCardCountError, InvalidHoleCardCountError } from '../../errors';
import { simulateOmaha } from '../../helpers/simulateOmaha';
import * as simulateModule from '../../simulate';

describe('simulateOmaha', () => {
  it('delegates to `simulate`', () => {
    const simulateSpy = jest.spyOn(simulateModule, 'simulate');

    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts', 'Td'],
      ['Jd', 'Jh', '2h', '5c'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    const generate = simulateOmaha({ allHoleCards, communityCards });
    generate.next();

    expect(simulateSpy).toHaveBeenCalledWith({
      allHoleCards,
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

    expect(() => simulateOmaha({ allHoleCards, communityCards })).toThrow(
      InvalidHoleCardCountError,
    );
  });

  it('throws if too many community cards are provided', () => {
    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts', 'Td'],
      ['Jd', 'Jh', '2h', '5c'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s', 'Td'];

    expect(() => simulateOmaha({ allHoleCards, communityCards })).toThrow(
      InvalidCommunityCardCountError,
    );
  });
});
