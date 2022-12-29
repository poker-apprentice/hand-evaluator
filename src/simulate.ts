import { Card, Hand, Odds } from './types';
import { buildScenario } from './utils/buildScenario';
import { evaluateScenario } from './utils/evaluateScenario';
import { getRemainingCardCount } from './utils/getRemainingCardCount';
import { getRemainingCards } from './utils/getRemainingCards';

export interface SimulateOptions {
  allHoleCards: Hand[];
  communityCards: Card[];
  expectedCommunityCardCount: number;
  expectedHoleCardCount: number;
  minimumHoleCardsUsed: number;
  maximumHoleCardsUsed: number;
  samples?: number;
  samplesPerUpdate?: number;
  callback: (odds: Odds[]) => void;
}

export type Abort = () => void;

interface HelperOptions extends SimulateOptions {
  results: Odds[];
  isRunning: () => boolean;
}

const getRandomCards = (cards: Card[], count: number): Card[] => {
  if (count <= 0) {
    return [];
  }

  const index = Math.floor(Math.random() * cards.length);
  const card = cards[index];
  const updatedCards = [...cards];
  updatedCards.splice(index, 1);

  return [card, ...getRandomCards(updatedCards, count - 1)];
};

const simulateHelper = (options: HelperOptions): void => {
  const {
    allHoleCards,
    communityCards,
    expectedCommunityCardCount,
    expectedHoleCardCount,
    minimumHoleCardsUsed,
    maximumHoleCardsUsed,
    samples = Infinity,
    samplesPerUpdate = 1000,
    results,
    callback,
    isRunning,
  } = options;

  if (samples <= 0 || !isRunning()) {
    return;
  }

  const remainingCards = getRemainingCards(allHoleCards, communityCards);

  // Determine how many more cards need to be selected to fill any unspecified
  // hole cards or community cards.
  const remainingCardCount = getRemainingCardCount({
    allHoleCards,
    communityCards,
    expectedCommunityCardCount,
    expectedHoleCardCount,
  });

  const sampleCount = Math.min(samplesPerUpdate, samples);

  for (let i = 0; i < sampleCount; i += 1) {
    const cards = getRandomCards(remainingCards, remainingCardCount);
    const scenario = buildScenario({
      allHoleCards,
      communityCards,
      expectedHoleCardCount,
      selectedCards: cards,
    });
    const scenarioEvaluations = evaluateScenario(scenario, {
      minimumHoleCardsUsed,
      maximumHoleCardsUsed,
    });
    scenarioEvaluations.forEach((evaluation, index) => {
      results[index].wins += evaluation.wins;
      results[index].ties += evaluation.ties;
      results[index].total += evaluation.total;
    });
  }

  callback(results);

  setTimeout(() => {
    simulateHelper({ ...options, samples: samples - sampleCount });
  });
};

const getAbortable = () => {
  let running = true;
  const abort = () => {
    running = false;
  };
  const isRunning = () => running;
  return { abort, isRunning };
};

export const simulate = (options: SimulateOptions): Abort => {
  const { abort, isRunning } = getAbortable();
  const results = options.allHoleCards.map(() => ({ wins: 0, ties: 0, total: 0 }));

  setTimeout(() => {
    simulateHelper({ ...options, results, isRunning });
  });

  return abort;
};
