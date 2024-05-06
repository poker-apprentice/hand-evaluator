import { HandStrength } from '@poker-apprentice/types';
import { evaluate } from '../evaluate';

describe('evaluate', () => {
  it('recognizes royal flushes', () => {
    expect(evaluate({ holeCards: ['Qh', 'Qd', 'Td', 'Qs', 'Kd', 'Ad', 'Jd'] })).toEqual({
      strength: HandStrength.RoyalFlush,
      hand: ['Ad', 'Kd', 'Qd', 'Jd', 'Td'],
      value: 135004160n,
    });
  });

  it('recognizes straight flushes', () => {
    expect(evaluate({ holeCards: ['Qh', 'Qd', 'Td', 'Qs', 'Kd', '9d', 'Jd'] })).toEqual({
      strength: HandStrength.StraightFlush,
      hand: ['Kd', 'Qd', 'Jd', 'Td', '9d'],
      value: 134938624n,
    });
  });

  it('recognizes straight flushes with ace treated as low', () => {
    expect(evaluate({ holeCards: ['Qh', '5d', '2d', '3d', '8d', 'Ad', '4d'] })).toEqual({
      strength: HandStrength.StraightFlush,
      hand: ['5d', '4d', '3d', '2d', 'Ad'],
      value: 134414336n,
    });
  });

  it('recognizes four of a kind', () => {
    expect(evaluate({ holeCards: ['As', 'Qd', 'Js', 'Qs', 'Qc', 'Qh'] })).toEqual({
      strength: HandStrength.FourOfAKind,
      hand: ['Qd', 'Qs', 'Qc', 'Qh', 'As'],
      value: 118145024n,
    });
  });

  it('recognizes full houses', () => {
    expect(evaluate({ holeCards: ['As', 'Qd', 'Js', 'Qs', 'Jc', 'Qh'] })).toEqual({
      strength: HandStrength.FullHouse,
      hand: ['Qd', 'Qs', 'Qh', 'Js', 'Jc'],
      value: 101355520n,
    });
  });

  it('recognizes stronger full houses', () => {
    expect(evaluate({ holeCards: ['Js', 'Qd', 'Jc', 'Qs', 'Ac', 'Qh', 'Ah'] })).toEqual({
      strength: HandStrength.FullHouse,
      hand: ['Qd', 'Qs', 'Qh', 'Ac', 'Ah'],
      value: 101367808n,
    });
  });

  it('recognizes full houses that are comprised of trips twice', () => {
    expect(
      evaluate({
        holeCards: ['5d', '5c'],
        minimumHoleCards: 0,
        maximumHoleCards: 2,
        communityCards: ['Kc', '5h', 'Kd', 'Kh'],
      }),
    ).toEqual({
      strength: HandStrength.FullHouse,
      hand: ['Kc', 'Kd', 'Kh', '5d', '5c'],
      value: 101396480n,
    });
  });

  it('recognizes flushes', () => {
    expect(evaluate({ holeCards: ['Js', 'Qd', '8s', '4s', '6c', 'Qs', 'As'] })).toEqual({
      strength: HandStrength.Flush,
      hand: ['As', 'Qs', 'Js', '8s', '4s'],
      value: 84715874n,
    });
  });

  it('recognizes straights', () => {
    expect(evaluate({ holeCards: ['Qh', 'Qd', 'Td', 'Qs', 'Kh', '9d', 'Jc'] })).toEqual({
      strength: HandStrength.Straight,
      hand: ['Kh', 'Qh', 'Jc', 'Td', '9d'],
      value: 67829760n,
    });
  });

  it('recognizes straights with ace treated as low', () => {
    expect(evaluate({ holeCards: ['Qh', '5d', '2h', '3d', '8c', 'As', '4d'] })).toEqual({
      strength: HandStrength.Straight,
      hand: ['5d', '4d', '3d', '2h', 'As'],
      value: 67305472n,
    });
  });

  it('recognizes three of a kind', () => {
    expect(evaluate({ holeCards: ['As', 'Qd', 'Js', 'Qs', 'Qc', '2h'] })).toEqual({
      strength: HandStrength.ThreeOfAKind,
      hand: ['Qd', 'Qs', 'Qc', 'As', 'Js'],
      value: 51038464n,
    });
  });

  it('recognizes two pair', () => {
    expect(evaluate({ holeCards: ['As', 'Qd', 'Js', 'Qs', '2h', 'Jh'] })).toEqual({
      strength: HandStrength.TwoPair,
      hand: ['Qd', 'Qs', 'Js', 'Jh', 'As'],
      value: 34249728n,
    });
  });

  it('recognizes one pair', () => {
    expect(evaluate({ holeCards: ['As', 'Qd', 'Js', 'Qs', '2h', '3h'] })).toEqual({
      strength: HandStrength.OnePair,
      hand: ['Qd', 'Qs', 'As', 'Js', '3h'],
      value: 17484048n,
    });
  });

  it('recognizes high card', () => {
    expect(evaluate({ holeCards: ['As', 'Qd', 'Js', '8s', '2h', '3h'] })).toEqual({
      strength: HandStrength.HighCard,
      hand: ['As', 'Qd', 'Js', '8s', '3h'],
      value: 829793n,
    });
  });

  describe('minimum & maximum hole cards', () => {
    it('handles minimum & maximum as the same value', () => {
      const omahaHand = evaluate({
        holeCards: ['As', 'Kd', 'Td', '2s'],
        communityCards: ['Js', '4s', '3d', '5d', 'Ah'],
        minimumHoleCards: 2,
        maximumHoleCards: 2,
      });
      expect(omahaHand).toEqual({
        strength: HandStrength.Straight,
        hand: ['5d', '4s', '3d', '2s', 'As'],
        value: 67305472n,
      });
    });

    it('handles maximum greater than minimum', () => {
      const pineappleHand = evaluate({
        holeCards: ['Jc', 'Tc', '7d'],
        communityCards: ['9h', '8c', '2d'],
        maximumHoleCards: 2,
      });
      expect(pineappleHand).toEqual({
        strength: HandStrength.HighCard,
        hand: ['Jc', 'Tc', '9h', '8c', '2d'],
        value: 624480n,
      });
    });
  });

  it('allows fewer cards than 5 total cards', () => {
    expect(
      evaluate({
        holeCards: ['Jc', 'Kh'],
        minimumHoleCards: 2,
        maximumHoleCards: 2,
      }),
    ).toEqual({
      strength: HandStrength.HighCard,
      hand: ['Kh', 'Jc'],
      value: 757760n,
    });

    expect(
      evaluate({
        holeCards: ['As', 'Ad'],
        minimumHoleCards: 2,
        maximumHoleCards: 2,
      }),
    ).toEqual({
      strength: HandStrength.OnePair,
      hand: ['As', 'Ad'],
      value: 17563648n,
    });
  });
});
