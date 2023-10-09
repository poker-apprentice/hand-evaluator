import { getSuit } from '@poker-apprentice/types';

describe('getRank', () => {
  it('returns the second character', () => {
    expect(getSuit('Ac')).toEqual('c');
    expect(getSuit('Kd')).toEqual('d');
    expect(getSuit('Qh')).toEqual('h');
    expect(getSuit('Js')).toEqual('s');
  });
});
