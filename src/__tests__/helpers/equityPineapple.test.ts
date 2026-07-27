import { Card, Hand } from '@poker-apprentice/types';
import * as equityModule from '../../equity';
import { InvalidCommunityCardCountError, InvalidHoleCardCountError } from '../../errors';
import { equityPineapple } from '../../helpers/equityPineapple';

describe('equityPineapple', () => {
  it('delegates to `equity`', () => {
    const equitySpy = jest.spyOn(equityModule, 'equity');
    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts'],
      ['Jd', 'Jh', '2h'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    equityPineapple(allHoleCards, communityCards);
    expect(equitySpy).toHaveBeenCalledWith(allHoleCards, {
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

    expect(() => equityPineapple(allHoleCards, communityCards)).toThrow(InvalidHoleCardCountError);
  });

  it('throws if too many community cards are provided', () => {
    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts'],
      ['Jd', 'Jh', '2h'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s', 'Td'];

    expect(() => equityPineapple(allHoleCards, communityCards)).toThrow(
      InvalidCommunityCardCountError,
    );
  });
});
