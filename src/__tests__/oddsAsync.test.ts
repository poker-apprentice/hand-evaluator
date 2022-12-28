import { oddsAsync } from '../oddsAsync';
import { Card, Hand } from '../types';

describe('oddsAsync', () => {
  const allHoleCards: Hand[] = [
    ['As', 'Ks'],
    ['Jd', 'Jh'],
  ];
  const communityCards: Card[] = ['Qd', 'Js', '8d'];
  const options = {
    allHoleCards,
    communityCards,
    expectedCommunityCardCount: 5,
    expectedHoleCardCount: 2,
    minimumHoleCardsUsed: 0,
    maximumHoleCardsUsed: 2,
  };

  it('calls callback function with results', (next) => {
    const abort = oddsAsync({
      ...options,
      callback: (odds) => {
        expect(odds[0].total).toEqual(1000);
        abort();
        next();
      },
    });
  });
});
