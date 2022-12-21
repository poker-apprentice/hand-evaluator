import { handComparator } from '../../utils/handComparator';

describe('handComparator', () => {
  it('returns 0 when both hand ranks are equal value', () => {
    expect(handComparator(['Kc'], ['Ks'])).toEqual(0);
    expect(handComparator(['Kc', 'Qd'], ['Ks', 'Qs'])).toEqual(0);
  });

  it('returns -1 when the first hand ranks are higher value', () => {
    expect(handComparator(['Ac'], ['Kc'])).toEqual(-1);
    expect(handComparator(['Ac', 'Ad', 'Kd', 'Th', '2c'], ['Ac', 'Ad', 'Qd', 'Th', '2c'])).toEqual(-1);
  });

  it('returns 1 when the second hand ranks is higher value', () => {
    expect(handComparator(['Kc'], ['Ac'])).toEqual(1);
    expect(handComparator(['Ac', 'Ad', 'Qd', 'Th', '2c'], ['Ac', 'Ad', 'Kd', 'Th', '2c'])).toEqual(1);
  });
});
