import { HandStrength } from '@poker-apprentice/types';
import { handToIds } from '../../core/cards';
import { bestRankForPlan, compilePlan } from '../../core/plan';
import { handStrengthFromRank } from '../../core/rank';

describe('compilePlan', () => {
  it('compiles holdem (use any of 2 hole cards) to a single evaluation', () => {
    const plan = compilePlan(2, 5, 0, 2);
    expect(plan.mode).toBe('single');
    expect(plan.unitsPerHand).toBe(1);
  });

  it('compiles stud (use any of 7 hole cards) to a single evaluation', () => {
    const plan = compilePlan(7, 0, 0, 7);
    expect(plan.mode).toBe('single');
    expect(plan.unitsPerHand).toBe(1);
  });

  it('compiles pineapple (use up to 2 of 3 hole cards) to hole subsets', () => {
    const plan = compilePlan(3, 5, 0, 2);
    expect(plan.mode).toBe('holeSubsets');
    expect(plan.holeSubsets).toEqual([
      [0, 1],
      [0, 2],
      [1, 2],
    ]);
    expect(plan.unitsPerHand).toBe(3);
  });

  it('compiles omaha (use exactly 2 of 4 hole cards) to 60 paired subsets', () => {
    const plan = compilePlan(4, 5, 2, 2);
    expect(plan.mode).toBe('pairedSubsets');
    expect(plan.unitsPerHand).toBe(60);
    expect(plan.pairedSubsets[0]).toEqual({ holeIndexes: [0, 1], boardIndexes: [0, 1, 2] });
  });

  it('throws when fewer than 5 cards are available', () => {
    expect(() => compilePlan(2, 0, 0, 2)).toThrow('Cannot evaluate hands of fewer than 5 cards');
  });

  it('throws when constraints cannot produce a 5-card hand', () => {
    expect(() => compilePlan(4, 2, 0, 2)).toThrow(
      'Hole card usage constraints cannot produce a 5-card hand',
    );
  });
});

describe('bestRankForPlan', () => {
  it('evaluates unconstrained holdem hands', () => {
    const plan = compilePlan(2, 5, 0, 2);
    const rank = bestRankForPlan(
      plan,
      handToIds(['As', 'Ks']),
      handToIds(['Qs', 'Js', 'Ts', '2d', '3h']),
    );
    expect(rank).toBe(1);
  });

  it('enforces the omaha exactly-2-hole-cards rule', () => {
    // Quads on the board cannot be played: exactly 2 hole cards must be used, so the best
    // omaha hand here is kings full of aces, not four kings.
    const plan = compilePlan(4, 5, 2, 2);
    const rank = bestRankForPlan(
      plan,
      handToIds(['Ac', 'Ad', '3h', '4h']),
      handToIds(['Kc', 'Kd', 'Kh', 'Ks', '2c']),
    );
    expect(handStrengthFromRank(rank)).toBe(HandStrength.FullHouse);
  });

  it('enforces the pineapple maximum of 2 hole cards', () => {
    // Three suited hole cards cannot all be used: with only two clubs on the board, no flush
    // is possible despite 5 clubs across hole + board.
    const plan = compilePlan(3, 5, 0, 2);
    const rank = bestRankForPlan(
      plan,
      handToIds(['Ac', 'Kc', 'Qc']),
      handToIds(['2c', '7c', '4d', '8h', 'Ts']),
    );
    expect(handStrengthFromRank(rank)).toBe(HandStrength.HighCard);
  });
});
