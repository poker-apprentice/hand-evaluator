import * as oddsAsyncModule from '../../oddsAsync';
import { oddsOmahaAsync } from '../../helpers/oddsOmahaAsync';
import { Card, Hand } from '../../types';

describe('oddsOmahaAsync', () => {
  const callback = () => {};

  it('delegates to `oddsAsync`', () => {
    const oddsAsyncSpy = jest.spyOn(oddsAsyncModule, 'oddsAsync');

    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts', 'Td'],
      ['Jd', 'Jh', '2h', '5c'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    const abort = oddsOmahaAsync({ allHoleCards, communityCards, callback });
    abort();

    expect(oddsAsyncSpy).toHaveBeenCalledWith({
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

    expect(() => oddsOmahaAsync({ allHoleCards, communityCards, callback })).toThrow(
      'Each collection of hole cards accept a maximum of 4 elements',
    );
  });

  it('throws if too many community cards are provided', () => {
    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ts', 'Td'],
      ['Jd', 'Jh', '2h', '5c'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s', 'Td'];

    expect(() => oddsOmahaAsync({ allHoleCards, communityCards, callback })).toThrow(
      'communityCards accepts a maximum of 5 elements',
    );
  });
});
