import { Card, Hand, HandStrength, Suit, getRank, getSuit } from '@poker-apprentice/types';
import { assertNever } from 'assert-never';
import findKey from 'lodash/findKey';
import { compare } from './compare';
import { BITS_TABLE } from './constants/bits';
import { STRAIGHT_TABLE } from './constants/straights';
import { TOP_FIVE_CARDS_TABLE } from './constants/topFiveCards';
import { TOP_CARD_TABLE } from './constants/topCard';
import { EvaluatedHand } from './types';
import { getCombinations } from './utils/getCombinations';
import { getHandMask, getMaskedCardRank } from './utils/getHandMask';
import { rankOrder } from './constants/rankOrder';

export interface EvaluateOptions {
  holeCards: Card[];
  communityCards?: Card[];
  minimumHoleCards?: number;
  maximumHoleCards?: number;
}

const HAND_SIZE = 5;

const SUIT_CLUBS = 0n;
const SUIT_DIAMONDS = 1n;
const SUIT_HEARTS = 2n;
const SUIT_SPADES = 3n;

const MASK_OFFSET_CLUBS = 13n * SUIT_CLUBS;
const MASK_OFFSET_DIAMONDS = 13n * SUIT_DIAMONDS;
const MASK_OFFSET_HEARTS = 13n * SUIT_HEARTS;
const MASK_OFFSET_SPADES = 13n * SUIT_SPADES;

const RANK_MASK = 0b1111111111111n;

const CARD_BIT_WIDTH = 4n;
const CARD_5_BIT_SHIFT = 0n;
const CARD_4_BIT_SHIFT = CARD_BIT_WIDTH + CARD_5_BIT_SHIFT; // 4n
const CARD_3_BIT_SHIFT = CARD_BIT_WIDTH + CARD_4_BIT_SHIFT; // 8n
const CARD_2_BIT_SHIFT = CARD_BIT_WIDTH + CARD_3_BIT_SHIFT; // 12n
const CARD_1_BIT_SHIFT = CARD_BIT_WIDTH + CARD_2_BIT_SHIFT; // 16n
const HAND_MASK_BIT_SHIFT = 24n;

const CARD_MASK = 0x0fn;
const CARD_1_MASK = 0x000f0000n;
const CARD_2_MASK = 0x0000f000n;
const CARD_5_MASK = 0x0000000fn;

const HAND_MASK_HIGH_CARD = BigInt(HandStrength.HighCard) << HAND_MASK_BIT_SHIFT;
const HAND_MASK_ONE_PAIR = BigInt(HandStrength.OnePair) << HAND_MASK_BIT_SHIFT;
const HAND_MASK_TWO_PAIR = BigInt(HandStrength.TwoPair) << HAND_MASK_BIT_SHIFT;
const HAND_MASK_THREE_OF_A_KIND = BigInt(HandStrength.ThreeOfAKind) << HAND_MASK_BIT_SHIFT;
const HAND_MASK_STRAIGHT = BigInt(HandStrength.Straight) << HAND_MASK_BIT_SHIFT;
const HAND_MASK_FLUSH = BigInt(HandStrength.Flush) << HAND_MASK_BIT_SHIFT;
const HAND_MASK_FULL_HOUSE = BigInt(HandStrength.FullHouse) << HAND_MASK_BIT_SHIFT;
const HAND_MASK_FOUR_OF_A_KIND = BigInt(HandStrength.FourOfAKind) << HAND_MASK_BIT_SHIFT;
const HAND_MASK_STRAIGHT_FLUSH = BigInt(HandStrength.StraightFlush) << HAND_MASK_BIT_SHIFT;

const uniq = <T>(items: T[]) => Array.from(new Set(items));

const max = <T>(items: T[]) =>
  items.reduce((accum, current) => (current > accum ? current : accum));

