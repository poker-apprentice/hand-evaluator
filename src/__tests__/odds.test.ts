import { Card, Hand } from '@poker-apprentice/types';
import { odds } from '../odds';

// Expected counts are on a combination basis: every distinct deal of the unknown cards counts
// once.  (v3 counted permutations instead, so its totals were larger by a factor of the
// product of each unknown group's factorial; percentages are unchanged.)
describe('odds', () => {
  describe('game has community cards', () => {
    const holdemOptions = {
      expectedCommunityCardCount: 5,
      expectedHoleCardCount: 2,
      minimumHoleCardsUsed: 0,
      maximumHoleCardsUsed: 2,
    };

    it('heads-up, all hole cards provided (no ties)', () => {
      const hands: Hand[] = [
        ['As', 'Ks'],
        ['Jd', 'Jh'],
      ];

      // v3 (permutation basis): wins 298/1682, total 1980
      expect(odds(hands, { ...holdemOptions, communityCards: ['Qd', 'Js', '8d'] })).toEqual([
        { wins: 149, ties: 0, total: 990, equity: 149 / 990 },
        { wins: 841, ties: 0, total: 990, equity: 841 / 990 },
      ]);
    });

    it('heads-up, all hole cards provided (some ties)', () => {
      const hands: Hand[] = [
        ['As', 'Ks'],
        ['Ad', 'Kd'],
      ];

      // v3 (permutation basis): wins 90, ties 1800, total 1980
      expect(odds(hands, { ...holdemOptions, communityCards: ['Qd', 'Js', '8h'] })).toEqual([
        { wins: 45, ties: 900, total: 990, equity: (45 + 450) / 990 },
        { wins: 45, ties: 900, total: 990, equity: (45 + 450) / 990 },
      ]);
    });

    it('multi-way, all hole cards provided', () => {
      const hands: Hand[] = [
        ['As', 'Ks'],
        ['Ad', 'Kd'],
        ['Jd', 'Jh'],
      ];

      // v3 (permutation basis): wins 58/56/1464, ties 228/228/0, total 1806
      expect(odds(hands, { ...holdemOptions, communityCards: ['Qd', 'Js', '8h'] })).toEqual([
        { wins: 29, ties: 114, total: 903, equity: (29 + 57) / 903 },
        { wins: 28, ties: 114, total: 903, equity: (28 + 57) / 903 },
        { wins: 732, ties: 0, total: 903, equity: 732 / 903 },
      ]);
    });

    it('heads-up, not all hole cards provided', () => {
      const hands: Hand[] = [['As', 'Ks'], ['Ad']];

      // v3 (permutation basis): wins 59072/23736, ties 8272, total 91080
      expect(odds(hands, { ...holdemOptions, communityCards: ['Qd', 'Js', '8h'] })).toEqual([
        { wins: 29536, ties: 4136, total: 45540, equity: (29536 + 2068) / 45540 },
        { wins: 11868, ties: 4136, total: 45540, equity: (11868 + 2068) / 45540 },
      ]);
    });

    it('all cards provided', () => {
      const hands: Hand[] = [
        ['As', 'Ks'],
        ['Ad', 'Ac'],
      ];

      expect(
        odds(hands, { ...holdemOptions, communityCards: ['Qd', 'Js', '8h', 'Th', '2s'] }),
      ).toEqual([
        { wins: 1, ties: 0, total: 1, equity: 1 },
        { wins: 0, ties: 0, total: 1, equity: 0 },
      ]);
    });

    it('heads-up preflop (exhaustive)', () => {
      const hands: Hand[] = [
        ['As', 'Ks'],
        ['Jd', 'Jh'],
      ];

      // AKs vs JJ is the classic near-coinflip: 46.1% vs 53.9% across all C(48,5) boards.
      expect(odds(hands, { ...holdemOptions, communityCards: [] })).toEqual([
        { wins: 786618, ties: 6488, total: 1712304, equity: (786618 + 3244) / 1712304 },
        { wins: 919198, ties: 6488, total: 1712304, equity: (919198 + 3244) / 1712304 },
      ]);
    });

    describe('omaha (exactly 2 of 4 hole cards)', () => {
      const omahaOptions = {
        expectedCommunityCardCount: 5,
        expectedHoleCardCount: 4,
        minimumHoleCardsUsed: 2,
        maximumHoleCardsUsed: 2,
      };
      const hands: Hand[] = [
        ['As', 'Ks', 'Qd', 'Jd'],
        ['9c', '9d', '6h', '6s'],
      ];

      it('to the turn', () => {
        expect(odds(hands, { ...omahaOptions, communityCards: ['9h', '6c', '2s', 'Td'] })).toEqual([
          { wins: 13, ties: 0, total: 40, equity: 13 / 40 },
          { wins: 27, ties: 0, total: 40, equity: 27 / 40 },
        ]);
      });

      it('to the river', () => {
        expect(
          odds(hands, { ...omahaOptions, communityCards: ['9h', '6c', '2s', 'Td', 'Ad'] }),
        ).toEqual([
          { wins: 0, ties: 0, total: 1, equity: 0 },
          { wins: 1, ties: 0, total: 1, equity: 1 },
        ]);
      });
    });

    it('pineapple (up to 2 of 3 hole cards) to the turn', () => {
      const hands: Hand[] = [
        ['As', 'Ks', 'Qs'],
        ['Jd', 'Jh', '7c'],
      ];

      expect(
        odds(hands, {
          expectedCommunityCardCount: 5,
          expectedHoleCardCount: 3,
          minimumHoleCardsUsed: 0,
          maximumHoleCardsUsed: 2,
          communityCards: ['Qd', 'Js', '8d', '2h'],
        }),
      ).toEqual([
        { wins: 4, ties: 0, total: 42, equity: 4 / 42 },
        { wins: 38, ties: 0, total: 42, equity: 38 / 42 },
      ]);
    });
  });

  describe('game has no community cards', () => {
    const studOptions = {
      communityCards: [],
      expectedCommunityCardCount: 0,
      expectedHoleCardCount: 7,
      minimumHoleCardsUsed: 0,
      maximumHoleCardsUsed: 7,
    };

    it('heads-up (no ties)', () => {
      const hands: Hand[] = [
        ['As', 'Kd', 'Ks', '8c', 'Ac', '2d'],
        ['9s', '8s', 'Ts', '6s', '4h', '2c'],
      ];

      // unchanged from v3: each hand is missing one card, so each unknown group has size 1
      expect(odds(hands, studOptions)).toEqual([
        { wins: 1206, ties: 0, total: 1560, equity: 1206 / 1560 },
        { wins: 354, ties: 0, total: 1560, equity: 354 / 1560 },
      ]);
    });
  });

  describe('validation', () => {
    const holdemOptions = {
      expectedCommunityCardCount: 5,
      expectedHoleCardCount: 2,
      minimumHoleCardsUsed: 0,
      maximumHoleCardsUsed: 2,
    };

    it('throws when the same card appears twice', () => {
      const hands: Hand[] = [
        ['As', 'Ks'],
        ['As', 'Ad'],
      ];

      expect(() => odds(hands, { ...holdemOptions, communityCards: [] })).toThrow(
        'Duplicate card: As',
      );
    });

    it('throws when a hand holds more hole cards than the game allows', () => {
      const hands: Hand[] = [
        ['As', 'Ks', 'Qs'],
        ['Jd', 'Jh'],
      ] as Hand[];

      expect(() => odds(hands, { ...holdemOptions, communityCards: [] })).toThrow(
        'Each collection of hole cards accepts a maximum of 2 elements',
      );
    });

    it('throws when the required evaluations exceed maximumEvaluations', () => {
      const hands: Hand[] = [
        ['As', 'Ks'],
        ['Jd', 'Jh'],
      ];

      expect(() =>
        odds(hands, { ...holdemOptions, communityCards: [], maximumEvaluations: 1000 }),
      ).toThrow(/exceeds maximumEvaluations \(1000\)/);
    });

    it('returns no odds when no hands are provided', () => {
      expect(odds([], { ...holdemOptions, communityCards: [] })).toEqual([]);
    });
  });

  it('splits equity across all players in tied scenarios', () => {
    const hands: Hand[] = [
      ['As', 'Kd'],
      ['Ad', 'Kh'],
      ['Ac', 'Ks'],
    ];
    const communityCards: Card[] = ['Qd', 'Jd', 'Th'];

    const results = odds(hands, {
      expectedCommunityCardCount: 5,
      expectedHoleCardCount: 2,
      minimumHoleCardsUsed: 0,
      maximumHoleCardsUsed: 2,
      communityCards,
    });

    const totalEquity = results.reduce((sum, result) => sum + result.equity, 0);
    expect(totalEquity).toBeCloseTo(1, 12);
    results.forEach((result) => {
      expect(result.wins + result.ties).toBeLessThanOrEqual(result.total);
    });
  });
});
