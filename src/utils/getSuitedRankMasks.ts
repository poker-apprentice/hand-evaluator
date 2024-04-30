import { Suit } from '@poker-apprentice/types';
import {
  MASK_OFFSET_CLUBS,
  MASK_OFFSET_DIAMONDS,
  MASK_OFFSET_HEARTS,
  MASK_OFFSET_SPADES,
  RANK_MASK,
} from '../constants/bitmasks';
import { uint } from './uint';

export const getSuitedRankMasks = (handMask: bigint): Record<Suit, bigint> => ({
  c: uint((handMask >> MASK_OFFSET_CLUBS) & RANK_MASK),
  d: uint((handMask >> MASK_OFFSET_DIAMONDS) & RANK_MASK),
  h: uint((handMask >> MASK_OFFSET_HEARTS) & RANK_MASK),
  s: uint((handMask >> MASK_OFFSET_SPADES) & RANK_MASK),
});
