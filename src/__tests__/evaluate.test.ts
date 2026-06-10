import { HandStrength } from '@poker-apprentice/types';
import { compare } from '../compare';
import { idToCard } from '../core/cards';
import { evaluate } from '../evaluate';
import { referenceBest, referenceEvaluate } from './fixtures/referenceEvaluate';

describe('evaluate', () => {
  it('recognizes royal flushes', () => {
    expect(evaluate({ holeCards: ['Qh', 'Qd', 'Td', 'Qs', 'Kd', 'Ad', 'Jd'] })).toEqual({
      strength: HandStrength.RoyalFlush,
      hand: ['Ad', 'Kd', 'Qd', 'Jd', 'Td'],
    });
  });

  it('recognizes straight flushes', () => {
    expect(evaluate({ holeCards: ['Qh', 'Qd', 'Td', 'Qs', 'Kd', '9d', 'Jd'] })).toEqual({
      strength: HandStrength.StraightFlush,
      hand: ['Kd', 'Qd', 'Jd', 'Td', '9d'],
    });
  });

  it('recognizes straight flushes obscured by a duplicate-rank card (v3 bug)', () => {
    // v3 reported a flush here: its straight detection dropped the 9h variant because the
    // run K-Q-J-T had already been completed by the 9d.
    expect(evaluate({ holeCards: ['3s', 'Jh', 'Th', 'Qh', '9d', 'Kh', '9h'] })).toEqual({
      strength: HandStrength.StraightFlush,
      hand: ['Kh', 'Qh', 'Jh', 'Th', '9h'],
    });
  });

  it('recognizes straight flushes with ace treated as low', () => {
    expect(evaluate({ holeCards: ['Qh', '5d', '2d', '3d', '8d', 'Ad', '4d'] })).toEqual({
      strength: HandStrength.StraightFlush,
      hand: ['5d', '4d', '3d', '2d', 'Ad'],
    });
  });

  it('recognizes four of a kind', () => {
    expect(evaluate({ holeCards: ['As', 'Qd', 'Js', 'Qs', 'Qc', 'Qh'] })).toEqual({
      strength: HandStrength.FourOfAKind,
      hand: ['Qd', 'Qs', 'Qc', 'Qh', 'As'],
    });
  });

  it('recognizes full houses', () => {
    expect(evaluate({ holeCards: ['As', 'Qd', 'Js', 'Qs', 'Jc', 'Qh'] })).toEqual({
      strength: HandStrength.FullHouse,
      hand: ['Qd', 'Qs', 'Qh', 'Js', 'Jc'],
    });
  });

  it('recognizes stronger full houses', () => {
    expect(evaluate({ holeCards: ['Js', 'Qd', 'Jc', 'Qs', 'Ac', 'Qh', 'Ah'] })).toEqual({
      strength: HandStrength.FullHouse,
      hand: ['Qd', 'Qs', 'Qh', 'Ac', 'Ah'],
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
    });
  });

  it('recognizes flushes', () => {
    expect(evaluate({ holeCards: ['Js', 'Qd', '8s', '4s', '6c', 'Qs', 'As'] })).toEqual({
      strength: HandStrength.Flush,
      hand: ['As', 'Qs', 'Js', '8s', '4s'],
    });
  });

  it('recognizes straights', () => {
    expect(evaluate({ holeCards: ['Qh', 'Qd', 'Td', 'Qs', 'Kh', '9d', 'Jc'] })).toEqual({
      strength: HandStrength.Straight,
      hand: ['Kh', 'Qh', 'Jc', 'Td', '9d'],
    });
  });

  it('recognizes straights with ace treated as low', () => {
    expect(evaluate({ holeCards: ['Qh', '5d', '2h', '3d', '8c', 'As', '4d'] })).toEqual({
      strength: HandStrength.Straight,
      hand: ['5d', '4d', '3d', '2h', 'As'],
    });
  });

  it('recognizes three of a kind', () => {
    expect(evaluate({ holeCards: ['As', 'Qd', 'Js', 'Qs', 'Qc', '2h'] })).toEqual({
      strength: HandStrength.ThreeOfAKind,
      hand: ['Qd', 'Qs', 'Qc', 'As', 'Js'],
    });
  });

  it('recognizes two pair', () => {
    expect(evaluate({ holeCards: ['As', 'Qd', 'Js', 'Qs', '2h', 'Jh'] })).toEqual({
      strength: HandStrength.TwoPair,
      hand: ['Qd', 'Qs', 'Js', 'Jh', 'As'],
    });
  });

  it('recognizes one pair', () => {
    expect(evaluate({ holeCards: ['As', 'Qd', 'Js', 'Qs', '2h', '3h'] })).toEqual({
      strength: HandStrength.OnePair,
      hand: ['Qd', 'Qs', 'As', 'Js', '3h'],
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
      });
    });
  });

  describe('cross-validation against the frozen v3 evaluator', () => {
    // Deterministic PRNG so failures are reproducible.
    const mulberry32 = (seed: number) => {
      let state = seed;
      return () => {
        state |= 0;
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };

    it.each([5, 6, 7])(
      'agrees on random %i-card hands',
      (size) => {
        const random = mulberry32(0xd15ea5e + size);
        const deck = Array.from({ length: 52 }, (_, id) => id);
        for (let iteration = 0; iteration < 10000; iteration += 1) {
          for (let i = 0; i < size; i += 1) {
            const j = i + Math.floor(random() * (52 - i));
            const swap = deck[i];
            deck[i] = deck[j];
            deck[j] = swap;
          }
          const cards = deck.slice(0, size).map(idToCard);

          const actual = evaluate({ holeCards: cards });
          // For more than 5 cards the oracle's returned card set may differ among
          // equally-strong suit variants, so equality is asserted via `compare`.
          const expected = size === 5 ? referenceEvaluate(cards) : referenceBest(cards);
          expect(actual.strength).toBe(expected.strength);
          expect(compare(actual, expected)).toBe(0);
          if (size === 5) {
            expect(actual.hand).toEqual(expected.hand);
          }
        }
      },
      30000,
    );
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
    });
  });
});
