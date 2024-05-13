import { Rank } from '@poker-apprentice/types';
import invert from 'lodash/invert';
import { RANK_BITS_MAP } from '../constants/bitmasks';
import { bigintKey } from './bigintKey';

const BITS_RANK_MAP = invert(RANK_BITS_MAP) as Record<number, Rank>;

export const getMaskedCardRank = (cardMask: bigint): Rank =>
  BITS_RANK_MAP[bigintKey(cardMask % 13n)];
