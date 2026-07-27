import { Card, Hand } from '@poker-apprentice/types';
import * as equityModule from '../../equity';
import { InvalidCommunityCardCountError, InvalidHoleCardCountError } from '../../errors';
import { equityHoldem } from '../../helpers/equityHoldem';

describe('equityHoldem', () => {
  it('delegates to `equity`', () => {
    const equitySpy = jest.spyOn(equityModule, 'equity');
    const allHoleCards: Hand[] = [
      ['As', 'Kd'],
      ['Jd', 'Jh'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    equityHoldem(allHoleCards, communityCards);
    expect(equitySpy).toHaveBeenCalledWith(allHoleCards, {
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

    expect(() => equityHoldem(allHoleCards, communityCards)).toThrow(InvalidHoleCardCountError);
  });

  it('throws if too many community cards are provided', () => {
    const allHoleCards: Hand[] = [
      ['As', 'Kd'],
      ['Jd', 'Jh'],
    ];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s', 'Td'];

    expect(() => equityHoldem(allHoleCards, communityCards)).toThrow(
      InvalidCommunityCardCountError,
    );
  });
});
