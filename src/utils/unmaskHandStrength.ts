import { HandStrength } from '@poker-apprentice/types';
import { CARD_1_BIT_SHIFT, CARD_MASK, HAND_MASK_BIT_SHIFT } from '../constants/bitmasks';
import { getMaskedCardRank } from './getMaskedCardRank';

export const unmaskHandStrength = (handValueMask: bigint): HandStrength => {
  const baseStrength: HandStrength = Number(handValueMask >> HAND_MASK_BIT_SHIFT);
  const highCardRank = getMaskedCardRank((handValueMask >> CARD_1_BIT_SHIFT) & CARD_MASK);

  const strength =
    baseStrength === HandStrength.StraightFlush && highCardRank === 'A'
      ? HandStrength.RoyalFlush
      : baseStrength;

  return strength;
};
