import { Card, Hand } from '@poker-apprentice/types';
import {
  DeckExhaustedError,
  DuplicateCardError,
  HandEvaluatorError,
  InsufficientCardsError,
  InvalidCardError,
  InvalidCommunityCardCountError,
  InvalidHoleCardConstraintsError,
  InvalidHoleCardCountError,
  MaximumEvaluationsExceededError,
  NoCardsSuppliedError,
  UnsatisfiableHandError,
} from '../errors';
import { evaluate } from '../evaluate';
import { evaluateHoldem } from '../helpers/evaluateHoldem';
import { oddsHoldem } from '../helpers/oddsHoldem';
import { odds } from '../odds';

const ERROR_CLASSES = [
  DeckExhaustedError,
  DuplicateCardError,
  InsufficientCardsError,
  InvalidCardError,
  InvalidCommunityCardCountError,
  InvalidHoleCardConstraintsError,
  InvalidHoleCardCountError,
  MaximumEvaluationsExceededError,
  NoCardsSuppliedError,
  UnsatisfiableHandError,
];

// Instantiates each error class with plausible arguments, purely to inspect the shape shared by
// all of them.  Per-class detail is asserted in the suites below.
const instantiate = (
  ErrorClass: typeof ERROR_CLASSES[number],
  options?: ErrorOptions,
): HandEvaluatorError => {
  switch (ErrorClass) {
    case DuplicateCardError:
    case InvalidCardError:
      return new (ErrorClass as typeof InvalidCardError)('As', options);
    case InvalidHoleCardConstraintsError:
      return new InvalidHoleCardConstraintsError(
        'minimumExceedsMaximum',
        { minimumHoleCards: 3, maximumHoleCards: 2 },
        options,
      );
    case NoCardsSuppliedError:
      return new NoCardsSuppliedError(options);
    case UnsatisfiableHandError:
      return new UnsatisfiableHandError(2, 2, 2, options);
    case InvalidHoleCardCountError:
      return new InvalidHoleCardCountError(2, 3, undefined, options);
    default:
      return new (ErrorClass as typeof InsufficientCardsError)(5, 2, options);
  }
};

