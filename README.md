# Poker Hand Evaluator

A collection of useful functions for determining the strongest possible hand given a coordination of cards (hole cards & community cards), the strongest effective hand when comparing two hands, and the probability of winning the hand given what cards are known.

## Usage

### Types

The following types are defined & utilized by this package.

- `EvaluatedHand`: An object representing the effective hand & strength, given a coordination of cards.
- `Odds`: An object representing how a hand will perform given a scenario. Includes the number of `wins`, `ties`, and `total` possible outcomes.

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

The `simulate` [generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/GeneratorFunction) returns a [generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator) that can be used to run as many Monte Carlo simulations as desired, limited by the maximum number of simulations that are possible for a given scenario based upon the provided inputs. (For example, if there are only 2 streets remaining to be dealt with 45 cards remaining in the deck, then there are 45 \* 44 = 1,980 possible simulations.)

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
});

let result = generate.next();
while (!result.done) {
  const hand1WinPercent = ((result[0].wins / result[0].total) * 100).toFixed(1);

  // Output the cumulative results every 500 runs.
  if (result[0].total % 500 === 0) {
    console.log(hand1WinPercent, result);
  }

  result = generate.next();
}

// => "13.8" [{ wins: 69, ties: 0, total: 500 }, { wins: 431, ties: 0, total: 500 }]
// => "13.9" [{ wins: 139, ties: 0, total: 1000 }, { wins: 861, ties: 0, total: 1000 }]
// => "15.4" [{ wins: 231, ties: 0, total: 1500 }, { wins: 1269, ties: 0, total: 1500 }]
// => "14.8" [{ wins: 295, ties: 0, total: 2000 }, { wins: 1705, ties: 0, total: 2000 }]
```

#### `odds`

Given a list of hands and community cards, determine how often each hand will win or tie.

Note: The implementation for this is exhaustive, and it is not practical for scenarios missing more than about 1-2 cards worth of data. It is strongly suggested that the [`simulate`](#simulate) function be used instead.

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
//      { wins: 304, ties: 0, total: 1980 },
//      { wins: 1676, ties: 0, total: 1980 },
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

```
┌─────────┬────────────────────────────┬───────────┬────────────────────┬───────────┬─────────┐
│ (index) │ Task Name                  │ ops/sec   │ Average Time (ns)  │ Margin    │ Samples │
├─────────┼────────────────────────────┼───────────┼────────────────────┼───────────┼─────────┤
│ 0       │ 'evaluate high card'       │ '358,770' │ 2787.2967176923685 │ '±1.11%'  │ 179386  │
│ 1       │ 'evaluate one pair'        │ '341,161' │ 2931.1632420968276 │ '±1.24%'  │ 170581  │
│ 2       │ 'evaluate two pair'        │ '327,563' │ 3052.842784921508  │ '±1.46%'  │ 163782  │
│ 3       │ 'evaluate three of a kind' │ '351,561' │ 2844.4515561978005 │ '±1.27%'  │ 175781  │
│ 4       │ 'evaluate straight'        │ '296,229' │ 3375.7574452275217 │ '±1.27%'  │ 148115  │
│ 5       │ 'evaluate flush'           │ '233,025' │ 4291.383188635845  │ '±2.55%'  │ 116564  │
│ 6       │ 'evaluate full house'      │ '453,556' │ 2204.795638044534  │ '±1.45%'  │ 226779  │
│ 7       │ 'evaluate four of a kind'  │ '418,995' │ 2386.659104143463  │ '±2.54%'  │ 209498  │
│ 8       │ 'evaluate straight flush'  │ '302,753' │ 3303.020571156977  │ '±16.37%' │ 151377  │
│ 9       │ 'evaluate royal flush'     │ '317,533' │ 3149.2775702737345 │ '±1.83%'  │ 158767  │
└─────────┴────────────────────────────┴───────────┴────────────────────┴───────────┴─────────┘
```

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

### Build package

```
yarn build
```
