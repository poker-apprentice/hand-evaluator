import { Card, Hand } from '@poker-apprentice/types';
import { InvalidCommunityCardCountError, InvalidHoleCardCountError } from '../../errors';
import { simulateHoldem } from '../../helpers/simulateHoldem';
import * as simulateModule from '../../simulate';

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
      InvalidHoleCardCountError,
    );
  });

  it('throws if too many community cards are provided', () => {
    const allHoleCards: Hand[] = [
      ['As', 'Kd'],
      ['Jd', 'Jh'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s', 'Td'];

    expect(() => simulateHoldem({ allHoleCards, communityCards })).toThrow(
      InvalidCommunityCardCountError,
    );
  });
});
