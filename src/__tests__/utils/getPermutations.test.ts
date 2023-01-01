import { getPermutations } from '../../utils/getPermutations';

describe('getPermutations', () => {
  const items = [1, 2, 3, 4, 5];

  it('returns an empty array when given a count of 0 or less', () => {
    expect(getPermutations(items, 0)).toEqual([]);
    expect(getPermutations(items, -1)).toEqual([]);
  });

  it('returns permutations when given a count of 1', () => {
    expect(getPermutations(items, 1)).toEqual([[1], [2], [3], [4], [5]]);
  });

  it('returns permutations when given a count of 2', () => {
    expect(getPermutations(items, 2)).toEqual([
      [1, 2],
      [1, 3],
      [1, 4],
      [1, 5],
      [2, 1],
      [2, 3],
      [2, 4],
      [2, 5],
      [3, 1],
      [3, 2],
      [3, 4],
      [3, 5],
      [4, 1],
      [4, 2],
      [4, 3],
      [4, 5],
      [5, 1],
      [5, 2],
      [5, 3],
      [5, 4],
    ]);
  });

  it('returns permutations when given a count of 3', () => {
    expect(getPermutations(items, 3)).toEqual([
      [1, 2, 3],
      [1, 2, 4],
      [1, 2, 5],
      [1, 3, 2],
      [1, 3, 4],
      [1, 3, 5],
      [1, 4, 2],
      [1, 4, 3],
      [1, 4, 5],
      [1, 5, 2],
      [1, 5, 3],
      [1, 5, 4],
      [2, 1, 3],
      [2, 1, 4],
      [2, 1, 5],
      [2, 3, 1],
      [2, 3, 4],
      [2, 3, 5],
      [2, 4, 1],
      [2, 4, 3],
      [2, 4, 5],
      [2, 5, 1],
      [2, 5, 3],
      [2, 5, 4],
      [3, 1, 2],
      [3, 1, 4],
      [3, 1, 5],
      [3, 2, 1],
      [3, 2, 4],
      [3, 2, 5],
      [3, 4, 1],
      [3, 4, 2],
      [3, 4, 5],
      [3, 5, 1],
      [3, 5, 2],
      [3, 5, 4],
      [4, 1, 2],
      [4, 1, 3],
      [4, 1, 5],
      [4, 2, 1],
      [4, 2, 3],
      [4, 2, 5],
      [4, 3, 1],
      [4, 3, 2],
      [4, 3, 5],
      [4, 5, 1],
      [4, 5, 2],
      [4, 5, 3],
      [5, 1, 2],
      [5, 1, 3],
      [5, 1, 4],
      [5, 2, 1],
      [5, 2, 3],
      [5, 2, 4],
      [5, 3, 1],
      [5, 3, 2],
      [5, 3, 4],
      [5, 4, 1],
      [5, 4, 2],
      [5, 4, 3],
    ]);
  });

  it('treats count > array length as count = array length', () => {
    expect(getPermutations([1], 2)).toEqual([[1]]);
  });
});
