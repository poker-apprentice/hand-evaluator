import { HandStrength, Rank, Suit } from '@poker-apprentice/types';

const SUIT_CLUBS = 0n;
const SUIT_DIAMONDS = 1n;
const SUIT_HEARTS = 2n;
const SUIT_SPADES = 3n;

export const MASK_OFFSET_CLUBS = 13n * SUIT_CLUBS;
export const MASK_OFFSET_DIAMONDS = 13n * SUIT_DIAMONDS;
export const MASK_OFFSET_HEARTS = 13n * SUIT_HEARTS;
export const MASK_OFFSET_SPADES = 13n * SUIT_SPADES;

export const RANK_MASK = 0b1111111111111n;

export const CARD_BIT_WIDTH = 4n;
export const CARD_5_BIT_SHIFT = 0n;
export const CARD_4_BIT_SHIFT = CARD_BIT_WIDTH + CARD_5_BIT_SHIFT; // 4n
export const CARD_3_BIT_SHIFT = CARD_BIT_WIDTH + CARD_4_BIT_SHIFT; // 8n
export const CARD_2_BIT_SHIFT = CARD_BIT_WIDTH + CARD_3_BIT_SHIFT; // 12n
export const CARD_1_BIT_SHIFT = CARD_BIT_WIDTH + CARD_2_BIT_SHIFT; // 16n
export const HAND_MASK_BIT_SHIFT = 24n;

export const CARD_MASK = 0x0fn;
export const CARD_1_MASK = 0x000f0000n;
export const CARD_2_MASK = 0x0000f000n;
export const CARD_3_MASK = 0x00000f00n;
export const CARD_4_MASK = 0x000000f0n;
export const CARD_5_MASK = 0x0000000fn;

export const HAND_MASK_HIGH_CARD = BigInt(HandStrength.HighCard) << HAND_MASK_BIT_SHIFT;
export const HAND_MASK_ONE_PAIR = BigInt(HandStrength.OnePair) << HAND_MASK_BIT_SHIFT;
export const HAND_MASK_TWO_PAIR = BigInt(HandStrength.TwoPair) << HAND_MASK_BIT_SHIFT;
export const HAND_MASK_THREE_OF_A_KIND = BigInt(HandStrength.ThreeOfAKind) << HAND_MASK_BIT_SHIFT;
export const HAND_MASK_STRAIGHT = BigInt(HandStrength.Straight) << HAND_MASK_BIT_SHIFT;
export const HAND_MASK_FLUSH = BigInt(HandStrength.Flush) << HAND_MASK_BIT_SHIFT;
export const HAND_MASK_FULL_HOUSE = BigInt(HandStrength.FullHouse) << HAND_MASK_BIT_SHIFT;
export const HAND_MASK_FOUR_OF_A_KIND = BigInt(HandStrength.FourOfAKind) << HAND_MASK_BIT_SHIFT;
export const HAND_MASK_STRAIGHT_FLUSH = BigInt(HandStrength.StraightFlush) << HAND_MASK_BIT_SHIFT;

export const RANK_BITS_MAP: Record<Rank, bigint> = {
  '2': 0n,
  '3': 1n,
  '4': 2n,
  '5': 3n,
  '6': 4n,
  '7': 5n,
  '8': 6n,
  '9': 7n,
  T: 8n,
  J: 9n,
  Q: 10n,
  K: 11n,
  A: 12n,
};

export const SUIT_BITS_MAP: Record<Suit, bigint> = {
  c: 0n,
  d: 1n,
  h: 2n,
  s: 3n,
};
