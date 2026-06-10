import { Card, HandStrength } from '@poker-apprentice/types';
import { cardToId, handToIds, idToCard } from '../../core/cards';
import { handStrengthFromRank, rankN } from '../../core/rank';
import { referenceBest, referenceCompare } from '../fixtures/referenceEvaluate';

const rankOf = (cards: Card[]): number => {
  const ids = handToIds(cards);
  return rankN(ids, ids.length);
};

// Deterministic PRNG so cross-validation failures are reproducible.
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

const dealHand = (random: () => number, size: number): number[] => {
  const deck = Array.from({ length: 52 }, (_, id) => id);
  for (let i = 0; i < size; i += 1) {
    const j = i + Math.floor(random() * (52 - i));
    const swap = deck[i];
    deck[i] = deck[j];
    deck[j] = swap;
  }
  return deck.slice(0, size);
};

describe('cards', () => {
  it('encodes cards as rank-major integer ids', () => {
    expect(cardToId('2c')).toBe(0);
    expect(cardToId('2d')).toBe(1);
    expect(cardToId('2h')).toBe(2);
    expect(cardToId('2s')).toBe(3);
    expect(cardToId('3c')).toBe(4);
    expect(cardToId('As')).toBe(51);
  });

  it('round-trips every card id', () => {
    for (let id = 0; id < 52; id += 1) {
      expect(cardToId(idToCard(id))).toBe(id);
    }
  });

  it('throws on invalid cards', () => {
    expect(() => cardToId('Xx' as Card)).toThrow('Invalid card: Xx');
  });
});

