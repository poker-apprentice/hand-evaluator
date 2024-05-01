import { HandStrength } from '@poker-apprentice/types';
import { Bench } from 'tinybench';
import { EvaluateOptions as EvaluateHandOptions, evaluate as evaluateHand } from '../src/evaluate';
import { oddsHoldem } from '../src/helpers/oddsHoldem';

interface EvaluateOptions extends EvaluateHandOptions {
  strength: HandStrength;
}

const evaluate = ({ strength, ...options }: EvaluateOptions) => {
  const result = evaluateHand(options);
  if (result.strength !== strength) {
    throw new Error(`Expected: ${strength}, Received: ${result.strength}`);
  }
};

const benchmarkEvaluate = (bench: Bench) => {
  const holeCards = ['Tc' as const, 'Kc' as const];

  bench
    .add('evaluate high card', () => {
      const strength = HandStrength.HighCard;
      evaluate({ holeCards, communityCards: ['Qh', 'Jd', '3d', '7c', '8s'], strength });
    })
    .add('evaluate one pair', () => {
      const strength = HandStrength.OnePair;
      evaluate({ holeCards, communityCards: ['Qh', 'Jd', '3d', 'Td', '8s'], strength });
    })
    .add('evaluate two pair', () => {
      const strength = HandStrength.TwoPair;
      evaluate({ holeCards, communityCards: ['Kh', 'Jd', '3d', 'Td', '8s'], strength });
    })
    .add('evaluate three of a kind', () => {
      const strength = HandStrength.ThreeOfAKind;
      evaluate({ holeCards, communityCards: ['Kh', 'Jd', '3d', 'Kd', '8s'], strength });
    })
    .add('evaluate straight', () => {
      const strength = HandStrength.Straight;
      evaluate({ holeCards, communityCards: ['Qh', 'Jd', '3d', 'Ac', '8s'], strength });
    })
    .add('evaluate flush', async () => {
      const strength = HandStrength.Flush;
      evaluate({ holeCards, communityCards: ['Qc', 'Jd', '3c', 'Ac', '8s'], strength });
    })
    .add('evaluate full house', () => {
      const strength = HandStrength.FullHouse;
      evaluate({ holeCards, communityCards: ['Kh', 'Jd', '3d', 'Kd', 'Ts'], strength });
    })
    .add('evaluate four of a kind', () => {
      const strength = HandStrength.FourOfAKind;
      evaluate({ holeCards, communityCards: ['Kh', 'Jd', '3d', 'Kd', 'Ks'], strength });
    })
    .add('evaluate straight flush', () => {
      const strength = HandStrength.StraightFlush;
      evaluate({ holeCards, communityCards: ['Qc', 'Jc', '3d', 'Kd', '9c'], strength });
    })
    .add('evaluate royal flush', () => {
      const strength = HandStrength.RoyalFlush;
      evaluate({ holeCards, communityCards: ['Qc', 'Jc', '3d', 'Kd', 'Ac'], strength });
    });
};

const benchmarkOdds = (bench: Bench) => {
  const allHoleCardsHeadsUp = [
    ['Tc' as const, 'Kc' as const],
    ['Ah' as const, 'Ad' as const],
  ];
  const allHoleCardsMultiway = [
    ['Tc' as const, 'Kc' as const],
    ['Ah' as const, 'Ad' as const],
    ['5s' as const, '4s' as const],
    ['9h' as const, '9c' as const],
  ];

  bench
    .todo('odds holdem heads up preflop')
    .add('odds holdem heads up to flop', () => {
      oddsHoldem(allHoleCardsHeadsUp, ['Qc', 'Jc', '3d']);
    })
    .add('odds holdem heads up to turn', () => {
      oddsHoldem(allHoleCardsHeadsUp, ['Qc', 'Jc', '3d', 'Kd']);
    })
    .add('odds holdem heads up to river', () => {
      oddsHoldem(allHoleCardsHeadsUp, ['Qc', 'Jc', '3d', 'Kd', 'Ac']);
    })
    .todo('odds holdem multiway preflop')
    .add('odds holdem multiway to flop', () => {
      oddsHoldem(allHoleCardsMultiway, ['Qc', 'Jc', '3d']);
    })
    .add('odds holdem multiway to turn', () => {
      oddsHoldem(allHoleCardsMultiway, ['Qc', 'Jc', '3d', 'Kd']);
    })
    .add('odds holdem multiway to river', () => {
      oddsHoldem(allHoleCardsMultiway, ['Qc', 'Jc', '3d', 'Kd', 'Ac']);
    });
};

(async () => {
  const bench = new Bench({ throws: false });

  benchmarkEvaluate(bench);
  benchmarkOdds(bench);

  await bench.warmup(); // make results more reliable, ref: https://github.com/tinylibs/tinybench/pull/50
  await bench.run();

  console.table(bench.table());
  console.table(bench.todos.map((todo) => ({ TODO: todo.name })));
})();
