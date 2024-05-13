import { ALL_RANKS } from '@poker-apprentice/types';

// Constructs a string containing every possible value of a string union.
type Concat<T extends string[]> = T extends [infer F extends string, ...infer R extends string[]]
  ? `${F}${Concat<R>}`
  : '';

const join = <T extends string[]>(strings: T): Concat<T> => strings.join('') as Concat<T>;

export const rankOrder = join(ALL_RANKS);