const getAllHandCombinations = ({
  holeCards,
  communityCards,
  minimumHoleCards,
  maximumHoleCards,
}: Required<EvaluateOptions>): Card[][] => {
  // when minimum <= 0 AND maximum >= holeCards.length, we can just combine
  // holeCards & communityCards
  if (minimumHoleCards <= 0 && maximumHoleCards >= holeCards.length) {
    return [[...holeCards, ...communityCards]];
  }

  // when minimum <= 0, we can get all combinations of holeCards of length (maximum), then
  // combine each of those combinations w/ communityCards
  if (minimumHoleCards <= 0) {
    return getCombinations(holeCards, maximumHoleCards).map((cards) => [
      ...cards,
      ...communityCards,
    ]);
  }

  // otherwise, we need to find all combinations possible by combining exact combinations of
  // N holeCards + M communityCards, where N=minimum and M=HAND_SIZE-minimum.
  const sameMinMax = minimumHoleCards === maximumHoleCards;
  const allHoleCardCombinations = new Array(sameMinMax ? 1 : maximumHoleCards - minimumHoleCards)
    .fill(undefined)
    .flatMap((i, index) =>
      getCombinations(holeCards, index + minimumHoleCards + (sameMinMax ? 0 : 1)),
    );

  const remainingCardCounts = uniq(
    allHoleCardCombinations.map((currentHoleCards) => {
      const count = HAND_SIZE - currentHoleCards.length;
      return count > communityCards.length ? communityCards.length : count;
    }),
  );

  const remainingCardsMap = Object.fromEntries(
    remainingCardCounts.map((count) => {
      return [count, getCombinations(communityCards, count)];
    }),
  );

  const allHandCombinations = allHoleCardCombinations.flatMap((currentHoleCards) => {
    const remainingCardCount = HAND_SIZE - currentHoleCards.length;
    const allCommunityCards = remainingCardsMap[remainingCardCount] ?? [];
    if (allCommunityCards.length === 0) {
      return [currentHoleCards];
    }
    return allCommunityCards.map((currentCommunityCards) => [
      ...currentHoleCards,
      ...currentCommunityCards,
    ]);
  });

  // only include combinations that are the longest, as shorter combinations will
  // never possibly be better due to not having kickers to improve their hand strenth
  const longestCombination = max(allHandCombinations.map((cards) => cards.length));

  return allHandCombinations.filter((cards) => cards.length === longestCombination);
};

// convert a number to an unsigned int
const uint = (n: bigint) => BigInt.asUintN(32, n);

