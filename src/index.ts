export type { Odds, Strength } from './types';

export { compare } from './compare';
export { evaluate } from './evaluate';
export { odds } from './odds';
export { simulate, simulate as oddsAsync } from './simulate';

export { evaluateHoldem } from './helpers/evaluateHoldem';
export { evaluateOmaha } from './helpers/evaluateOmaha';
export { evaluatePineapple } from './helpers/evaluatePineapple';
export { evaluateStud } from './helpers/evaluateStud';

export { oddsHoldem } from './helpers/oddsHoldem';
export { oddsOmaha } from './helpers/oddsOmaha';
export { oddsPineapple } from './helpers/oddsPineapple';
export { oddsStud } from './helpers/oddsStud';

export { simulateHoldem, simulateHoldem as oddsHoldemAsync } from './helpers/simulateHoldem';
export { simulateOmaha, simulateOmaha as oddsOmahaAsync } from './helpers/simulateOmaha';
export {
  simulatePineapple,
  simulatePineapple as oddsPineappleAsync,
} from './helpers/simulatePineapple';
export { simulateStud, simulateStud as oddsStudAsync } from './helpers/simulateStud';