describe('errors', () => {
  describe.each(ERROR_CLASSES.map((ErrorClass) => [ErrorClass.name, ErrorClass] as const))(
    '%s',
    (name, ErrorClass) => {
      const error = instantiate(ErrorClass);

      it('extends HandEvaluatorError and Error', () => {
        expect(error).toBeInstanceOf(HandEvaluatorError);
        expect(error).toBeInstanceOf(Error);
      });

      it('reports its own class name', () => {
        expect(error.name).toBe(name);
      });

      it('has a non-empty message', () => {
        expect(error.message).not.toBe('');
      });

      it('supports the `cause` option', () => {
        const cause = new Error('underlying');
        expect(instantiate(ErrorClass, { cause }).cause).toBe(cause);
      });
    },
  );

  describe('InvalidCardError', () => {
    it('exposes the unrecognized card', () => {
      const holeCards = ['Xx' as Card, 'Kd' as Card, 'Qd' as Card, 'Jd' as Card, 'Td' as Card];

      expect(() => evaluate({ holeCards })).toThrow(InvalidCardError);
      try {
        evaluate({ holeCards });
      } catch (error) {
        expect((error as InvalidCardError).card).toBe('Xx');
      }
    });
  });

  describe('DuplicateCardError', () => {
    it('exposes the duplicated card', () => {
      const allHoleCards: Hand[] = [
        ['As', 'Ks'],
        ['As', 'Ad'],
      ];

      try {
        oddsHoldem(allHoleCards, []);
        throw new Error('expected a DuplicateCardError');
      } catch (error) {
        expect(error).toBeInstanceOf(DuplicateCardError);
        expect((error as DuplicateCardError).card).toBe('As');
      }
    });
  });

  describe('InvalidHoleCardCountError', () => {
    it('omits handIndex for single-hand functions', () => {
      try {
        evaluateHoldem({ holeCards: ['As', 'Ks', 'Qs'] });
        throw new Error('expected an InvalidHoleCardCountError');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidHoleCardCountError);
        const invalid = error as InvalidHoleCardCountError;
        expect(invalid.maximum).toBe(2);
        expect(invalid.actual).toBe(3);
        expect(invalid.handIndex).toBeUndefined();
      }
    });

    it('identifies the offending hand for multi-hand functions', () => {
      const allHoleCards: Hand[] = [
        ['As', 'Ks'],
        ['Jd', 'Jh', '2c'],
      ];

      try {
        oddsHoldem(allHoleCards, []);
        throw new Error('expected an InvalidHoleCardCountError');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidHoleCardCountError);
        const invalid = error as InvalidHoleCardCountError;
        expect(invalid.maximum).toBe(2);
        expect(invalid.actual).toBe(3);
        expect(invalid.handIndex).toBe(1);
      }
    });
  });

  describe('InvalidCommunityCardCountError', () => {
    it('exposes the maximum and actual counts', () => {
      const communityCards: Card[] = ['Ac', '9h', 'Qd', '2d', '2s', 'Td'];

      try {
        oddsHoldem([['As', 'Ks']], communityCards);
        throw new Error('expected an InvalidCommunityCardCountError');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidCommunityCardCountError);
        expect((error as InvalidCommunityCardCountError).maximum).toBe(5);
        expect((error as InvalidCommunityCardCountError).actual).toBe(6);
      }
    });
  });

  describe('NoCardsSuppliedError', () => {
    it('is thrown when no cards at all are provided', () => {
      expect(() => evaluate({ holeCards: [] })).toThrow(NoCardsSuppliedError);
    });
  });

  describe('InvalidHoleCardConstraintsError', () => {
    it.each([
      [
        'minimumExceedsSuppliedHoleCards',
        { holeCards: ['As', 'Ks'] as Card[], minimumHoleCards: 3 },
      ],
      [
        'minimumExceedsMaximum',
        { holeCards: ['As', 'Ks', 'Qs', 'Js'] as Card[], minimumHoleCards: 3, maximumHoleCards: 2 },
      ],
      ['maximumNotPositive', { holeCards: ['As', 'Ks'] as Card[], maximumHoleCards: 0 }],
    ])('reports reason %s', (reason, options) => {
      try {
        evaluate(options);
        throw new Error(`expected an InvalidHoleCardConstraintsError (${reason})`);
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidHoleCardConstraintsError);
        expect((error as InvalidHoleCardConstraintsError).reason).toBe(reason);
      }
    });
  });

  describe('InsufficientCardsError', () => {
    it('is thrown when a game cannot produce a 5-card hand', () => {
      try {
        odds([['As', 'Ks']], {
          communityCards: [],
          expectedCommunityCardCount: 0,
          expectedHoleCardCount: 2,
          minimumHoleCardsUsed: 0,
          maximumHoleCardsUsed: 2,
        });
        throw new Error('expected an InsufficientCardsError');
      } catch (error) {
        expect(error).toBeInstanceOf(InsufficientCardsError);
        expect((error as InsufficientCardsError).requiredCount).toBe(5);
        expect((error as InsufficientCardsError).suppliedCount).toBe(2);
      }
    });

    it('is not thrown by `evaluate`, which describes the best partial hand instead', () => {
      expect(() => evaluate({ holeCards: ['As', 'Ks'] })).not.toThrow();
    });
  });

  describe('UnsatisfiableHandError', () => {
    it('is thrown when hole card usage constraints admit no 5-card hand', () => {
      try {
        odds([['As', 'Ks', 'Qs', 'Js']], {
          communityCards: [],
          expectedCommunityCardCount: 2,
          expectedHoleCardCount: 4,
          minimumHoleCardsUsed: 2,
          maximumHoleCardsUsed: 2,
        });
        throw new Error('expected an UnsatisfiableHandError');
      } catch (error) {
        expect(error).toBeInstanceOf(UnsatisfiableHandError);
        const unsatisfiable = error as UnsatisfiableHandError;
        expect(unsatisfiable.minimumHoleCards).toBe(2);
        expect(unsatisfiable.maximumHoleCards).toBe(2);
        expect(unsatisfiable.communityCardCount).toBe(2);
      }
    });
  });

  describe('DeckExhaustedError', () => {
    it('is thrown when more unknown cards are needed than the deck holds', () => {
      const allHoleCards: Hand[] = new Array(8).fill([]);

      try {
        odds(allHoleCards, {
          communityCards: [],
          expectedCommunityCardCount: 0,
          expectedHoleCardCount: 7,
          minimumHoleCardsUsed: 0,
          maximumHoleCardsUsed: 7,
        });
        throw new Error('expected a DeckExhaustedError');
      } catch (error) {
        expect(error).toBeInstanceOf(DeckExhaustedError);
        expect((error as DeckExhaustedError).requiredCount).toBe(56);
        expect((error as DeckExhaustedError).remainingCount).toBe(52);
      }
    });
  });

  describe('MaximumEvaluationsExceededError', () => {
    it('exposes the required and permitted evaluation counts', () => {
      const allHoleCards: Hand[] = [
        ['As', 'Ks'],
        ['Jd', 'Jh'],
      ];

      try {
        oddsHoldem(allHoleCards, [], { maximumEvaluations: 1000 });
        throw new Error('expected a MaximumEvaluationsExceededError');
      } catch (error) {
        expect(error).toBeInstanceOf(MaximumEvaluationsExceededError);
        const exceeded = error as MaximumEvaluationsExceededError;
        expect(exceeded.maximumEvaluations).toBe(1000);
        expect(exceeded.requiredEvaluations).toBeGreaterThan(1000);
      }
    });
  });
});