// Returns a bit-mask representing the strength of the best possible hand from the provided cards.
const getEffectiveHandMask = (cards: Card[]): bigint => {
  const handMask = getHandMask(cards);
  let retval = 0n;

  // seperate out by suit
  const sc = (handMask >> MASK_OFFSET_CLUBS) & RANK_MASK;
  const sd = (handMask >> MASK_OFFSET_DIAMONDS) & RANK_MASK;
  const sh = (handMask >> MASK_OFFSET_HEARTS) & RANK_MASK;
  const ss = (handMask >> MASK_OFFSET_SPADES) & RANK_MASK;

  const ranks = sc | sd | sh | ss;
  const ranksCount = BITS_TABLE[Number(ranks)];
  const possibleDuplicatesCount = cards.length - ranksCount;

  // Check for straight, flush, or straight flush, and return if we can
  // determine immediately that that this is the best possible hand.
  if (ranksCount >= 5) {
    // Check for flush.
    // TODO: This approach won't work for games with many cards per hand, such as 5-card omaha,
    //       since such a hand could have multiple flushes.
    const matchingMask = [ss, sc, sd, sh].find((mask) => BITS_TABLE[Number(mask)] >= 5);
    if (matchingMask !== undefined) {
      const st = STRAIGHT_TABLE[Number(matchingMask)];
      if (st !== 0n) {
        return HAND_MASK_STRAIGHT_FLUSH + (st << CARD_1_BIT_SHIFT);
      }
      retval = HAND_MASK_FLUSH + TOP_FIVE_CARDS_TABLE[Number(matchingMask)];
    } else {
      const st = STRAIGHT_TABLE[Number(ranks)];
      if (st !== 0n) {
        retval = HAND_MASK_STRAIGHT + (st << CARD_1_BIT_SHIFT);
      }
    }

    // Another win -- if there can't be a FH/Quads (n_dups < 3), which is true most of the time
    // when there is a made hand, then if we've found a five card hand, just return.  This skips
    // the whole process of computing two-mask/three-mask/etc.
    if (retval !== 0n && possibleDuplicatesCount < 3) {
      return retval;
    }
  }

  // By the time we're here, either:
  //  1. there's no five-card hand possible (flush or straight), or
  //  2. there's a flush or straight, but we know that there are enough
  //     duplicates to make a full house / quads possible.
  switch (possibleDuplicatesCount) {
    case 0:
      // It's a no-pair hand.
      return HAND_MASK_HIGH_CARD + TOP_FIVE_CARDS_TABLE[Number(ranks)];
    case 1: {
      // It's a one-pair hand.
      const twoMask = ranks ^ (sc ^ sd ^ sh ^ ss);

      retval = uint(HAND_MASK_ONE_PAIR + (TOP_CARD_TABLE[Number(twoMask)] << CARD_1_BIT_SHIFT));
      const t = ranks ^ twoMask; // Only one bit set in twoMask
      // Get the top five cards in what is left, drop all but the top three
      // cards, and shift them by one to get the three desired kickers.
      const kickers = (TOP_FIVE_CARDS_TABLE[Number(t)] >> CARD_BIT_WIDTH) & ~CARD_5_MASK;
      retval += kickers;
      return retval;
    }
    case 2: {
      // Either two pair or trips.  Check two pair first.
      const twoMask = ranks ^ (sc ^ sd ^ sh ^ ss);
      if (twoMask !== 0n) {
        const t = ranks ^ twoMask; // Exactly two bits set in twoMask
        return uint(
          HAND_MASK_TWO_PAIR +
            (TOP_FIVE_CARDS_TABLE[Number(twoMask)] & (CARD_1_MASK | CARD_2_MASK)) +
            (TOP_CARD_TABLE[Number(t)] << CARD_3_BIT_SHIFT),
        );
      }
      // Must be trips.
      const threeMask = ((sc & sd) | (sh & ss)) & ((sc & sh) | (sd & ss));
      retval = uint(
        HAND_MASK_THREE_OF_A_KIND + (TOP_CARD_TABLE[Number(threeMask)] << CARD_1_BIT_SHIFT),
      );
      let t = ranks ^ threeMask; // Only one bit set in threeMask
      const second = TOP_CARD_TABLE[Number(t)];
      retval += second << CARD_2_BIT_SHIFT;
      t ^= 1n << second;
      retval += uint(TOP_CARD_TABLE[Number(t)] << CARD_3_BIT_SHIFT);
      return retval;
    }
    default: {
      // Possible quads, fullhouse, straight or flush, or two pair
      const fourMask = sh & sd & sc & ss;
      if (fourMask !== 0n) {
        const tc = TOP_CARD_TABLE[Number(fourMask)];
        retval = uint(
          HAND_MASK_FOUR_OF_A_KIND +
            (tc << CARD_1_BIT_SHIFT) +
            (TOP_CARD_TABLE[Number(ranks ^ (1n << tc))] << CARD_2_BIT_SHIFT),
        );
        return retval;
      }

      // Technically, `threeMask` as defined below is really the set of bits that are set in three
      // or four of the suits, but since we've already eliminated quads, this is okay.  Similarly,
      // `twoMask` really represents two or four of the suits, but since we've already eliminated
      // quads, we can use this shortcut.
      const twoMask = ranks ^ (sc ^ sd ^ sh ^ ss);
      if (BITS_TABLE[Number(twoMask)] !== possibleDuplicatesCount) {
        // Must be trips then, which really means there is a full house since we have 3+ duplicates.
        const threeMask = ((sc & sd) | (sh & ss)) & ((sc & sh) | (sd & ss));
        retval = HAND_MASK_FULL_HOUSE;
        const tc = TOP_CARD_TABLE[Number(threeMask)];
        retval += tc << CARD_1_BIT_SHIFT;
        const t = (twoMask | threeMask) ^ (1n << tc);
        retval += uint(TOP_CARD_TABLE[Number(t)] << CARD_2_BIT_SHIFT);
        return retval;
      }

      if (retval !== 0n) {
        // Flush and straight.
        return retval;
      }

      // Must be two pair.
      retval = HAND_MASK_TWO_PAIR;
      const top = TOP_CARD_TABLE[Number(twoMask)];
      retval += top << CARD_1_BIT_SHIFT;
      const second = TOP_CARD_TABLE[Number(twoMask ^ (1n << top))];
      retval += second << CARD_2_BIT_SHIFT;
      retval += uint(
        TOP_CARD_TABLE[Number(ranks ^ (1n << top) ^ (1n << second))] << CARD_3_BIT_SHIFT,
      );
      return retval;
    }
  }
};

const take = <T>(array: T[], index: number): T => {
  const [item] = array.splice(index, 1);
  return item;
};

const getFlushCards = (cards: Card[]): Card[] => {
  const suitCounts = cards.reduce(
    (counts, card) => {
      counts[getSuit(card)] += 1;
      return counts;
    },
    { c: 0, d: 0, h: 0, s: 0 } satisfies Record<Suit, number>,
  );

  const flushSuit = findKey(suitCounts, (v) => v >= 5) as Suit;

  return cards.filter((card) => getSuit(card) === flushSuit);
};

