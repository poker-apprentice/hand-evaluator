# Poker Hand Evaluator

A collection of useful functions for determining the strongest possible hand given a coordination of cards (hole cards & community cards), the strongest effective hand when comparing two hands, and the probability of winning the hand given what cards are known.

## What's new in v4

Version 4 replaces the hand-evaluation core with an integer-based, lookup-table evaluator and rewrites `odds` to enumerate card combinations instead of permutations. Exact odds calculations are now typically 100&times; or more faster, and previously infeasible calculations (such as exact preflop odds) complete in well under a second. Breaking changes:

- **`Odds` totals are smaller (combination basis).** v3 counted every ordering of the unknown cards as a separate scenario; v4 counts every distinct combination once. All percentages are unchanged: every `wins`/`ties`/`total` value is simply divided by a constant factor.
- **`Odds` includes an `equity` field**: the hand's share of the pot across all evaluated scenarios (ties split the pot), so each scenario's equities always sum to 1. Prefer `equity` over `wins / total` when ties matter.
- **`odds` validates its input.** Duplicate cards and hands holding more cards than the game allows now throw instead of producing meaningless results.
- **`odds` refuses unbounded work.** If a calculation would require more than `maximumEvaluations` hand evaluations (default 500 million), it throws; use `simulate` instead, or raise the limit.
- **`simulate` is now an infinite generator.** It samples scenarios with replacement and never exhausts; consumers stop iterating when satisfied. A `samplesPerUpdate` option controls how many scenarios are evaluated per yield.
- **A straight-flush detection bug is fixed.** v3 could report a flush for hands of 6+ cards containing a straight flush whose lowest card shared a rank with another card (e.g. `Kh Qh Jh Th 9h 9d 3s`).

## Usage

### Types

The following types are defined & utilized by this package.

- `EvaluatedHand`: An object representing the effective hand & strength, given a coordination of cards.
- `Odds`: An object representing how a hand will perform given a scenario. Includes the number of `wins`, `ties`, and `total` evaluated outcomes, plus the hand's overall pot `equity` (between 0 and 1, with tied outcomes contributing a partial share).

### Core Functions

#### `evaluate`

Given a list of hole cards and (optionally) community cards, determine the best possible poker hand and the strength of that hand.

```ts
import { evaluate } from '@poker-apprentice/hand-evaluator';
import { HandStrength } from '@poker-apprentice/types';

const result = evaluate({
  holeCards: ['As', 'Qd'],
  communityCard: ['Js', 'Kc', 'Td'],
});

console.log(result);
// => { hand: ['As', 'Kc', 'Qd', 'Js', 'Td'], strength: 6 };

console.log(result.strength === HandStrength.Straight);
// => true
```

Note that the `evaluate` does not require 5 cards to determine the best hand. The best hand possible with fewer cards or more cards can be determined as well.

```ts
console.log(evaluate({ holeCards: ['As', 'Ad'] }));
// => { hand: ['As', 'Ad'], strength: 9 };

console.log(
  evaluate({
    holeCards: ['9s', '8s'],
    communityCards: ['5d', '6d', '6c', '7c', '2h'],
  }),
);
// => { hand: ['9s', '8s', '7c', '6d', '5d'], strength: 6 };
```

By default, the `evaluate` function allows any number of hole cards or community cards to be used when determining the best possible poker hand. If a specific number of hole cards must be used (e.g.: exactly 2 cards in Omaha or up to 2 cards in Pineapple), then the `minimumHoleCards` and `maximumHoleCards` options can be provided.

```ts
const omahaHand = evaluate({
  holeCards: ['As', 'Kd', 'Td', '2s'],
  communityCards: ['Js', '4s', '3d', '5d', 'Ah'],
  minimumHoleCards: 2,
  maximumHoleCards: 2,
});
console.log(omahaHand);
// => { hand: ['5d', '4s', '3d', '2s', 'As'], strength: 6 }

const pineappleHand = evaluate({
  holeCards: ['Jc', 'Tc', '7d'],
  communityCards: ['9h', '8c', '2d'],
  maximumHoleCards: 2,
});
console.log(pineappleHand);
// => { hand: ['Jc', 'Tc', '9h', '8c', '2d'], strength: 10 }
```

#### `compare`

Given two evaluated hands, returns -1, 0, or 1 to represent the stronger hand.

```ts
import { compare, evaluate } from '@poker-apprentice/hand-evaluator';

const hand1 = evaluate({ holeCards: ['9s', '8s', '5d', '6d', '6c', '7c', '2h'] });
const hand2 = evaluate({ holeCards: [] });
const result = compare(hand1, hand2);

console.log(result);
// => -1
```

This function can be used to sort any number of hands in an array.

