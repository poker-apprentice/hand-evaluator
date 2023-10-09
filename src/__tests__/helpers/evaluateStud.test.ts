import { Card } from '@poker-apprentice/types';
import * as evaluateModel from '../../evaluate';
import { evaluateStud } from '../../helpers/evaluateStud';

describe('evaluatePineapple', () => {
  it('delegates to `evaluate`', () => {
    const evaluateSpy = jest.spyOn(evaluateModel, 'evaluate');
    const holeCards: Card[] = ['As', 'Kd', 'Ts', 'Tc', 'Qd', '2d', '2s'];

    evaluateStud({ holeCards });
    expect(evaluateSpy).toHaveBeenCalledWith({
      holeCards,
      minimumHoleCards: 0,
      maximumHoleCards: 7,
    });
  });

  it('throws if too many hole cards are provided', () => {
    const holeCards: Card[] = ['As', 'Kd', 'Ts', 'Tc', 'Qd', '2d', '2s', '8c'];

    expect(() => evaluateStud({ holeCards })).toThrow('holeCards accepts a maximum of 7 elements');
  });
});