const constructHand = (
  originalCards: Card[],
  cardMasks: bigint[],
  maskIndices: [number, number, number, number, number],
  isFlush: boolean = false,
): Hand => {
  const cards = isFlush ? getFlushCards(originalCards) : [...originalCards];

  return maskIndices.reduce((result: Hand, maskIndex, i) => {
    if (maskIndex >= 0) {
      const cardMask = cardMasks[maskIndex];
      const maskedCardRank = getMaskedCardRank(cardMask);
      const cardIndex = cards.findIndex((card) => getRank(card) === maskedCardRank);
      const card = take(cards, cardIndex);
      if (card !== undefined) {
        result.push(card);
      }
    } else {
      const referencedCard = result[i - 1];
      const referencedRank = rankOrder.indexOf(getRank(referencedCard));
      const cardIndex = cards.findIndex(
        (card) => getRank(card) === rankOrder.at((referencedRank + maskIndex + 13) % 13),
      );
      const card = take(cards, cardIndex);
      if (card !== undefined) {
        result.push(card);
      }
    }
    return result;
  }, []);
};

const getHand = (handMask: bigint, strength: HandStrength, cards: Card[]): Hand => {
  const cardMasks = [
    (handMask >> CARD_1_BIT_SHIFT) & CARD_MASK,
    (handMask >> CARD_2_BIT_SHIFT) & CARD_MASK,
    (handMask >> CARD_3_BIT_SHIFT) & CARD_MASK,
    (handMask >> CARD_4_BIT_SHIFT) & CARD_MASK,
    (handMask >> CARD_5_BIT_SHIFT) & CARD_MASK,
  ];

  switch (strength) {
    case HandStrength.HighCard:
      return constructHand(cards, cardMasks, [0, 1, 2, 3, 4]);
    case HandStrength.OnePair:
      return constructHand(cards, cardMasks, [0, 0, 1, 2, 3]);
    case HandStrength.TwoPair:
      return constructHand(cards, cardMasks, [0, 0, 1, 1, 2]);
    case HandStrength.ThreeOfAKind:
      return constructHand(cards, cardMasks, [0, 0, 0, 1, 2]);
    case HandStrength.Straight:
      return constructHand(cards, cardMasks, [0, -1, -1, -1, -1]);
    case HandStrength.Flush:
      return constructHand(cards, cardMasks, [0, 1, 2, 3, 4], true);
    case HandStrength.FullHouse:
      return constructHand(cards, cardMasks, [0, 0, 0, 1, 1]);
    case HandStrength.FourOfAKind:
      return constructHand(cards, cardMasks, [0, 0, 0, 0, 1]);
    case HandStrength.StraightFlush:
      return constructHand(cards, cardMasks, [0, -1, -1, -1, -1], true);
    case HandStrength.RoyalFlush:
      return constructHand(cards, cardMasks, [0, -1, -1, -1, -1], true);
    default:
      return assertNever(strength);
  }
};

const getStrength = (handMask: bigint): HandStrength => {
  const strength = Number(handMask >> HAND_MASK_BIT_SHIFT);
  const highCardRank = getMaskedCardRank((handMask >> CARD_1_BIT_SHIFT) & CARD_MASK);

  if (strength === HandStrength.StraightFlush && highCardRank === 'A') {
    return HandStrength.RoyalFlush;
  }
  return strength;
};

const evaluateHand = (cards: Card[]): EvaluatedHand => {
  const value = getEffectiveHandMask(cards);
  const strength = getStrength(value);
  const hand = getHand(value, strength, cards);

  return { strength, hand, value };
};

export const evaluate = ({
  holeCards,
  communityCards = [],
  ...options
}: EvaluateOptions): EvaluatedHand => {
  const minimumHoleCards = Math.max(0, options.minimumHoleCards ?? 0);
  const maximumHoleCards = Math.min(
    holeCards.length,
    options.maximumHoleCards ?? holeCards.length,
    HAND_SIZE,
  );

  if (holeCards.length === 0 && communityCards.length === 0) {
    throw new Error('Must supply at least one holeCard or communityCard');
  }
  if (minimumHoleCards > holeCards.length) {
    throw new Error('minimumHoleCards cannot be greater than number of supplied hole cards');
  }
  if (minimumHoleCards > maximumHoleCards) {
    throw new Error('minimumHoleCards cannot be greater than maximumHoleCards');
  }
  if (maximumHoleCards <= 0) {
    throw new Error('maximumHoleCards cannot be less then or equal to zero');
  }

  const allHandCombinations = getAllHandCombinations({
    holeCards,
    communityCards,
    minimumHoleCards,
    maximumHoleCards,
  });

  return allHandCombinations.map(evaluateHand).sort(compare)[0];
};
