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

TODO

## Development

TODO
