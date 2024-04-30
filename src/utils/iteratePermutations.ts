// Generate all permutations of an array.
export function* iteratePermutations<T>(items: T[], count: number): Generator<T[], void> {
  items = [...items];

  function* makeNextPermutations(workingPerm: T[], remainingCount: number): Generator<T[], void> {
    let i = 0;

    while (i < items.length) {
      const [currentItem] = items.splice(i, 1);
      workingPerm.push(currentItem);

      if (remainingCount === 1) {
        yield [...workingPerm];
      } else {
        yield* makeNextPermutations(workingPerm, remainingCount - 1);
      }

      workingPerm.pop();
      items.splice(i, 0, currentItem);
      i += 1;
    }
  }

  if (count >= 1) {
    yield* makeNextPermutations([], Math.min(count, items.length));
  } else {
    yield items;
  }
}
