import * as oddsAsyncModule from '../../oddsAsync';
import { oddsHoldemAsync } from '../../helpers/oddsHoldemAsync';
import { Card, Hand } from '../../types';

describe('oddsHoldemAsync', () => {
  const callback = () => {};

  it('delegates to `oddsAsync`', () => {
    const oddsAsyncSpy = jest.spyOn(oddsAsyncModule, 'oddsAsync');

    const allHoleCards: Hand[] = [
      ['As', 'Kd'],
      ['Jd', 'Jh'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    const abort = oddsHoldemAsync({ allHoleCards, communityCards, callback });
    abort();

    expect(oddsAsyncSpy).toHaveBeenCalledWith({
      allHoleCards,
      communityCards,
      expectedCommunityCardCount: 5,
      expectedHoleCardCount: 2,
      minimumHoleCardsUsed: 0,
      maximumHoleCardsUsed: 2,
      callback,
    });
  });

  it('throws if too many hole cards are provided', () => {
    const allHoleCards: Hand[] = [
      ['As', 'Kd', 'Ks'],
      ['Jd', 'Jh'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    expect(() => oddsHoldemAsync({ allHoleCards, communityCards, callback })).toThrow(
      'Each collection of hole cards accept a maximum of 2 elements',
    );
  });

  it('throws if too many community cards are provided', () => {
    const allHoleCards: Hand[] = [
      ['As', 'Kd'],
      ['Jd', 'Jh'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s', 'Td'];

    expect(() => oddsHoldemAsync({ allHoleCards, communityCards, callback })).toThrow(
      'communityCards accepts a maximum of 5 elements',
    );
  });
});
