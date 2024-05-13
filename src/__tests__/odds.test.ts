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

      // TODO: these equity values does not add up to 100%!!
      expect(odds(hands, { ...holdemOptions, communityCards: ['Qd', 'Js', '8h'] })).toEqual([
        { wins: 29536, ties: 4136, total: 45540, equity: 0.6490040470283204 },
        { wins: 11868, ties: 4136, total: 45540, equity: 0.2610290861911965 },
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
        { wins: 1206, ties: 0, total: 1560, equity: 0.7735727098575103 },
        { wins: 354, ties: 0, total: 1560, equity: 0.2270687272250464 },
      ]);
    });
  });
});
