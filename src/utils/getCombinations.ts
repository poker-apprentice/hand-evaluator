// Generate all combinations of an array.
export const getCombinations = <T>(sourceArray: T[], comboLength: number) => {
  const sourceLength = sourceArray.length;
  if (comboLength > sourceLength || comboLength === 0) return [];

  const combos: T[][] = [];

  // Accepts a partial combination, an index into sourceArray, and the number of elements
  // required to be added to create a full-length combination.  Called recursively to build
  // combinations, adding subsequent elements at each call depth.
  const makeNextCombos = (workingCombo: T[], currentIndex: number, remainingCount: number) => {
    const oneAwayFromComboLength = remainingCount === 1;

    // For each element that remaines to be added to the working combination.
    for (let sourceIndex = currentIndex; sourceIndex < sourceLength; sourceIndex++) {
      // Get next (possibly partial) combination.
      const next = [...workingCombo, sourceArray[sourceIndex]];

      if (oneAwayFromComboLength) {
        // Combo of right length found, save it.
        combos.push(next);
      } else {
        // Otherwise go deeper to add more elements to the current partial combination.
        makeNextCombos(next, sourceIndex + 1, remainingCount - 1);
      }
    }
  };

  makeNextCombos([], 0, comboLength);

  return combos;
};
