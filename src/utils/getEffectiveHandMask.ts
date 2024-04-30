import { Card } from '@poker-apprentice/types';
import {
  CARD_1_BIT_SHIFT,
  CARD_1_MASK,
  CARD_2_BIT_SHIFT,
  CARD_2_MASK,
  CARD_3_BIT_SHIFT,
  CARD_5_MASK,
  CARD_BIT_WIDTH,
  HAND_MASK_FLUSH,
  HAND_MASK_FOUR_OF_A_KIND,
  HAND_MASK_FULL_HOUSE,
  HAND_MASK_HIGH_CARD,
  HAND_MASK_ONE_PAIR,
  HAND_MASK_STRAIGHT,
  HAND_MASK_STRAIGHT_FLUSH,
  HAND_MASK_THREE_OF_A_KIND,
  HAND_MASK_TWO_PAIR,
  MASK_OFFSET_CLUBS,
  MASK_OFFSET_DIAMONDS,
  MASK_OFFSET_HEARTS,
  MASK_OFFSET_SPADES,
  RANK_MASK,
} from '../constants/bitmasks';
import { CARD_RANK_TABLE } from '../constants/cardRankTable';
import { STRAIGHT_TABLE } from '../constants/straightTable';
import { TOP_CARD_TABLE } from '../constants/topCardTable';
import { TOP_FIVE_CARDS_TABLE } from '../constants/topFiveCardsTable';
import { bigintKey } from './bigintKey';
import { getHandMask } from './getHandMask';
import { uint } from './uint';

// Returns a bit-mask representing the strength of the best possible hand from the provided cards.
export const getEffectiveHandMask = (cards: Card[]): bigint => {
  const handMask = getHandMask(cards);
  let retval = 0n;

  // seperate out by suit
  const sc = uint((handMask >> MASK_OFFSET_CLUBS) & RANK_MASK);
  const sd = uint((handMask >> MASK_OFFSET_DIAMONDS) & RANK_MASK);
  const sh = uint((handMask >> MASK_OFFSET_HEARTS) & RANK_MASK);
  const ss = uint((handMask >> MASK_OFFSET_SPADES) & RANK_MASK);

  const ranks = sc | sd | sh | ss;
  const ranksCount = CARD_RANK_TABLE[bigintKey(ranks)];
  const possibleDuplicatesCount = cards.length - ranksCount;

  // Check for straight, flush, or straight flush, and return if we can
  // determine immediately that that this is the best possible hand.
  if (ranksCount >= 5) {
    // Check for flush.
    // TODO: This approach won't work for games with many cards per hand, such as 5-card omaha,
    //       since such a hand could have multiple flushes.
    const matchingMask = [ss, sc, sd, sh].find((mask) => CARD_RANK_TABLE[bigintKey(mask)] >= 5);
    if (matchingMask !== undefined) {
      const st = STRAIGHT_TABLE[bigintKey(matchingMask)];
      if (st !== 0n) {
        return HAND_MASK_STRAIGHT_FLUSH + (st << CARD_1_BIT_SHIFT);
      }
      retval = HAND_MASK_FLUSH + TOP_FIVE_CARDS_TABLE[bigintKey(matchingMask)];
    } else {
      const st = STRAIGHT_TABLE[bigintKey(ranks)];
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
      return HAND_MASK_HIGH_CARD + TOP_FIVE_CARDS_TABLE[bigintKey(ranks)];
    case 1: {
      // It's a one-pair hand.
      const twoMask = ranks ^ (sc ^ sd ^ sh ^ ss);

      retval = uint(HAND_MASK_ONE_PAIR + (TOP_CARD_TABLE[bigintKey(twoMask)] << CARD_1_BIT_SHIFT));
      const t = ranks ^ twoMask; // Only one bit set in twoMask
      // Get the top five cards in what is left, drop all but the top three
      // cards, and shift them by one to get the three desired kickers.
      const kickers = (TOP_FIVE_CARDS_TABLE[bigintKey(t)] >> CARD_BIT_WIDTH) & ~CARD_5_MASK;
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
            (TOP_FIVE_CARDS_TABLE[bigintKey(twoMask)] & (CARD_1_MASK | CARD_2_MASK)) +
            (TOP_CARD_TABLE[bigintKey(t)] << CARD_3_BIT_SHIFT),
        );
      }
      // Must be trips.
      const threeMask = ((sc & sd) | (sh & ss)) & ((sc & sh) | (sd & ss));
      retval = uint(
        HAND_MASK_THREE_OF_A_KIND + (TOP_CARD_TABLE[bigintKey(threeMask)] << CARD_1_BIT_SHIFT),
      );
      let t = ranks ^ threeMask; // Only one bit set in threeMask
      const second = TOP_CARD_TABLE[bigintKey(t)];
      retval += second << CARD_2_BIT_SHIFT;
      t ^= 1n << second;
      retval += uint(TOP_CARD_TABLE[bigintKey(t)] << CARD_3_BIT_SHIFT);
      return retval;
    }
    default: {
      // Possible quads, fullhouse, straight or flush, or two pair
      const fourMask = sh & sd & sc & ss;
      if (fourMask !== 0n) {
        const tc = TOP_CARD_TABLE[bigintKey(fourMask)];
        retval = uint(
          HAND_MASK_FOUR_OF_A_KIND +
            (tc << CARD_1_BIT_SHIFT) +
            (TOP_CARD_TABLE[bigintKey(ranks ^ (1n << tc))] << CARD_2_BIT_SHIFT),
        );
        return retval;
      }

      // Technically, `threeMask` as defined below is really the set of bits that are set in three
      // or four of the suits, but since we've already eliminated quads, this is okay.  Similarly,
      // `twoMask` really represents two or four of the suits, but since we've already eliminated
      // quads, we can use this shortcut.
      const twoMask = ranks ^ (sc ^ sd ^ sh ^ ss);
      if (CARD_RANK_TABLE[bigintKey(twoMask)] !== possibleDuplicatesCount) {
        // Must be trips then, which really means there is a full house since we have 3+ duplicates.
        const threeMask = ((sc & sd) | (sh & ss)) & ((sc & sh) | (sd & ss));
        retval = HAND_MASK_FULL_HOUSE;
        const tc = TOP_CARD_TABLE[bigintKey(threeMask)];
        retval += tc << CARD_1_BIT_SHIFT;
        const t = (twoMask | threeMask) ^ (1n << tc);
        retval += uint(TOP_CARD_TABLE[bigintKey(t)] << CARD_2_BIT_SHIFT);
        return retval;
      }

      // TODO: This conditional can probably be removed, as it looks like it won't ever be met.
      if (retval !== 0n) {
        // Flush and straight.
        return retval;
      }

      // Must be two pair.
      retval = HAND_MASK_TWO_PAIR;
      const top = TOP_CARD_TABLE[bigintKey(twoMask)];
      retval += top << CARD_1_BIT_SHIFT;
      const second = TOP_CARD_TABLE[bigintKey(twoMask ^ (1n << top))];
      retval += second << CARD_2_BIT_SHIFT;
      retval += uint(
        TOP_CARD_TABLE[bigintKey(ranks ^ (1n << top) ^ (1n << second))] << CARD_3_BIT_SHIFT,
      );
      return retval;
    }
  }
};