describe('rankN', () => {
  describe('pinned hand ranks', () => {
    it('ranks a royal flush as the best possible hand', () => {
      expect(rankOf(['As', 'Ks', 'Qs', 'Js', 'Ts'])).toBe(1);
    });

    it('ranks a wheel straight flush as the worst straight flush', () => {
      expect(rankOf(['5d', '4d', '3d', '2d', 'Ad'])).toBe(10);
    });

    it('ranks a broadway straight as the best straight', () => {
      expect(rankOf(['Ac', 'Kd', 'Qh', 'Js', 'Tc'])).toBe(1600);
    });

    it('ranks a wheel straight as the worst straight', () => {
      expect(rankOf(['5c', '4d', '3h', '2s', 'Ac'])).toBe(1609);
    });

    it('ranks 7-5-4-3-2 unsuited as the worst possible hand', () => {
      expect(rankOf(['7c', '5d', '4h', '3s', '2c'])).toBe(7462);
    });

    it('finds a wheel in a 7-card hand over a pair of aces', () => {
      const rank = rankOf(['As', 'Ad', '2c', '3d', '4h', '5s', '9d']);
      expect(rank).toBe(1609);
      expect(handStrengthFromRank(rank)).toBe(HandStrength.Straight);
    });

    it('finds an ace-low straight flush in a 7-card hand', () => {
      const rank = rankOf(['Ah', '2h', '3h', '4h', '5h', 'Kc', 'Kd']);
      expect(rank).toBe(10);
      expect(handStrengthFromRank(rank)).toBe(HandStrength.StraightFlush);
    });

    it('distinguishes kickers alongside quads on the board', () => {
      const withAce = rankOf(['Kc', 'Kd', 'Kh', 'Ks', 'Ac', '2d', '2h']);
      const withQueen = rankOf(['Kc', 'Kd', 'Kh', 'Ks', 'Qc', '2d', '2h']);
      expect(handStrengthFromRank(withAce)).toBe(HandStrength.FourOfAKind);
      expect(handStrengthFromRank(withQueen)).toBe(HandStrength.FourOfAKind);
      expect(withAce).toBeLessThan(withQueen);
    });

    it('makes a full house from two sets of trips', () => {
      const rank = rankOf(['Kc', 'Kd', 'Kh', '5c', '5d', '5h', '2s']);
      expect(rank).toBe(rankOf(['Kc', 'Kd', 'Kh', '5c', '5d']));
      expect(handStrengthFromRank(rank)).toBe(HandStrength.FullHouse);
    });

    it('ranks a flush using only the suited cards when an off-suit pair is present', () => {
      const rank = rankOf(['2c', '4c', '6c', '8c', 'Tc', 'Ah', 'Ad']);
      expect(rank).toBe(rankOf(['2c', '4c', '6c', '8c', 'Tc']));
      expect(handStrengthFromRank(rank)).toBe(HandStrength.Flush);
    });

    it('picks the best 5 suited cards when more than 5 are present', () => {
      const rank = rankOf(['2c', '4c', '6c', '8c', 'Tc', 'Qc', 'Ac']);
      expect(rank).toBe(rankOf(['6c', '8c', 'Tc', 'Qc', 'Ac']));
    });

    it('evaluates 6-card hands', () => {
      const rank = rankOf(['9c', '8d', '7h', '6s', '5c', '5d']);
      expect(rank).toBe(rankOf(['9c', '8d', '7h', '6s', '5c']));
      expect(handStrengthFromRank(rank)).toBe(HandStrength.Straight);
    });
  });

  it('produces the known hand-strength distribution across all 2,598,960 5-card hands', () => {
    const counts = new Map<HandStrength, number>();
    const hand = new Uint8Array(5);
    for (let a = 0; a < 48; a += 1) {
      hand[0] = a;
      for (let b = a + 1; b < 49; b += 1) {
        hand[1] = b;
        for (let c = b + 1; c < 50; c += 1) {
          hand[2] = c;
          for (let d = c + 1; d < 51; d += 1) {
            hand[3] = d;
            for (let e = d + 1; e < 52; e += 1) {
              hand[4] = e;
              const strength = handStrengthFromRank(rankN(hand, 5));
              counts.set(strength, (counts.get(strength) ?? 0) + 1);
            }
          }
        }
      }
    }

    expect(counts.get(HandStrength.RoyalFlush)).toBe(4);
    expect(counts.get(HandStrength.StraightFlush)).toBe(36);
    expect(counts.get(HandStrength.FourOfAKind)).toBe(624);
    expect(counts.get(HandStrength.FullHouse)).toBe(3744);
    expect(counts.get(HandStrength.Flush)).toBe(5108);
    expect(counts.get(HandStrength.Straight)).toBe(10200);
    expect(counts.get(HandStrength.ThreeOfAKind)).toBe(54912);
    expect(counts.get(HandStrength.TwoPair)).toBe(123552);
    expect(counts.get(HandStrength.OnePair)).toBe(1098240);
    expect(counts.get(HandStrength.HighCard)).toBe(1302540);
  }, 30000);

  describe.each([5, 6, 7])('cross-validation against the v3 evaluator (%i cards)', (size) => {
    it('agrees on hand strength for random hands', () => {
      const random = mulberry32(0xbadbeef + size);
      for (let i = 0; i < 20000; i += 1) {
        const ids = dealHand(random, size);
        const cards = ids.map(idToCard);
        const expected = referenceBest(cards).strength;
        const actual = handStrengthFromRank(rankN(ids, size));
        if (actual !== expected) {
          throw new Error(
            `Mismatched strength for [${cards.join(' ')}]: expected ${
              HandStrength[expected]
            }, got ${HandStrength[actual]}`,
          );
        }
      }
    }, 30000);

    it('agrees on the relative ordering of random hand pairs', () => {
      const random = mulberry32(0xfacade + size);
      for (let i = 0; i < 10000; i += 1) {
        const idsA = dealHand(random, size);
        const idsB = dealHand(random, size);
        const cardsA = idsA.map(idToCard);
        const cardsB = idsB.map(idToCard);

        // referenceCompare: -1 when A is stronger; rankN: lower rank = stronger.
        const expected = referenceCompare(referenceBest(cardsA), referenceBest(cardsB));
        const actual = Math.sign(rankN(idsA, size) - rankN(idsB, size));
        if (actual !== expected) {
          throw new Error(
            `Mismatched ordering for [${cardsA.join(' ')}] vs [${cardsB.join(
              ' ',
            )}]: expected ${expected}, got ${actual}`,
          );
        }
      }
    }, 30000);
  });
});
