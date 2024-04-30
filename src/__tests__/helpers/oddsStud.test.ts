import { Hand } from '@poker-apprentice/types';
import { oddsStud } from '../../helpers/oddsStud';
import * as oddsModule from '../../odds';

describe('oddsStud', () => {
  it('delegates to `odds`', () => {
    const oddsSpy = jest.spyOn(oddsModule, 'odds');
    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts', 'Td', '2d', '5c', '5h'],
      ['Jd', 'Jh', '2h', 'Jc', '2s', '3c', '4h'],
    ];

    oddsStud(allHoleCards);
    expect(oddsSpy).toHaveBeenCalledWith(allHoleCards, {
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

    expect(() => oddsStud(allHoleCards)).toThrow(
      'Each collection of hole cards accept a maximum of 7 elements',
    );
  });
});
