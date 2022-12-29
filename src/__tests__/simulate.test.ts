import { simulate } from '../simulate';
import { Card, Hand } from '../types';

describe('simulate', () => {
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
    simulate({
      ...options,
      samples: 1000,
      samplesPerUpdate: 1000,
      callback: (odds) => {
        expect(odds[0].total).toEqual(1000);
        next();
      },
    });
  });

  it('calculates the correct number of samples', (next) => {
    const samples = 85;
    const samplesPerUpdate = 10;
    let callbackCount = 0;

    simulate({
      ...options,
      samples,
      samplesPerUpdate,
      callback: (odds) => {
        callbackCount += 1;

        const { total } = odds[0];

        if (callbackCount === Math.ceil(samples / samplesPerUpdate)) {
          expect(total).toEqual(samples);
          next();
        } else {
          expect(total).toEqual(callbackCount * samplesPerUpdate);
        }
      },
    });
  });

  it('aborts', (next) => {
    let callbackCount = 0;
    const maxIterations = 3;

    const abort = simulate({
      ...options,
      callback: () => {
        callbackCount += 1;
        if (callbackCount === maxIterations) {
          abort();
          setTimeout(() => {
            expect(callbackCount).toEqual(maxIterations);
            next();
          }, 100);
        }
      },
    });
  });
});
