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

### Functions

#### `evaluate`

Given a hand (array of cards), 

```ts
import { evaluate, Strength } from 'poker-hand-evaluator';

const hand = ['As', 'Qd', 'Js', 'Kc', 'Td'];
const result = evaluate(hand);

console.log(result);
// => { hand: ['As', 'Kc', 'Qd', 'Js', 'Td'], strength: 6 };

console.log(result.strength === Strength.STRAIGHT);
// => true
```

#### `compare`

Given two evaluated hands, returns -1, 0, or 1 to represent the stronger hand.

```ts
const hand1 = evaluate([]);
const hand2 = evaluate([]);
const result = compare(hand1, hand2);

console.log(result);
// => -1
```

#### `odds`

TODO

## Development

TODO
