import {
  EquityHoldemOptions,
  EquityOmahaOptions,
  EquityOptions,
  EquityPineappleOptions,
  EquityResult,
  EquityStudOptions,
  Odds,
  OddsHoldemOptions,
  OddsOmahaOptions,
  OddsOptions,
  OddsPineappleOptions,
  OddsStudOptions,
  equity,
  equityHoldem,
  equityOmaha,
  equityPineapple,
  equityStud,
  odds,
  oddsHoldem,
  oddsOmaha,
  oddsPineapple,
  oddsStud,
} from '..';

// Mutual assignability: fails to compile unless the deprecated alias and the renamed type are
// the same type.
type IsAlias<Deprecated, Current> = [Deprecated] extends [Current]
  ? [Current] extends [Deprecated]
    ? true
    : false
  : false;

// The `odds*` names were renamed to `equity*`; the old names remain exported as deprecated
// aliases of the new ones.
describe('deprecated aliases', () => {
  it.each([
    ['odds', odds, equity],
    ['oddsHoldem', oddsHoldem, equityHoldem],
    ['oddsOmaha', oddsOmaha, equityOmaha],
    ['oddsPineapple', oddsPineapple, equityPineapple],
    ['oddsStud', oddsStud, equityStud],
  ])('`%s` aliases its `equity*` counterpart', (_name, deprecated, current) => {
    expect(deprecated).toBe(current);
  });

  it('aliases the renamed types', () => {
    const aliased: [
      IsAlias<Odds, EquityResult>,
      IsAlias<OddsOptions, EquityOptions>,
      IsAlias<OddsHoldemOptions, EquityHoldemOptions>,
      IsAlias<OddsOmahaOptions, EquityOmahaOptions>,
      IsAlias<OddsPineappleOptions, EquityPineappleOptions>,
      IsAlias<OddsStudOptions, EquityStudOptions>,
    ] = [true, true, true, true, true, true];

    expect(aliased).toHaveLength(6);
  });
});
