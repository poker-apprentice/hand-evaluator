import { cardComparator } from '../../utils/cardComparator';

describe('cardComparator', () => {
  it('returns 0 when both cards are equal value', () => {
    expect(cardComparator('Kc', 'Ks')).toEqual(0);
  });

  it('returns -1 when the first card is higher value', () => {
    expect(cardComparator('Ac', 'Kc')).toEqual(-1);
  });

  it('returns 1 when the second card is higher value', () => {
    expect(cardComparator('Kc', 'Ac')).toEqual(1);
  });
});
