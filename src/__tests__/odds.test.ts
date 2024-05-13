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
        { wins: 149, ties: 0, total: 990, equity: 0.1505050505050505 },
        { wins: 841, ties: 0, total: 990, equity: 0.8494949494949495 },
      ]);
    });

    it('heads-up, all hole cards provided (some ties)', () => {
      const hands: Hand[] = [
        ['As', 'Ks'],
        ['Ad', 'Kd'],
      ];

      expect(odds(hands, { ...holdemOptions, communityCards: ['Qd', 'Js', '8h'] })).toEqual([
        { wins: 45, ties: 900, total: 990, equity: 0.5 },
        { wins: 45, ties: 900, total: 990, equity: 0.5 },
      ]);
    });

    it('multi-way, all hole cards provided with community cards', () => {
      const hands: Hand[] = [
        ['As', 'Ks'],
        ['Ad', 'Kd'],
        ['Jd', 'Jh'],
      ];

      expect(odds(hands, { ...holdemOptions, communityCards: ['Qd', 'Js', '8h'] })).toEqual([
        { wins: 29, ties: 114, total: 903, equity: 0.09523809523809523 },
        { wins: 28, ties: 114, total: 903, equity: 0.09413067552602436 },
        { wins: 732, ties: 0, total: 903, equity: 0.8106312292358804 },
      ]);
    });

    it('multi-way, all hole cards provided without community cards', () => {
      const hands: Hand[] = [
        ['As', 'Ks'],
        ['Ad', 'Kd'],
        ['Jd', 'Jh'],
      ];

      expect(odds(hands, { ...holdemOptions, communityCards: [] })).toEqual([
        { wins: 96209, ties: 405190, total: 1370754, equity: 0.21729366951814816 },
        { wins: 79965, ties: 405190, total: 1370754, equity: 0.20544325726328697 },
        { wins: 789390, ties: 5687, total: 1370754, equity: 0.5772630732185837 },
      ]);
    });

    it('heads-up, not all hole cards provided', () => {
      const hands: Hand[] = [['As', 'Ks'], ['Ad']];

      expect(odds(hands, { ...holdemOptions, communityCards: ['Qd', 'Js', '8h'] })).toEqual([
        { wins: 29536, ties: 4136, total: 45540, equity: 0.6939833113746158 },
        { wins: 11868, ties: 4136, total: 45540, equity: 0.3060166886253843 },
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
        { wins: 1206, ties: 0, total: 1560, equity: 0.7730769230769231 },
        { wins: 354, ties: 0, total: 1560, equity: 0.22692307692307692 },
      ]);
    });
  });

  describe('game requires a specific number of hole cards to be used', () => {
    const omahaOptions = {
      communityCards: [],
      expectedCommunityCardCount: 5,
      expectedHoleCardCount: 4,
      minimumHoleCardsUsed: 2,
      maximumHoleCardsUsed: 2,
    };

    // TODO: enable this once implementation works
    it.skip('heads-up, all hole cards provided', () => {
      const hands: Hand[] = [
        ['As', 'Ks', 'Kh', 'Tc'],
        ['Ad', 'Kd', 'Qd', 'Js'],
      ];

      expect(odds(hands, { ...omahaOptions, communityCards: ['Qd', 'Js', '8h'] })).toEqual([
        { wins: 45, ties: 900, total: 990, equity: 0.5 },
        { wins: 45, ties: 900, total: 990, equity: 0.5 },
      ]);
    });

    // TODO: enable this once implementation works
    it.skip('heads-up, all hole cards provided without community cards', () => {
      const hands: Hand[] = [
        ['As', 'Ks', 'Kh', 'Tc'],
        ['Ad', 'Kd', 'Qc', 'Jc'],
      ];

      expect(odds(hands, { ...omahaOptions, communityCards: [] })).toEqual([
        { wins: 45, ties: 900, total: 990, equity: 0.5 },
        { wins: 45, ties: 900, total: 990, equity: 0.5 },
      ]);
    });
  });
});
