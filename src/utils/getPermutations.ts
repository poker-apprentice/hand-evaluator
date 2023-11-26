// Generate all permutations of an array.
export const getPermutations = <T>(items: T[], count: number) => {
  const permutations: T[][] = [];

  const makeNextPermutations = (workingPerm: T[], remainingCount: number) => {
    let i = 0;

    while (i < items.length) {
      const [currentItem] = items.splice(i, 1);
      workingPerm.push(currentItem);

      if (remainingCount === 1) {
        permutations.push([...workingPerm]);
      } else {
        makeNextPermutations(workingPerm, remainingCount - 1);
      }

      workingPerm.pop();
      items.splice(i, 0, currentItem);
      i += 1;
    }
  };

  if (count >= 1) {
    makeNextPermutations([], Math.min(count, items.length));
  }

  return permutations;
};
