/* eslint-disable no-console */
import { HandStrength } from '@poker-apprentice/types';
import { Bench } from 'tinybench';
import { rankN } from '../src/core/rank';
import { EvaluateOptions as EvaluateHandOptions, evaluate as evaluateHand } from '../src/evaluate';
import { oddsHoldem } from '../src/helpers/oddsHoldem';
import { oddsOmaha } from '../src/helpers/oddsOmaha';

interface EvaluateOptions extends EvaluateHandOptions {
  strength: HandStrength;
}

const evaluate = ({ strength, ...options }: EvaluateOptions) => {
  const result = evaluateHand(options);
  if (result.strength !== strength) {
    throw new Error(`Expected: ${strength}, Received: ${result.strength}`);
  }
};

const benchmarkRank = (bench: Bench) => {
  // A fixed set of pseudo-random 7-card hands, exercising both flush and non-flush paths.
  const handCount = 1000;
  const hands = new Uint8Array(handCount * 7);
  let state = 0x2bad5eed;
  const nextRandom = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  const deck = Array.from({ length: 52 }, (_, id) => id);
  for (let hand = 0; hand < handCount; hand += 1) {
    for (let i = 0; i < 7; i += 1) {
      const j = i + Math.floor(nextRandom() * (52 - i));
      const swap = deck[i];
      deck[i] = deck[j];
      deck[j] = swap;
      hands[hand * 7 + i] = deck[i];
    }
  }

  const hand = new Uint8Array(7);
  bench.add(`rank 7-card hands x${handCount}`, () => {
    let total = 0;
    for (let offset = 0; offset < hands.length; offset += 7) {
      for (let i = 0; i < 7; i += 1) {
        hand[i] = hands[offset + i];
      }
      total += rankN(hand, 7);
    }
    if (total === 0) {
      throw new Error('unexpected rank sum');
    }
  });
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
    .add('odds holdem heads up preflop', () => {
      oddsHoldem(allHoleCardsHeadsUp, []);
    })
    .add('odds holdem heads up to flop', () => {
      oddsHoldem(allHoleCardsHeadsUp, ['Qc', 'Jc', '3d']);
    })
    .add('odds holdem heads up to turn', () => {
      oddsHoldem(allHoleCardsHeadsUp, ['Qc', 'Jc', '3d', 'Kd']);
    })
    .add('odds holdem heads up to river', () => {
      oddsHoldem(allHoleCardsHeadsUp, ['Qc', 'Jc', '3d', 'Kd', 'Ac']);
    })
    .add('odds holdem multiway preflop', () => {
      oddsHoldem(allHoleCardsMultiway, []);
    })
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

// Omaha preflop is the heaviest supported exact calculation (~130M evaluations); time a
// single run rather than including it in the benchmark table.
const timeOmahaPreflop = () => {
  const start = Date.now();
  oddsOmaha(
    [
      ['As', 'Ks', 'Qd', 'Jd'],
      ['9c', '9d', '6h', '6s'],
    ],
    [],
  );
  console.log(`odds omaha heads up preflop (single run): ${Date.now() - start}ms`);
};

(async () => {
  const bench = new Bench({ throws: false });

  benchmarkRank(bench);
  benchmarkEvaluate(bench);
  benchmarkOdds(bench);

  await bench.warmup(); // make results more reliable, ref: https://github.com/tinylibs/tinybench/pull/50
  await bench.run();

  console.table(bench.table());

  timeOmahaPreflop();
})();
