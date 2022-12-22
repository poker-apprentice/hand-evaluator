import { compare } from '../compare';
import { evaluate } from '../evaluate';

describe('compare', () => {
  it('recognizes hands that are the same strength and ranks', () => {
    const a = evaluate({ holeCards: ['Qd', 'Jd', 'Td', '9d', '8d'] });
    const b = evaluate({ holeCards: ['Qc', 'Jc', 'Tc', '9c', '8c'] });
    expect(compare(a, b)).toEqual(0);
  });

  it('recognizes hands that are the same strength with different ranks', () => {
    const a = evaluate({ holeCards: ['Ad', 'Qs', 'Jc', '6h', '3c'] });
    const b = evaluate({ holeCards: ['Ad', 'Qs', 'Tc', '6h', '3c'] });
    expect(compare(a, b)).toEqual(-1);
    expect(compare(b, a)).toEqual(1);
  });

  it('recognizes hands that different strengths ', () => {
    const a = evaluate({ holeCards: ['Ad', 'Ah', 'Jc', '6h', '3c'] });
    const b = evaluate({ holeCards: ['Ad', 'Ah', 'Ac', 'Jc', '6h'] });
    expect(compare(a, b)).toEqual(1);
    expect(compare(b, a)).toEqual(-1);
  });
});
