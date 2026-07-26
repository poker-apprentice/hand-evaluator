import type { Card } from '@poker-apprentice/types';

/**
 * Base class for every error thrown by this package.  Catch this to handle any failure
 * originating here without having to enumerate each individual error class.
 */
export abstract class HandEvaluatorError extends Error {
  // Assigned from a string literal rather than derived from the constructor, so that `name`
  // survives the minification applied to the published bundle.
  constructor(name: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = name;
  }
}

/**
 * Thrown when a string that is not a recognized card is supplied.
 */
export class InvalidCardError extends HandEvaluatorError {
  /** The unrecognized value that was supplied in place of a card. */
  readonly card: string;

  constructor(card: string, options?: ErrorOptions) {
    super('InvalidCardError', `Invalid card: ${card}`, options);
    this.card = card;
  }
}

/**
 * Thrown when the same card is supplied more than once across all hole cards and community
 * cards of a scenario.
 */
export class DuplicateCardError extends HandEvaluatorError {
  /** The card that was supplied more than once. */
  readonly card: Card;

  constructor(card: Card, options?: ErrorOptions) {
    super('DuplicateCardError', `Duplicate card: ${card}`, options);
    this.card = card;
  }
}

/**
 * Thrown when more hole cards are supplied than the game being played allows.
 */
export class InvalidHoleCardCountError extends HandEvaluatorError {
  /** The maximum number of hole cards the game allows. */
  readonly maximum: number;

  /** The number of hole cards that were actually supplied. */
  readonly actual: number;

  /**
   * The index within `allHoleCards` of the offending hand, for functions accepting multiple
   * hands.  Undefined for functions accepting a single hand.
   */
  readonly handIndex?: number;

  constructor(maximum: number, actual: number, handIndex?: number, options?: ErrorOptions) {
    const message =
      handIndex === undefined
        ? `holeCards accepts a maximum of ${maximum} elements, but received ${actual}`
        : `Each collection of hole cards accepts a maximum of ${maximum} elements, but the ` +
          `hand at index ${handIndex} has ${actual}`;

    super('InvalidHoleCardCountError', message, options);
    this.maximum = maximum;
    this.actual = actual;
    this.handIndex = handIndex;
  }
}

/**
 * Thrown when more community cards are supplied than the game being played allows.
 */
export class InvalidCommunityCardCountError extends HandEvaluatorError {
  /** The maximum number of community cards the game allows. */
  readonly maximum: number;

  /** The number of community cards that were actually supplied. */
  readonly actual: number;

  constructor(maximum: number, actual: number, options?: ErrorOptions) {
    super(
      'InvalidCommunityCardCountError',
      `communityCards accepts a maximum of ${maximum} elements, but received ${actual}`,
      options,
    );
    this.maximum = maximum;
    this.actual = actual;
  }
}

/**
 * Thrown when no cards at all are supplied to a function requiring at least one.
 */
export class NoCardsSuppliedError extends HandEvaluatorError {
  constructor(options?: ErrorOptions) {
    super('NoCardsSuppliedError', 'Must supply at least one holeCard or communityCard', options);
  }
}

/**
 * Thrown when too few cards are supplied to form a complete hand.  Note that `evaluate`
 * handles this case internally by describing the best partial hand instead of throwing.
 */
export class InsufficientCardsError extends HandEvaluatorError {
  /** The number of cards a complete hand requires. */
  readonly requiredCount: number;

  /** The total number of hole and community cards supplied. */
  readonly suppliedCount: number;

  constructor(requiredCount: number, suppliedCount: number, options?: ErrorOptions) {
    super(
      'InsufficientCardsError',
      `Cannot evaluate hands of fewer than ${requiredCount} cards, but received ` +
        `${suppliedCount}`,
      options,
    );
    this.requiredCount = requiredCount;
    this.suppliedCount = suppliedCount;
  }
}

/**
 * Thrown when the scenario contains more unknown card slots to fill than there are cards left
 * in the deck, e.g. too many players for the number of hole cards each is dealt.
 */
export class DeckExhaustedError extends HandEvaluatorError {
  /** The number of unknown cards the scenario needs to deal. */
  readonly requiredCount: number;