```ts
import { compare, evaluate } from '@poker-apprentice/hand-evaluator';

const communityCards = ['Qs', 'Js', '7d'];
const result = [
  evaluate({ holeCards: ['As', 'Qd'], communityCards }),
  evaluate({ holeCards: ['Ac', 'Tc'], communityCards }),
  evaluate({ holeCards: ['9s', '8s'], communityCards }),
].sort(compare);
```

#### `simulate` (alias: `oddsAsync`)

Given a list of hands and community cards, estimate how often each hand will win or tie using a [Monte Carlo simulation](https://en.wikipedia.org/wiki/Monte_Carlo_method) for roughly estimating the odds of a hand winning or tying.

The `simulate` [generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/GeneratorFunction) returns a [generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator) that yields cumulative results indefinitely; consumers decide when the accumulated sample count (and therefore the accuracy of `equity`) is sufficient and stop iterating. The accuracy of a Monte Carlo estimate improves with the square root of the sample count: 10,000 samples bound the standard error of `equity` to about half a percent. An optional `samplesPerUpdate` option (default 1) controls how many random scenarios are evaluated between yields.

```ts
import { Hand, simulate } from '@poker-apprentice/hand-evaluator';

const hand1: Hand = ['As', 'Ks'];
const hand2: Hand = ['Jd', 'Jh'];

const generate = simulate({
  allHoleCards: [hand1, hand2],
  communityCards: ['Qd', 'Js', '8d'],
  expectedCommunityCardCount: 5,
  expectedHoleCardCount: 2,
  minimumHoleCardsUsed: 0,
  maximumHoleCardsUsed: 2,
  samplesPerUpdate: 1000,
});

for (const result of generate) {
  console.log((result[0].equity * 100).toFixed(1), result);
  if (result[0].total >= 3000) {
    break;
  }
}

// => "13.8" [{ wins: 138, ties: 0, total: 1000, equity: 0.138 }, ...]
// => "14.4" [{ wins: 288, ties: 0, total: 2000, equity: 0.144 }, ...]
// => "15.1" [{ wins: 453, ties: 0, total: 3000, equity: 0.151 }, ...]
```

#### `odds`

Given a list of hands and community cards, determine exactly how often each hand will win or tie by exhaustively enumerating every possible combination of the unknown cards (any unspecified hole cards plus the remaining community cards).

Exact enumeration is fast enough for any hold'em scenario, including exact preflop odds, as well as omaha/pineapple/stud scenarios with a typical number of unknown cards. Because the work grows combinatorially with the number of unknown cards, `odds` throws if a calculation would require more than `maximumEvaluations` hand evaluations (500 million by default, roughly several seconds of computation); the [`simulate`](#simulate-alias-oddsasync) function handles such scenarios in bounded time instead.

```ts
import { Hand, odds } from '@poker-apprentice/hand-evaluator';

const hand1: Hand = ['As', 'Ks'];
const hand2: Hand = ['Jd', 'Jh'];

const result = odds([hand1, hand2], {
  communityCards: ['Qd', 'Js', '8d'],
  expectedCommunityCardCount: 5,
  expectedHoleCardCount: 2,
  minimumHoleCardsUsed: 0,
  maximumHoleCardsUsed: 2,
});

console.log(result);
// => [
//      { wins: 149, ties: 0, total: 990, equity: 0.1505... },
//      { wins: 841, ties: 0, total: 990, equity: 0.8494... },
//    ]
```

### Helper Functions

In addition to the core functions, there are some poker game-specific functions that wrap these core functions for ease of use. These functions are effectively the same as calling the `evaluate` of `odds` function directly with the appropriate option values prepopulated.

The functions also perform appropriate error checking/throwing to ensure that the `holeCards` and `communityCards` are of the correct length for each game.

#### `evaluateHoldem`

Evaluates a hand of Texas Hold'em.

```ts
import { evaluateHoldem } from '@poker-apprentice/hand-evaluator';
const hand = evaluateHoldem({
  holeCards: ['As', 'Kd'],
  communityCards: ['9h', '8d', '2c'],
});
```

#### `evaluateOmaha`

Evaluates a hand of Omaha.

```ts
import { evaluateOmaha } from '@poker-apprentice/hand-evaluator';
const hand = evaluateOmaha({
  holeCards: ['Jc', 'Qd', '4h', '7c'],
  communityCards: ['2c', 'Qs', '4c'],
});
```

#### `evaluatePineapple`

Evaluates a hand of Pineapple.

```ts
import { evaluatePineapple } from '@poker-apprentice/hand-evaluator';
const hand = evaluatePineapple({
  holeCards: ['Jc', '7h', 'Qh'],
  communityCards: ['9h', '8d', '2c', '3h', 'Td'],
});
```

#### `evaluateStud`

Evaluates a hand of Stud.

```ts
import { evaluateStud } from '@poker-apprentice/hand-evaluator';
const hand = evaluateStud({ holeCards: ['As', 'Kd', 'Ks', '8s', 'Ac', 'Kh', '4d'] });
```

#### `oddsHoldem`

Calculates the odds of winning or tying a hand of Texas Hold'em.

```ts
import { oddsHoldem } from '@poker-apprentice/hand-evaluator';
const allHoleCards = [
  ['As', 'Kd'],
  ['Ks', '8s'],
];
const communityCards = ['Ts', 'Qs', 'Jd'];
const result = oddsHoldem(allHoleCards, communityCards);
```

#### `oddsOmaha`

Calculates the odds of winning or tying a hand of Omaha.

```ts
import { oddsOmaha } from '@poker-apprentice/hand-evaluator';
const allHoleCards = [
  ['As', 'Kd', 'Td', 'Tc'],
  ['Ks', '8s', '9h', 'Kc'],
];
const communityCards = ['Ts', 'Qs', 'Jd'];
const result = oddsOmaha(allHoleCards, communityCards);
```

#### `oddsPineapple`

Calculates the odds of winning or tying a hand of Pineapple.

```ts
import { oddsPineapple } from '@poker-apprentice/hand-evaluator';
const allHoleCards = [
  ['As', 'Kd', 'Td'],
  ['Ks', '8s', 'Kc'],
];
const communityCards = ['Ts', 'Qs', 'Jd'];
const result = oddsPineapple(allHoleCards, communityCards);
```

#### `oddsStud`

Calculates the odds of winning or tying a hand of Stud.

```ts
import { oddsStud } from '@poker-apprentice/hand-evaluator';
const allHoleCards = [
  ['As', 'Kd', 'Ks', '8s', 'Ac'],
  ['9s', '8s', 'Ts', '6s', '4h'],
];
const result = oddsStud(allHoleCards);
```

#### `simulateHoldem` (alias: `oddsHoldemAsync`)

Estimates the odds of winning or tying a hand of Texas Hold'em.

```ts
import { simulateHoldem } from '@poker-apprentice/hand-evaluator';
const abort = simulateHoldem({
  allHoleCards: [
    ['As', 'Kd'],
    ['Ks', '8s'],
  ],
  communityCards: ['Ts', 'Qs', 'Jd'],
  callback: (result) => console.log(result),
});
```

#### `simulateOmaha` (alias: `oddsOmahaAsync`)

Estimates the odds of winning or tying a hand of Omaha.

```ts
import { simulateOmaha } from '@poker-apprentice/hand-evaluator';
const abort = simulateOmaha({
  allHoleCards: [
    ['As', 'Kd', 'Td', 'Tc'],
    ['Ks', '8s', '9h', 'Kc'],
  ],
  communityCards: ['Ts', 'Qs', 'Jd'],
  callback: (result) => console.log(result),
});
```

#### `simulatePineapple` (alias: `oddsPineappleAsync`)

Estimates the odds of winning or tying a hand of Pineapple.

```ts
import { simulatePineapple } from '@poker-apprentice/hand-evaluator';
const abort = simulatePineapple({
  allHoleCards: [
    ['As', 'Kd', 'Td'],
    ['Ks', '8s', 'Kc'],
  ],
  communityCards: ['Ts', 'Qs', 'Jd'],
  callback: (result) => console.log(result),
});
```

#### `simulateStud` (alias: `oddsStudAsync`)

Estimates the odds of winning or tying a hand of Stud.

```ts
import { simulateStud } from '@poker-apprentice/hand-evaluator';
const abort = simulateStud({
  allHoleCards: [
    ['As', 'Kd', 'Ks', '8s', 'Ac'],
    ['9s', '8s', 'Ts', '6s', '4h'],
  ],
  callback: (result) => console.log(result),
});
```

## Benchmarks

Benchmarked on an Apple M3 Pro MacBook Pro with 36 GB RAM using macOS 26.3. The `rank 7-card hands x1000` entry measures the raw integer evaluation core: roughly 17 million 7-card evaluations per second.

```
┌─────────┬─────────────────────────────────┬─────────────┬────────────────────┬──────────┬─────────┐
│ (index) │ Task Name                       │ ops/sec     │ Average Time (ns)  │ Margin   │ Samples │
├─────────┼─────────────────────────────────┼─────────────┼────────────────────┼──────────┼─────────┤
│ 0       │ 'rank 7-card hands x1000'       │ '17,469'    │ 57242.98030910736  │ '±0.33%' │ 8735    │
│ 1       │ 'evaluate high card'            │ '372,657'   │ 2683.4286450320797 │ '±1.06%' │ 186329  │
│ 2       │ 'evaluate one pair'             │ '356,630'   │ 2804.023262073522  │ '±1.08%' │ 178316  │
│ 3       │ 'evaluate two pair'             │ '351,262'   │ 2846.8759280766467 │ '±1.10%' │ 175632  │
│ 4       │ 'evaluate three of a kind'      │ '371,246'   │ 2693.628033011023  │ '±1.28%' │ 185624  │
│ 5       │ 'evaluate straight'             │ '322,263'   │ 3103.0502196974144 │ '±1.10%' │ 161132  │
│ 6       │ 'evaluate flush'                │ '275,550'   │ 3629.0987835290484 │ '±1.79%' │ 137776  │
│ 7       │ 'evaluate full house'           │ '445,537'   │ 2244.481539175176  │ '±1.27%' │ 222769  │
│ 8       │ 'evaluate four of a kind'       │ '425,380'   │ 2350.8354561316937 │ '±1.38%' │ 212691  │
│ 9       │ 'evaluate straight flush'       │ '400,452'   │ 2497.174027479272  │ '±1.27%' │ 200227  │
│ 10      │ 'evaluate royal flush'          │ '367,500'   │ 2721.0844838944336 │ '±1.61%' │ 183751  │
│ 11      │ 'odds holdem heads up preflop'  │ '3'         │ 282591000.0999999  │ '±0.17%' │ 10      │
│ 12      │ 'odds holdem heads up to flop'  │ '6,266'     │ 159580.0124441858  │ '±0.80%' │ 3134    │
│ 13      │ 'odds holdem heads up to turn'  │ '127,494'   │ 7843.473771725035  │ '±1.10%' │ 63748   │
│ 14      │ 'odds holdem heads up to river' │ '1,233,295' │ 810.8355357993083  │ '±1.46%' │ 616657  │
│ 15      │ 'odds holdem multiway preflop'  │ '2'         │ 337363508.4000001  │ '±0.31%' │ 10      │
│ 16      │ 'odds holdem multiway to flop'  │ '3,996'     │ 250215.8009003975  │ '±0.76%' │ 1999    │
│ 17      │ 'odds holdem multiway to turn'  │ '78,286'    │ 12773.530732691279 │ '±0.95%' │ 39144   │
│ 18      │ 'odds holdem multiway to river' │ '922,248'   │ 1084.3067497948107 │ '±1.47%' │ 461125  │
└─────────┴─────────────────────────────────┴─────────────┴────────────────────┴──────────┴─────────┘
odds omaha heads up preflop (single run): 7986ms
```

For comparison, v3 measured 60 ops/sec for `odds holdem heads up to flop` (now 6,266) and could not complete preflop calculations at all; exact heads-up preflop odds now take under 300ms.

## Development

Contributions are welcome. Please create an issue in the project first to discuss any possible enhancements, bugs, or other changes prior to submitting a pull request. Alternatively, browse existing issues if interested in providing a fix.

### Environment Setup

1. Install [yarn](https://classic.yarnpkg.com/lang/en/docs/install/) and [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git).
2. Clone this repository: `git clone git@github.com:poker-apprentice/hand-evaluator.git`
3. Install dependencies: `yarn install`

### Run tests

To run the full test suite:

```
yarn test
```

To run a specific test:

```
yarn test compare.test.ts           # matches test file name
yarn test -t "compare"              # matches test name/description
```

**NOTE:** Profiling is disabled until Node v20 is supported, per [this GitHub issue](https://github.com/hyj1991/v8-profiler-next/issues/65).

To run tests and run profiler:

```
yarn test:profile                   # runs full test suite
yarn test:profile compare.test.ts   # matches test file name
yarn test:profile -t "compare"      # matches test name/description
```

This will create one `.cpuprofile` file per test under the `profiles/` folder. To open these files in Google Chrome:

1. Navigate to [chrome://inspect].
2. Click "Open dedicated DevTools for Node".
3. Select the "Profiler" tab.
4. Click the "Load" button, and select your file.

To remove old `.cpuprofile` files:

```
yarn clean
```

### Run linter

```
yarn lint
```

### Run formatter

```
yarn format
```

### Run benchmarking

```
yarn benchmark
```

### Regenerate lookup tables

The hand-rank lookup tables in `src/core/tables/tables.generated.ts` are checked in and rarely need to change. If the generator (`scripts/generateTables.ts`) is modified, regenerate them with:

```
yarn generate:tables
```

The generator validates itself: it asserts the canonical 7,462 hand equivalence classes, their category boundaries and frequencies, and that the perfect hash fills every table slot exactly once.

### Build package

```
yarn build
```
