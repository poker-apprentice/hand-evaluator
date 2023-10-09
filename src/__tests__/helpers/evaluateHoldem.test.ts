import * as evaluateModel from '../../evaluate';
import { evaluateHoldem } from '../../helpers/evaluateHoldem';
import { Card } from '../../types';

describe('evaluateHoldem', () => {
  it('delegates to `evaluate`', () => {
    const evaluateSpy = jest.spyOn(evaluateModel, 'evaluate');
    const holeCards: Card[] = ['As', 'Kd'];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    evaluateHoldem({ holeCards, communityCards });
    expect(evaluateSpy).toHaveBeenCalledWith({
      holeCards,
      communityCards,
      minimumHoleCards: 0,
      maximumHoleCards: 2,
    });
  });

  it('throws if too many hole cards are provided', () => {
    const holeCards: Card[] = ['As', 'Kd', 'Td'];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    expect(() => evaluateHoldem({ holeCards, communityCards })).toThrow(
      'holeCards accepts a maximum of 2 elements',
    );
  });

  it('throws if too many community cards are provided', () => {
    const holeCards: Card[] = ['As', 'Kd'];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s', 'Td'];

    expect(() => evaluateHoldem({ holeCards, communityCards })).toThrow(
      'communityCards accepts a maximum of 5 elements',
    );
  });
});
