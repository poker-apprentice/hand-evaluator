// convert a number to an unsigned int
export const uint = (n: bigint) => BigInt.asUintN(32, n);
