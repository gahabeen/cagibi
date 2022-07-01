import { read, write } from '../src/io';
import { join, unmake, make } from '../src/main';

describe('end-to-end', () => {
  it('should work', () => {

    const obj = {
      work: {
        name: 'super'
      },
      matches: [],
      urls: [],
    };
    const state = make(obj);

    const match = make({ name: '' }, state.matches);
    match.name = 'match';

    const merged = join(state, match);

    expect(unmake(state)).toStrictEqual(obj);
    expect(merged.matches?.[0]).toStrictEqual(match);
  });

  it('should work', () => {

    const state = make({
      work: {
        name: 'super'
      },
      matches: [],
      urls: [],
    });

    const match = make({ name: '' }, state.matches);

    match.name = 'match';

    const list = { urls: ['https://google.com'] };
    const boolean = { test: true };

    const merged = join(state, match, list, boolean);

    expect(merged.matches?.[0]).toStrictEqual(match);
    expect(merged.urls).toStrictEqual(list.urls);
    expect(merged.test).toStrictEqual(boolean.test);
  });

  it('should work', () => {

    const results = make<any[]>([]);

    const result = {
      work: {
        name: null
      },
    };

    const result1 = make<any>(result, results);
    result1.work.name = 'result 1';

    const merged = join(results, result1);

    expect(merged?.[0]?.work?.name).toStrictEqual(result1.work.name);
  });

  it('should work', () => {

    const state = make<any>({
      jobs: {
        one: {
          startedAt: null,
          endedAt: null,
        }
      }
    });

    state.jobs.one.startedAt = new Date().getTime();

    const sameState = make(state);
    sameState.jobs.one.endedAt = new Date().getTime();

    const merged = join(state, sameState);

    expect(merged.jobs.one.endedAt).toBeGreaterThanOrEqual(merged.jobs.one.startedAt);
  });

  it('should work', () => {

    type ItemType = Partial<{ id: number, matches: { name: string }[] }>;
    const state = make<ItemType[]>([]);

    const item = make<ItemType>({}, state);

    item.id = 1;
    const matches = item.matches;

    matches?.push({ name: 'Joe' });
    matches?.push({ name: 'Janne' });

    const merged = join(state, item);

    expect(merged.length).toBe(1);
  });

  it('should work', () => {
    type ItemType = Partial<{ id: number, matches: { name: string }[] }>;
    const state = make<ItemType[]>([]);
    state.push({ id: 1, matches: [] });

    const { matches } = [...state].pop() || {};

    if (matches) {
      matches.push({ name: 'Joe' });
      matches.push({ name: 'Janne' });

      const merged = join(state, matches);

      expect(merged.length).toBe(1);
    }
  });

  it('should work', () => {
    const state = make<any[]>([]);
    const item = make<any>({}, state)

    item.name = 'Joe';

    const merged = join(state, item);

    expect(merged?.[0]?.name).toBe('Joe');
  });

  it('should work', () => {
    const state = make<any[]>([]);
    const item = make<any>({}, state)

    item.name = 'Joe';

    const merged = join(state, item);

    expect(merged?.[0]?.name).toBe('Joe');
  });


  it('should work', () => {
    const dataset = make<any[]>([]);
    const states = [];

    for (const step in [1, 2, 3]) {
      const result = make<any>({}, dataset);
      result.step = step;
      states.push(write(result));
    }

    const items = states.map(state => read(state));

    const merged = join(dataset, ...items);

    expect(merged?.length).toBe(3);
  });

});