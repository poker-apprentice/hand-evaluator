import { Hand } from '@poker-apprentice/types';
import * as equityModule from '../../equity';
import { InvalidHoleCardCountError } from '../../errors';
import { equityStud } from '../../helpers/equityStud';

describe('equityStud', () => {
  it('delegates to `equity`', () => {
    const equitySpy = jest.spyOn(equityModule, 'equity');
    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts', 'Td', '2d', '5c', '5h'],
      ['Jd', 'Jh', '2h', 'Jc', '2s', '3c', '4h'],
    ];

    equityStud(allHoleCards);
    expect(equitySpy).toHaveBeenCalledWith(allHoleCards, {
      communityCards: [],
      expectedCommunityCardCount: 0,
      expectedHoleCardCount: 7,
      minimumHoleCardsUsed: 0,
      maximumHoleCardsUsed: 7,
    });
  });

  it('throws if too many hole cards are provided', () => {
    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts', 'Td', '2d', '5c', '5h', '2s'],
      ['Jd', 'Jh', '2h', 'Jc', '2s', '3c', '4h', '5d'],
    ];

    expect(() => equityStud(allHoleCards)).toThrow(InvalidHoleCardCountError);
  });
});
