import { getRank } from '@poker-apprentice/types';

describe('getRank', () => {
  it('returns the first character', () => {
    expect(getRank('Ac')).toEqual('A');
    expect(getRank('Kd')).toEqual('K');
    expect(getRank('Qh')).toEqual('Q');
    expect(getRank('Js')).toEqual('J');
    expect(getRank('Tc')).toEqual('T');
    expect(getRank('9d')).toEqual('9');
    expect(getRank('8h')).toEqual('8');
    expect(getRank('7s')).toEqual('7');
    expect(getRank('6c')).toEqual('6');
    expect(getRank('5d')).toEqual('5');
    expect(getRank('4h')).toEqual('4');
    expect(getRank('3s')).toEqual('3');
    expect(getRank('2c')).toEqual('2');
  });
});
