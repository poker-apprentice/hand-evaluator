import { Card } from '@poker-apprentice/types';
import { InvalidCommunityCardCountError, InvalidHoleCardCountError } from '../../errors';
import * as evaluateModel from '../../evaluate';
import { evaluateOmaha } from '../../helpers/evaluateOmaha';

describe('evaluateOmaha', () => {
  it('delegates to `evaluate`', () => {
    const evaluateSpy = jest.spyOn(evaluateModel, 'evaluate');
    const holeCards: Card[] = ['As', 'Kd', 'Ts', 'Tc'];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    evaluateOmaha({ holeCards, communityCards });
    expect(evaluateSpy).toHaveBeenCalledWith({
      holeCards,
      communityCards,
      minimumHoleCards: 2,
      maximumHoleCards: 2,
    });
  });

  it('throws if too many hole cards are provided', () => {
    const holeCards: Card[] = ['As', 'Kd', 'Ts', 'Tc', '2h'];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s'];

    expect(() => evaluateOmaha({ holeCards, communityCards })).toThrow(InvalidHoleCardCountError);
  });

  it('throws if too many community cards are provided', () => {
    const holeCards: Card[] = ['As', 'Kd', 'Ts', 'Tc'];
    const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s', '2h'];

    expect(() => evaluateOmaha({ holeCards, communityCards })).toThrow(
      InvalidCommunityCardCountError,
    );
  });
});
