import { getSuit } from '../../utils/getSuit';

describe('getRank', () => {
  it('returns the second character', () => {
    expect(getSuit('Ac')).toEqual('c');
    expect(getSuit('Kd')).toEqual('d');
    expect(getSuit('Qh')).toEqual('h');
    expect(getSuit('Js')).toEqual('s');
  });
});
