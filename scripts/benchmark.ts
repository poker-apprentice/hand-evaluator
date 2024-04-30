import { HandStrength } from '@poker-apprentice/types';
import { Bench } from 'tinybench';
import { EvaluateOptions, evaluate } from '../src/evaluate';

interface AssertOptions extends EvaluateOptions {
  strength: HandStrength;
}

const assert = ({ strength, ...options }: AssertOptions) => {
  const result = evaluate(options);
  if (result.strength !== strength) {
    throw new Error(`Expected: ${strength}, Received: ${result.strength}`);
  }
};

(async () => {
  const bench = new Bench({ throws: false });

  const holeCards = ['Tc' as const, 'Kc' as const];

  bench
    .add('evaluate high card', () => {
      const strength = HandStrength.HighCard;
      assert({ holeCards, communityCards: ['Qh', 'Jd', '3d', '7c', '8s'], strength });
    })
    .add('evaluate one pair', () => {
      const strength = HandStrength.OnePair;
      assert({ holeCards, communityCards: ['Qh', 'Jd', '3d', 'Td', '8s'], strength });
    })
    .add('evaluate two pair', () => {
      const strength = HandStrength.TwoPair;
      assert({ holeCards, communityCards: ['Kh', 'Jd', '3d', 'Td', '8s'], strength });
    })
    .add('evaluate three of a kind', () => {
      const strength = HandStrength.ThreeOfAKind;
      assert({ holeCards, communityCards: ['Kh', 'Jd', '3d', 'Kd', '8s'], strength });
    })
    .add('evaluate straight', () => {
      const strength = HandStrength.Straight;
      assert({ holeCards, communityCards: ['Qh', 'Jd', '3d', 'Ac', '8s'], strength });
    })
    .add('evaluate flush', async () => {
      const strength = HandStrength.Flush;
      assert({ holeCards, communityCards: ['Qc', 'Jd', '3c', 'Ac', '8s'], strength });
    })
    .add('evaluate full house', () => {
      const strength = HandStrength.FullHouse;
      assert({ holeCards, communityCards: ['Kh', 'Jd', '3d', 'Kd', 'Ts'], strength });
    })
    .add('evaluate four of a kind', () => {
      const strength = HandStrength.FourOfAKind;
      assert({ holeCards, communityCards: ['Kh', 'Jd', '3d', 'Kd', 'Ks'], strength });
    })
    .add('evaluate straight flush', () => {
      const strength = HandStrength.StraightFlush;
      assert({ holeCards, communityCards: ['Qc', 'Jc', '3d', 'Kd', '9c'], strength });
    })
    .add('evaluate royal flush', () => {
      const strength = HandStrength.RoyalFlush;
      assert({ holeCards, communityCards: ['Qc', 'Jc', '3d', 'Kd', 'Ac'], strength });
    });

  await bench.warmup(); // make results more reliable, ref: https://github.com/tinylibs/tinybench/pull/50
  await bench.run();

  console.table(bench.table());
})();
