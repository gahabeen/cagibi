import { getId, getParentId } from '../src/accessors';
import { make, merge } from '../src/core';

describe('end-to-end', () => {
  it('should work', () => {

    const state = make({
      work: {
        name: 'super'
      },
      matches: [],
      urls: [],
    });

    const match = make({}, state.matches);
    match.name = 'match';

    const list = { urls: ['https://google.com'] };
    const boolean = { test: true };

    const merged = merge(state, match, list, boolean);

    expect(merged.matches?.[0]).toStrictEqual(match);
    expect(merged.urls).toStrictEqual(list.urls);
    expect(merged.test).toStrictEqual(boolean.test);
  });

});