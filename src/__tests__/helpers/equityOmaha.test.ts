import { Card, Hand } from '@poker-apprentice/types';
import * as equityModule from '../../equity';
import { InvalidCommunityCardCountError, InvalidHoleCardCountError } from '../../errors';
import { equityOmaha } from '../../helpers/equityOmaha';

describe('equityOmaha', () => {
  it('delegates to `equity`', () => {
    const equitySpy = jest.spyOn(equityModule, 'equity');
    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts', 'Td'],
      ['Jd', 'Jh', '2h', '5c'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    equityOmaha(allHoleCards, communityCards);
    expect(equitySpy).toHaveBeenCalledWith(allHoleCards, {
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

    expect(() => equityOmaha(allHoleCards, communityCards)).toThrow(InvalidHoleCardCountError);
  });

  it('throws if too many community cards are provided', () => {
    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts', 'Td'],
      ['Jd', 'Jh', '2h', '5c'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s', 'Td'];

    expect(() => equityOmaha(allHoleCards, communityCards)).toThrow(InvalidCommunityCardCountError);
  });
});
