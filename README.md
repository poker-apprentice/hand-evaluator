# poker-hand-evaluator

A collection of useful functions for determining the strongest possible hand given a coordination of cards (hole cards & community cards), the strongest effective hand when comparing two hands, and the probability of winning the hand given what cards are known.

## Usage

### Types

The following is a list of significant type definitions defined & utilized by this package.

- `Card`: A 2-character string representing the rank & suit of a card. (e.g.: "2s" for the 10 of spades).
  - Ranks: 2, 3, 4, 5, 6, 7, 8, 9, T, J, Q, K, A
  - Suits: c, d, h, s
- `Hand`: An array of cards.
- `EvaluatedHand`: An object representing the effective hand & strength, given a coordination of cards.
- `Strength`: An enumeration of hand strengths.
  - `Strength.ROYAL_FLUSH`
  - `Strength.STRAIGHT_FLUSH`
  - `Strength.FOUR_OF_A_KIND`
  - `Strength.FULL_HOUSE`
  - `Strength.FLUSH`
  - `Strength.STRAIGHT`
  - `Strength.THREE_OF_A_KIND`
  - `Strength.TWO_PAIR`
  - `Strength.ONE_PAIR`
  - `Strength.HIGH_CARD`

### Core Functions

#### `evaluate`

Given a list of hole cards and (optionally) community cards, determine the best possible poker hand and the strength of that hand.

```ts
import { evaluate, Strength } from 'poker-hand-evaluator';

const result = evaluate({
  holeCards: ['As', 'Qd'],
  communityCard: ['Js', 'Kc', 'Td'],
});

console.log(result);
// => { hand: ['As', 'Kc', 'Qd', 'Js', 'Td'], strength: 6 };

console.log(result.strength === Strength.STRAIGHT);
// => true
```

Note that the `evaluate` does not require 5 cards to determine the best hand.  The best hand possible with fewer cards or more cards can be determined as well.

```ts
console.log(evaluate({ holeCards: ['As', 'Ad'] }));
// => { hand: ['As', 'Ad'], strength: 9 };

console.log(evaluate({
  holeCards: ['9s', '8s'],
  communityCards: ['5d', '6d', '6c', '7c', '2h'],
}));
// => { hand: ['9s', '8s', '7c', '6d', '5d'], strength: 6 };
```

By default, the `evaluate` function allows any number of hole cards or community cards to be used when determining the best possible poker hand.  If a specific number of hole cards must be used (e.g.: exactly 2 cards in Omaha or up to 2 cards in Pineapple), then the `minimumHoleCards` and `maximumHoleCards` options can be provided.

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
import { compare, evaluate } from 'poker-hand-evaluator';

const hand1 = evaluate({ holeCards: ['9s', '8s', '5d', '6d', '6c', '7c', '2h'] });
const hand2 = evaluate({ holeCards: [] });
const result = compare(hand1, hand2);

console.log(result);
// => -1
```

This function can be used to sort any number of hands in an array.

```ts
import { compare, evaluate } from 'poker-hand-evaluator';

const communityCards = ['Qs', 'Js', '7d'];
const result = [
  evaluate({ holeCards: ['As', 'Qd'], communityCards }),
  evaluate({ holeCards: ['Ac', 'Tc'], communityCards }),
  evaluate({ holeCards: ['9s', '8s'], communityCards }),
].sort(compare);
```

#### `odds`

Given a list of hands and community cards, determine how often each hand will win or tie.

Note: The implementation for this is currently exhaustive, and is not practical for scenarios missing more than about 1-2 cards worth of data.  A future enhancement will most likely utilize Monte Carlo simulations to approximate the results instead.

```ts
import { Hand, odds } from 'pokher-hand-evaluator';

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
//      { wins: 149, ties: 0, total: 990 },
//      { wins: 841, ties: 0, total: 990 },
//    ]
```

### Helper Functions

In addition to the core functions, there are some poker game-specific functions that wrap these core functions for ease of use.  These functions are effectively the same as calling the `evaluate` of `odds` function directly with the appropriate option values prepopulated.

The functions also perform appropriate error checking/throwing to ensure that the `holeCards` and `communityCards` are of the correct length for each game.

#### `evaluateHoldem`

Evaluates a hand of Texas Hold'em.

```ts
import { evaluateHoldem } from 'poker-hand-evaluator';
const hand = evaluateHoldem({
  holeCards: ['As', 'Kd'],
  communityCards: ['9h', '8d', '2c'],
});
```

#### `evaluateOmaha`

Evaluates a hand of Omaha.

```ts
import { evaluateOmaha } from 'poker-hand-evaluator';
const hand = evaluateOmaha({
  holeCards: ['Jc', 'Qd', '4h', '7c'],
  communityCards: ['2c', 'Qs', '4c'],
});
```

#### `evaluatePineapple`

Evaluates a hand of Pineapple.

```ts
import { evaluatePineapple } from 'poker-hand-evaluator';
const hand = evaluatePineapple({
  holeCards: ['Jc', '7h', 'Qh'],
  communityCards: ['9h', '8d', '2c', '3h', 'Td'],
});
```

#### `evaluateStud`

Evaluates a hand of Stud.

```ts
import { evaluateStud } from 'poker-hand-evaluator';
const hand = evaluateStud({ holeCards: ['As', 'Kd', 'Ks', '8s', 'Ac', 'Kh', '4d'] });
```

#### `oddsHoldem`

Calculates the odds of winning or tying a hand of Texas Hold'em.

```ts
import { oddsHoldem } from 'poker-hand-evaluator';
const allHoleCards = [['As', 'Kd'], ['Ks', '8s']];
const communityCards = ['Ts', 'Qs', 'Jd'];
const result = oddsHoldem(allHoleCards, communityCards);
```

#### `oddsHoldem`

Calculates the odds of winning or tying a hand of Omaha.

```ts
import { oddsOmaha } from 'poker-hand-evaluator';
const allHoleCards = [['As', 'Kd', 'Td', 'Tc'], ['Ks', '8s', '9h', 'Kc']];
const communityCards = ['Ts', 'Qs', 'Jd'];
const result = oddsOmaha(allHoleCards, communityCards);
```

#### `oddsPineapple`

Calculates the odds of winning or tying a hand of Pineapple.

```ts
import { oddsPineapple } from 'poker-hand-evaluator';
const allHoleCards = [['As', 'Kd', 'Td'], ['Ks', '8s', 'Kc']];
const communityCards = ['Ts', 'Qs', 'Jd'];
const result = oddsPineapple(allHoleCards, communityCards);
```

#### `oddsStud`

Calculates the odds of winning or tying a hand of Stud.

```ts
import { oddsStud } from 'poker-hand-evaluator';
const allHoleCards = [
  ['As', 'Kd', 'Ks', '8s', 'Ac'],
  ['9s', '8s', 'Ts', '6s', '4h'],
];
const result = oddsStud(allHoleCards);
```

## Development

Contributions are welcome.  Please create an issue in the project first to discuss any possible enhancements, bugs, or other changes prior to submitting a pull request.  Alternatively, browse existing issues if interested in providing a fix.

### Environment Setup

1. Install [yarn](https://classic.yarnpkg.com/lang/en/docs/install/) and [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git).
2. Clone this repository: `git clone git@github.com:mhuggins/poker-hand-evaluator.git`
3. Install dependencies: `yarn install`

### Run tests

To run the full test suite:

```
yarn test
```

To run a specific test:

```
yarn test compare           # matches test description
yarn test compare.test.ts   # matches test file name
```

### Run linter

```
yarn lint
```

### Run formatter

```
yarn format
```

### Build package

```
yarn build
```