  /** The number of cards remaining in the deck after removing all known cards. */
  readonly remainingCount: number;

  constructor(requiredCount: number, remainingCount: number, options?: ErrorOptions) {
    super(
      'DeckExhaustedError',
      `Not enough cards remain in the deck to complete every hand: ${requiredCount} needed, ` +
        `${remainingCount} remain`,
      options,
    );
    this.requiredCount = requiredCount;
    this.remainingCount = remainingCount;
  }
}

/**
 * Thrown when the hole-card usage constraints of a game admit no valid 5-card hand from the
 * supplied cards, e.g. requiring 2 hole cards from a 7-card board when only 2 hole cards are
 * held but 4 board cards must be used.
 */
export class UnsatisfiableHandError extends HandEvaluatorError {
  /** The minimum number of hole cards that must be used. */
  readonly minimumHoleCards: number;

  /** The maximum number of hole cards that may be used. */
  readonly maximumHoleCards: number;

  /** The number of community cards available. */
  readonly communityCardCount: number;

  constructor(
    minimumHoleCards: number,
    maximumHoleCards: number,
    communityCardCount: number,
    options?: ErrorOptions,
  ) {
    super(
      'UnsatisfiableHandError',
      'Hole card usage constraints cannot produce a 5-card hand',
      options,
    );
    this.minimumHoleCards = minimumHoleCards;
    this.maximumHoleCards = maximumHoleCards;
    this.communityCardCount = communityCardCount;
  }
}

/** Identifies which hole-card usage constraint was violated. */
export type HoleCardConstraintViolation =
  | 'minimumExceedsSuppliedHoleCards'
  | 'minimumExceedsMaximum'
  | 'maximumNotPositive';

const HOLE_CARD_CONSTRAINT_MESSAGES: Record<HoleCardConstraintViolation, string> = {
  minimumExceedsSuppliedHoleCards:
    'minimumHoleCards cannot be greater than number of supplied hole cards',
  minimumExceedsMaximum: 'minimumHoleCards cannot be greater than maximumHoleCards',
  maximumNotPositive: 'maximumHoleCards cannot be less than or equal to zero',
};

/**
 * Thrown when the `minimumHoleCards`/`maximumHoleCards` options are mutually contradictory or
 * inconsistent with the hole cards supplied.
 */
export class InvalidHoleCardConstraintsError extends HandEvaluatorError {
  /** Which constraint was violated. */
  readonly reason: HoleCardConstraintViolation;

  /** The minimum number of hole cards that must be used. */
  readonly minimumHoleCards: number;

  /** The maximum number of hole cards that may be used. */
  readonly maximumHoleCards: number;

  /** The number of hole cards supplied, when known. */
  readonly holeCardCount?: number;

  constructor(
    reason: HoleCardConstraintViolation,
    context: { minimumHoleCards: number; maximumHoleCards: number; holeCardCount?: number },
    options?: ErrorOptions,
  ) {
    super('InvalidHoleCardConstraintsError', HOLE_CARD_CONSTRAINT_MESSAGES[reason], options);
    this.reason = reason;
    this.minimumHoleCards = context.minimumHoleCards;
    this.maximumHoleCards = context.maximumHoleCards;
    this.holeCardCount = context.holeCardCount;
  }
}

/**
 * Thrown by `odds` when exact enumeration of the scenario would require more hand evaluations
 * than `maximumEvaluations` permits.
 */
export class MaximumEvaluationsExceededError extends HandEvaluatorError {
  /** The number of hand evaluations exact enumeration would require. */
  readonly requiredEvaluations: number;

  /** The configured ceiling on hand evaluations. */
  readonly maximumEvaluations: number;

  constructor(requiredEvaluations: number, maximumEvaluations: number, options?: ErrorOptions) {
    const message =
      `odds() would require ${requiredEvaluations} hand evaluations, which exceeds ` +
      `maximumEvaluations (${maximumEvaluations}). Use simulate() for an approximate ` +
      `result, or increase options.maximumEvaluations.`;

    super('MaximumEvaluationsExceededError', message, options);
    this.requiredEvaluations = requiredEvaluations;
    this.maximumEvaluations = maximumEvaluations;
  }
}
