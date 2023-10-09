import { Card } from '@poker-apprentice/types';
import * as evaluateModel from '../../evaluate';
import { evaluatePineapple } from '../../helpers/evaluatePineapple';

describe('evaluatePineapple', () => {
  it('delegates to `evaluate`', () => {
    const evaluateSpy = jest.spyOn(evaluateModel, 'evaluate');
    const holeCards: Card[] = ['As', 'Kd', 'Ts'];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    evaluatePineapple({ holeCards, communityCards });
    expect(evaluateSpy).toHaveBeenCalledWith({
      holeCards,
      communityCards,
      minimumHoleCards: 0,
      maximumHoleCards: 2,
    });
  });

  it('throws if too many hole cards are provided', () => {
    const holeCards: Card[] = ['As', 'Kd', 'Ts', 'Tc'];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    expect(() => evaluatePineapple({ holeCards, communityCards })).toThrow(
      'holeCards accepts a maximum of 3 elements',
    );
  });

  it('throws if too many community cards are provided', () => {
    const holeCards: Card[] = ['As', 'Kd', 'Ts'];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s', 'Td'];

    expect(() => evaluatePineapple({ holeCards, communityCards })).toThrow(
      'communityCards accepts a maximum of 5 elements',
    );
  });
});
