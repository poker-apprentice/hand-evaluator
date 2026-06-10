import { decodeBase64ToInt16 } from './decode';
import { FLUSH_B64, NOFLUSH5_B64, NOFLUSH6_B64, NOFLUSH7_B64 } from './tables.generated';

// Hand-rank lookup tables (see scripts/generateTables.ts).  Ranks are 1..7462, lower = better.
//
// FLUSH is indexed by the 13-bit rank mask of the >=5 cards sharing a suit; the NOFLUSH tables
// are indexed by the perfect hash of a hand's rank-count vector (`hashQuinary`).
export const FLUSH = decodeBase64ToInt16(FLUSH_B64);
export const NOFLUSH5 = decodeBase64ToInt16(NOFLUSH5_B64);
export const NOFLUSH6 = decodeBase64ToInt16(NOFLUSH6_B64);
export const NOFLUSH7 = decodeBase64ToInt16(NOFLUSH7_B64);
