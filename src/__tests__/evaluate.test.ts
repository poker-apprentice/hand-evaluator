import { evaluate } from '../evaluate';
import { Strength } from '../types';

describe('evaluate', () => {
  it('recognizes royal flushes', () => {
    expect(evaluate(['Qh', 'Qd', 'Td', 'Qs', 'Kd', 'Ad', 'Jd'])).toEqual({
      strength: Strength.ROYAL_FLUSH,
      hand: ['Ad', 'Kd', 'Qd', 'Jd', 'Td'],
    });
  });

  it('recognizes straight flushes', () => {
    expect(evaluate(['Qh', 'Qd', 'Td', 'Qs', 'Kd', '9d', 'Jd'])).toEqual({
      strength: Strength.STRAIGHT_FLUSH,
      hand: ['Kd', 'Qd', 'Jd', 'Td', '9d'],
    });
  });

  it('recognizes straight flushes with ace treated as low', () => {
    expect(evaluate(['Qh', '5d', '2d', '3d', '8d', 'Ad', '4d'])).toEqual({
      strength: Strength.STRAIGHT_FLUSH,
      hand: ['5d', '4d', '3d', '2d', 'Ad'],
    });
  });

  it('recognizes four of a kind', () => {
    expect(evaluate(['As', 'Qd', 'Js', 'Qs', 'Qc', 'Qh'])).toEqual({
      strength: Strength.FOUR_OF_A_KIND,
      hand: ['Qd', 'Qs', 'Qc', 'Qh', 'As'],
    });
  });

  it('recognizes full houses', () => {
    expect(evaluate(['As', 'Qd', 'Js', 'Qs', 'Jc', 'Qh'])).toEqual({
      strength: Strength.FULL_HOUSE,
      hand: ['Qd', 'Qs', 'Qh', 'Js', 'Jc'],
    });
  });

  it('recognizes stronger full houses', () => {
    expect(evaluate(['Js', 'Qd', 'Jc', 'Qs', 'Ac', 'Qh', 'Ah'])).toEqual({
      strength: Strength.FULL_HOUSE,
      hand: ['Qd', 'Qs', 'Qh', 'Ac', 'Ah'],
    });
  });

  it('recognizes flushes', () => {
    expect(evaluate(['Js', 'Qd', '8s', '4s', '6c', 'Qs', 'As'])).toEqual({
      strength: Strength.FLUSH,
      hand: ['As', 'Qs', 'Js', '8s', '4s'],
    });
  });

  it('recognizes straights', () => {
    expect(evaluate(['Qh', 'Qd', 'Td', 'Qs', 'Kh', '9d', 'Jc'])).toEqual({
      strength: Strength.STRAIGHT,
      hand: ['Kh', 'Qh', 'Jc', 'Td', '9d'],
    });
  });

  it('recognizes straights with ace treated as low', () => {
    expect(evaluate(['Qh', '5d', '2h', '3d', '8c', 'As', '4d'])).toEqual({
      strength: Strength.STRAIGHT,
      hand: ['5d', '4d', '3d', '2h', 'As'],
    });
  });

  it('recognizes three of a kind', () => {
    expect(evaluate(['As', 'Qd', 'Js', 'Qs', 'Qc', '2h'])).toEqual({
      strength: Strength.THREE_OF_A_KIND,
      hand: ['Qd', 'Qs', 'Qc', 'As', 'Js'],
    });
  });

  it('recognizes two pair', () => {
    expect(evaluate(['As', 'Qd', 'Js', 'Qs', '2h', 'Jh'])).toEqual({
      strength: Strength.TWO_PAIR,
      hand: ['Qd', 'Qs', 'Js', 'Jh', 'As'],
    });
  });

  it('recognizes one pair', () => {
    expect(evaluate(['As', 'Qd', 'Js', 'Qs', '2h', '3h'])).toEqual({
      strength: Strength.ONE_PAIR,
      hand: ['Qd', 'Qs', 'As', 'Js', '3h'],
    });
  });
});
