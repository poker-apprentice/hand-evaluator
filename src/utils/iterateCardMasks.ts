import { bigintKey } from './bigintKey';
import { uint } from './uint';

const deckSize = 52;

// Population Count (popcount) table (https://en.wikichip.org/wiki/population_count)
// Lookup table for counting the number of set bits (1's) in the binary
// representation of each byte value from 0 to 255.
// prettier-ignore
const bits: number[] = Array.from({length: 256}, (_, i) => {
  let count = 0;
  let n = i;
  while (n) {
    n &= n - 1; // Clear the lowest set bit
    count++;
  }
  return count;
});

// Break the given bit field into 8 individual bits & get the population count.
const getBitCount = (bitField: bigint): number =>
  bits[bigintKey(uint(bitField & 0x00000000000000ffn))] +
  bits[bigintKey(uint((bitField & 0x000000000000ff00n) >> 8n))] +
  bits[bigintKey(uint((bitField & 0x0000000000ff0000n) >> 16n))] +
  bits[bigintKey(uint((bitField & 0x00000000ff000000n) >> 24n))] +
  bits[bigintKey(uint((bitField & 0x000000ff00000000n) >> 32n))] +
  bits[bigintKey(uint((bitField & 0x0000ff0000000000n) >> 40n))] +
  bits[bigintKey(uint((bitField & 0x00ff000000000000n) >> 48n))] +
  bits[bigintKey(uint((bitField & 0xff00000000000000n) >> 56n))];

// Lookup table where each entry has exactly one bit set at position.
// Each bit position represents a specific card in a deck.
const cardMasks: bigint[] = Array.from({ length: deckSize }, (_, i) => 1n << BigInt(i));

function* iterateHandsHelper(
  knownCardsMask: bigint,
  allDeadCardsMask: bigint,
  numIterations: number,
  loopStart = deckSize,
  previousCardMask = 0n,
): Generator<bigint, void> {
  if (numIterations >= 1) {
    for (let i = loopStart - 1; i >= 0; i -= 1) {
      const cardMask = cardMasks[i];
      if ((allDeadCardsMask & cardMask) !== 0n) {
        continue;
      }
      yield* iterateHandsHelper(
        knownCardsMask,
        allDeadCardsMask,
        numIterations - 1,
        i,
        cardMask | previousCardMask,
      );
    }
  } else {
    yield previousCardMask | knownCardsMask;
  }
}

// eslint-disable-next-line jsdoc/require-jsdoc
export function* iterateCardMasks(
  knownCardsMask: bigint,
  deadCardsMask: bigint,
  cardCount: number,
): Generator<bigint, void> {
  const allDeadCardsMask = deadCardsMask | knownCardsMask;
  const numIterations = cardCount - getBitCount(knownCardsMask);

  yield* iterateHandsHelper(knownCardsMask, allDeadCardsMask, numIterations);
}
