import { Hand } from '@poker-apprentice/types';
import { odds } from '../odds';

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

      expect(odds(hands, { ...holdemOptions, communityCards: ['Qd', 'Js', '8d'] })).toEqual([
        { wins: 298, ties: 0, total: 1980 },
        { wins: 1682, ties: 0, total: 1980 },
      ]);
    });

    it('heads-up, all hole cards provided (some ties)', () => {
      const hands: Hand[] = [
        ['As', 'Ks'],
        ['Ad', 'Kd'],
      ];

      expect(odds(hands, { ...holdemOptions, communityCards: ['Qd', 'Js', '8h'] })).toEqual([
        { wins: 90, ties: 1800, total: 1980 },
        { wins: 90, ties: 1800, total: 1980 },
      ]);
    });

    it('multi-way, all hole cards provided', () => {
      const hands: Hand[] = [
        ['As', 'Ks'],
        ['Ad', 'Kd'],
        ['Jd', 'Jh'],
      ];

      expect(odds(hands, { ...holdemOptions, communityCards: ['Qd', 'Js', '8h'] })).toEqual([
        { wins: 58, ties: 228, total: 1806 },
        { wins: 56, ties: 228, total: 1806 },
        { wins: 1464, ties: 0, total: 1806 },
      ]);
    });

    it('heads-up, not all hole cards provided', () => {
      const hands: Hand[] = [['As', 'Ks'], ['Ad']];

      expect(odds(hands, { ...holdemOptions, communityCards: ['Qd', 'Js', '8h'] })).toEqual([
        { wins: 59072, ties: 8272, total: 91080 },
        { wins: 23736, ties: 8272, total: 91080 },
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
        { wins: 1, ties: 0, total: 1 },
        { wins: 0, ties: 0, total: 1 },
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

      expect(odds(hands, studOptions)).toEqual([
        { wins: 1206, ties: 0, total: 1560 },
        { wins: 354, ties: 0, total: 1560 },
      ]);
    });
  });
});
