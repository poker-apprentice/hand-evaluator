import * as oddsAsyncModule from '../../oddsAsync';
import { oddsStudAsync } from '../../helpers/oddsStudAsync';
import { Hand } from '../../types';

describe('oddsStudAsync', () => {
  const callback = () => {};

  it('delegates to `oddsAsync`', () => {
    const oddsAsyncSpy = jest.spyOn(oddsAsyncModule, 'oddsAsync');

    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts', 'Td', '2d', '5c', '5h'],
      ['Jd', 'Jh', '2h', 'Jc', '2s', '3c', '4h'],
    ];

    const abort = oddsStudAsync({ allHoleCards, callback });
    abort();

    expect(oddsAsyncSpy).toHaveBeenCalledWith({
      allHoleCards,
      communityCards: [],
      expectedCommunityCardCount: 0,
      expectedHoleCardCount: 7,
      minimumHoleCardsUsed: 0,
      maximumHoleCardsUsed: 7,
      callback,
    });
  });

  it('throws if too many hole cards are provided', () => {
    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts', 'Td', '2d', '5c', '5h', '2s'],
      ['Jd', 'Jh', '2h', 'Jc', '2s', '3c', '4h', '5d'],
    ];

    expect(() => oddsStudAsync({ allHoleCards, callback })).toThrow(
      'Each collection of hole cards accept a maximum of 7 elements',
    );
  });
});
