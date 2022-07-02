import { read, write } from '../src/io';
import { stitch, unmake, make } from '../src/core';

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

    const merged = stitch(state, match);

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

    const merged = stitch(state, match, list, boolean);

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

    const merged = stitch(results, result1);

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

    const merged = stitch(state, sameState);

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

    const merged = stitch(state, item);

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

      const merged = stitch(state, matches);

      expect(merged.length).toBe(1);
    }
  });

  it('should work', () => {
    const state = make<any[]>([]);
    const item = make<any>({}, state)

    item.name = 'Joe';

    const merged = stitch(state, item);

    expect(merged?.[0]?.name).toBe('Joe');
  });

  it('should work', () => {
    const state = make<any[]>([]);
    const item = make<any>({}, state)

    item.name = 'Joe';

    const merged = stitch(state, item);

    expect(merged?.[0]?.name).toBe('Joe');
  });


  it('should work', () => {
    const dataset = make<any[]>([]);
    const states: any[] = [];

    const steps = [1, 2, 3, 4, 5];

    for (const step in steps) {
      const result = make({}, dataset);
      result.step = step;
      states.push(write(result));
    }

    const items = states.map(state => read(state));

    const merged = stitch(dataset, ...items);

    expect(merged?.length).toBe(steps.length);
  });

  it('should work', () => {
    type TvShow = {
      id: number,
      name?: string,
      seasons: {
        id: number,
        episodes: {
          id: number,
          name?: string,
        }[]
      }[]
    }
    const dataset = make<TvShow[]>([]);
    const states: any[] = [];

    const tvShows: TvShow[] = [
      {
        id: 1,
        name: 'Game of Thrones',
        seasons: [
          {
            id: 1,
            episodes: [
              { id: 1, name: 'Winter is Coming' },
              { id: 2, name: 'The Kingsroad' },
              { id: 3, name: 'A Golden Crown' },
            ]
          }
        ]
      },
      {
        id: 2,
        name: 'The Big Bang Theory',
        seasons: [
          {
            id: 1,
            episodes: [
              { id: 1, name: 'Something' },
              { id: 2, name: 'Something else' },
              { id: 3, name: 'Something else again' },
            ]
          },
          {
            id: 2,
            episodes: [
              { id: 1, name: 'A name' },
              { id: 2, name: 'Another name' },
              { id: 3, name: 'Another name again' },
            ]
          }
        ]
      },
      {
        id: 3,
        name: 'The Simpsons',
        seasons: [
          {
            id: 1,
            episodes: [
              { id: 1, name: 'Pilote' },
              { id: 2, name: 'The Telltale Head' },
              { id: 3, name: 'The Last Picture Show' },
            ]
          }
        ]
      }
    ];

    for (const tvShowItem of tvShows) {
      const tvShow = make<TvShow>({
        id: tvShowItem.id,
        name: tvShowItem.name,
        seasons: [],
      }, dataset);

      const tvShowSaved = write(tvShow);
      states.push(tvShowSaved);

      for (const seasonItem of tvShowItem.seasons) {
        const season = make<typeof seasonItem>({
          id: seasonItem.id,
          episodes: [],
        }, read<TvShow>(tvShowSaved).seasons)

        const seasonSaved = write(season);
        states.push(seasonSaved);

        for (const episodeItem of seasonItem.episodes) {
          const episode = make<typeof episodeItem>({
            id: episodeItem.id,
            name: episodeItem.name,
          }, read(seasonSaved).episodes)

          const episodeSaved = write(episode);
          states.push(episodeSaved);
        }
      }
    }

    const items = states.map(state => read(state))
    const merged = stitch(dataset, ...items);

    expect(merged).toStrictEqual(tvShows);
  });

});
