// TypeScript currently expects all array keys to be numbers, even though bigint is supported by
// JavaScript.  To prevent a costly cast via `Number(...)` when using bigint values as keys, and
// to also prevent TypeScript errors throughout the code, we'll simply use a placeholder function
// to cast values instead.
export const bigintKey = (n: bigint): number => n as unknown as number;
