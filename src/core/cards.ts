import { ALL_CARDS, Card } from '@poker-apprentice/types';

// Cards are represented internally as integers 0-51, where `id = rankIndex * 4 + suitIndex` with
// ranks ordered 2..A and suits ordered c, d, h, s.  This matches the ordering of `ALL_CARDS`, so
// conversion in either direction is a simple index lookup.
export const CARD_ID_COUNT = 52;

const CARD_IDS = new Map<Card, number>(ALL_CARDS.map((card, id) => [card, id]));

/**
 * Converts a card string into its internal integer id (0-51).
 * @param {Card} card The card to convert.
 * @returns {number} The integer id of the card.
 */
export const cardToId = (card: Card): number => {
  const id = CARD_IDS.get(card);
  if (id === undefined) {
    throw new Error(`Invalid card: ${card}`);
  }
  return id;
};

/**
 * Converts an internal integer card id (0-51) back into its card string.
 * @param {number} id The integer id of the card.
 * @returns {Card} The card represented by the id.
 */
export const idToCard = (id: number): Card => ALL_CARDS[id];

/**
 * Converts an array of card strings into their internal integer ids.
 * @param {Card[]} cards The cards to convert.
 * @returns {number[]} The integer ids of the cards.
 */
export const handToIds = (cards: Card[]): number[] => cards.map(cardToId);

/**
 * Extracts the rank index (0-12, representing ranks 2 through A) from a card id.
 * @param {number} id The integer id of the card.
 * @returns {number} The rank index of the card.
 */
export const rankOfId = (id: number): number => id >> 2;

/**
 * Extracts the suit index (0-3, representing suits c, d, h, s) from a card id.
 * @param {number} id The integer id of the card.
 * @returns {number} The suit index of the card.
 */
export const suitOfId = (id: number): number => id & 3;
