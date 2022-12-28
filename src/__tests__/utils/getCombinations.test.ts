import { getCombinations } from '../../utils/getCombinations';

describe('getCombinations', () => {
  const items = [1, 2, 3, 4, 5];

  it('returns an empty array when given a count of 0 or less', () => {
    expect(getCombinations(items, 0)).toEqual([]);
    expect(getCombinations(items, -1)).toEqual([]);
  });

  it('returns combinations when given a count of 1', () => {
    expect(getCombinations(items, 1)).toEqual([[1], [2], [3], [4], [5]]);
  });

  it('returns combinations when given a count of 2', () => {
    expect(getCombinations(items, 2)).toEqual([
      [1, 2],
      [1, 3],
      [1, 4],
      [1, 5],
      [2, 3],
      [2, 4],
      [2, 5],
      [3, 4],
      [3, 5],
      [4, 5],
    ]);
  });

  it('returns combinations when given a count of 3', () => {
    expect(getCombinations(items, 3)).toEqual([
      [1, 2, 3],
      [1, 2, 4],
      [1, 2, 5],
      [1, 3, 4],
      [1, 3, 5],
      [1, 4, 5],
      [2, 3, 4],
      [2, 3, 5],
      [2, 4, 5],
      [3, 4, 5],
    ]);
  });
});
