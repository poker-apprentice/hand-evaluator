/**
 * Test utility function to pretty print a masked hand.
 * @param {bigint} hand The bitmasked hand/cards.
 * @returns {string} The bits of the hand separated into columns of 13 characters.
 */
export const ppHand = (hand: bigint) => {
  const bits = hand.toString(2);
  const match = bits.padStart(52, '0').match(/[01]{13}/g);
  return match?.join(' ') ?? bits;
};
