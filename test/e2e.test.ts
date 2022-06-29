import { getId, getParentId } from '../src/accessors';
import { join, unwrap, wrap } from '../src/core';

describe('end-to-end', () => {
  it('should work', () => {

    const obj = {
      work: {
        name: 'super'
      },
      matches: [],
      urls: [],
    };
    const state = wrap(obj);

    const match = wrap({ name: '' }, state.matches);
    match.name = 'match';

    const merged = join(state, match);

    expect(unwrap(state)).toStrictEqual(obj);
    expect(merged.matches?.[0]).toStrictEqual(match);
  });

  it('should work', () => {

    const state = wrap({
      work: {
        name: 'super'
      },
      matches: [],
      urls: [],
    });

    const match = wrap({ name: '' }, state.matches);

    match.name = 'match';

    const list = { urls: ['https://google.com'] };
    const boolean = { test: true };

    const merged = join(state, match, list, boolean);

    expect(merged.matches?.[0]).toStrictEqual(match);
    expect(merged.urls).toStrictEqual(list.urls);
    expect(merged.test).toStrictEqual(boolean.test);
  });

  it('should work', () => {

    const results = wrap<any[]>([]);

    const result = {
      work: {
        name: null
      },
    };

    const result1 = wrap<any>(result, results);
    result1.work.name = 'result 1';

    const merged = join(results, result1);

    expect(merged?.[0]?.work?.name).toStrictEqual(result1.work.name);
  });

  it('should work', () => {

    const state = wrap<any>({
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

    const merged = join(state, sameState);

    expect(merged.jobs.one.endedAt).toBeGreaterThanOrEqual(merged.jobs.one.startedAt);
  });

  it('should work', () => {

    type ItemType = Partial<{ id: number, matches: { name: string }[] }>;
    const state = wrap<ItemType[]>([]);

    const item = wrap<ItemType>({}, state);

    item.id = 1;
    const matches = item.matches;

    matches?.push({ name: 'Joe' });
    matches?.push({ name: 'Janne' });

    const merged = join(state, item);

    expect(merged.length).toBe(1);
  });

  it('should work', () => {
    type ItemType = Partial<{ id: number, matches: { name: string }[] }>;
    const state = wrap<ItemType[]>([]);
    state.push({ id: 1, matches: [] });

    const { matches } = [...state].pop() || {};

    if (matches) {
      matches.push({ name: 'Joe' });
      matches.push({ name: 'Janne' });

      const merged = join(state, matches);

      expect(merged.length).toBe(1);
    }
  });

});