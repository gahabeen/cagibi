import { merge, wrap } from '../src/core';

describe('end-to-end', () => {
  it('should work', () => {

    const state = wrap({
      work: {
        name: 'super'
      },
      matches: [],
      urls: [],
    });

    const match = wrap({}, state.matches);
    match.name = 'match';

    const list = { urls: ['https://google.com'] };
    const boolean = { test: true };

    const merged = merge(state, match, list, boolean);

    expect(merged.matches?.[0]).toStrictEqual(match);
    expect(merged.urls).toStrictEqual(list.urls);
    expect(merged.test).toStrictEqual(boolean.test);
  });

  it('should work', () => {

    const results = wrap([]);

    const result = {
      work: {
        name: null
      },
    };

    const result1 = wrap(result, results);
    result1.work.name = 'result 1';

    const merged = merge(results, result1);

    expect(merged?.[0]?.work?.name).toStrictEqual(result1.work.name);
  });


  it('should work', () => {

    const state = wrap({
      jobs: {
        one: {
          startedAt: null,
          endedAt: null,
        }
      }
    });

    state.jobs.one.startedAt = new Date().getTime();

    const sameState = wrap(state);
    sameState.jobs.one.endedAt = new Date().getTime();

    const merged = merge(state, sameState);

    expect(merged.jobs.one.endedAt).toBeGreaterThanOrEqual(merged.jobs.one.startedAt);
  });

});