import { odds } from '../odds';
import { Hand } from '../types';

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
        { wins: 149, ties: 0, total: 990 },
        { wins: 841, ties: 0, total: 990 },
      ]);
    });

    it('heads-up, all hole cards provided (some ties)', () => {
      const hands: Hand[] = [
        ['As', 'Ks'],
        ['Ad', 'Kd'],
      ];

      expect(odds(hands, { ...holdemOptions, communityCards: ['Qd', 'Js', '8h'] })).toEqual([
        { wins: 45, ties: 900, total: 990 },
        { wins: 45, ties: 900, total: 990 },
      ]);
    });

    it('multi-way, all hole cards provided', () => {
      const hands: Hand[] = [
        ['As', 'Ks'],
        ['Ad', 'Kd'],
        ['Jd', 'Jh'],
      ];

      expect(odds(hands, { ...holdemOptions, communityCards: ['Qd', 'Js', '8h'] })).toEqual([
        { wins: 29, ties: 114, total: 903 },
        { wins: 28, ties: 114, total: 903 },
        { wins: 732, ties: 0, total: 903 },
      ]);
    });

    it('heads-up, not all hole cards provided', () => {
      const hands: Hand[] = [['As', 'Ks'], ['Ad']];

      expect(odds(hands, { ...holdemOptions, communityCards: ['Qd', 'Js', '8h'] })).toEqual([
        { wins: 12694, ties: 1109, total: 15180 },
        { wins: 1377, ties: 1109, total: 15180 },
      ]);
    });

    it('heads-up, not all hole cards provided', () => {
      const hands: Hand[] = [['As', 'Ks'], ['Ad']];

      expect(odds(hands, { ...holdemOptions, communityCards: ['Qd', 'Js', '8h'] })).toEqual([
        { wins: 12694, ties: 1109, total: 15180 },
        { wins: 1377, ties: 1109, total: 15180 },
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
        ['As', 'Kd', 'Ks', '8s', 'Ac'],
        ['9s', '8s', 'Ts', '6s', '4h'],
      ];

      expect(odds(hands, studOptions)).toEqual([
        { wins: 73732, ties: 0, total: 123410 },
        { wins: 49678, ties: 0, total: 123410 },
      ]);
    });
  });
});
