import { make, stitch, unmake } from '../src/core';
import { read, write } from '../src/io';
import { ReallyAny } from '../src/types';

describe('end-to-end', () => {
    it('should work', () => {
        const obj = {
            work: {
                name: 'super',
            },
            matches: [],
            urls: [],
        };
        const state = make(obj);

        const match = make({ name: '' }, state.matches);
        match.name = 'match';

        const stitched = stitch(state, match);

        expect(unmake(state)).toStrictEqual(obj);
        expect(stitched.matches?.[0]).toStrictEqual(match);
    });

    it('should work', () => {
        const state = make({
            work: {
                name: 'super',
            },
            matches: [],
            urls: [],
        });

        const match = make({ name: '' }, state.matches);

        match.name = 'match';

        const list = { urls: ['https://google.com'] };
        const boolean = { test: true };

        const stitched = stitch(state, match, list, boolean);

        expect(stitched.matches?.[0]).toStrictEqual(match);
        expect(stitched.urls).toStrictEqual(list.urls);
        expect(stitched.test).toStrictEqual(boolean.test);
    });

    it('should work', () => {
        const results = make<ReallyAny[]>([]);

        const result = {
            work: {
                name: null,
            },
        };

        const result1 = make<ReallyAny>(result, results);
        result1.work.name = 'result 1';

        const stitched = stitch(results, result1);

        expect(stitched?.[0]?.work?.name).toStrictEqual(result1.work.name);
    });

    it('should work', () => {
        const state = make<ReallyAny>({
            jobs: {
                one: {
                    startedAt: null,
                    endedAt: null,
                },
            },
        });

        state.jobs.one.startedAt = new Date().getTime();

        const sameState = make(state);
        sameState.jobs.one.endedAt = new Date().getTime();

        const stitched = stitch(state, sameState);

        expect(stitched.jobs.one.endedAt).toBeGreaterThanOrEqual(stitched.jobs.one.startedAt);
    });

    it('should work', () => {
        type ItemType = Partial<{ id: number, matches: { name: string }[] }>;
        const state = make<ItemType[]>([]);

        const item = make<ItemType>({}, state);

        item.id = 1;
        const { matches } = item;

        matches?.push({ name: 'Joe' });
        matches?.push({ name: 'Janne' });

        const stitched = stitch(state, item);

        expect(stitched.length).toBe(1);
    });

    it('should work', () => {
        type ItemType = Partial<{ id: number, matches: { name: string }[] }>;
        const state = make<ItemType[]>([]);
        state.push({ id: 1, matches: [] });

        const { matches } = [...state].pop() || {};

        if (matches) {
            matches.push({ name: 'Joe' });
            matches.push({ name: 'Janne' });

            const stitched = stitch(state, matches);

            expect(stitched.length).toBe(1);
        }
    });

    it('should work', () => {
        const state = make<ReallyAny[]>([]);
        const item = make<ReallyAny>({}, state);

        item.name = 'Joe';

        const stitched = stitch(state, item);

        expect(stitched?.[0]?.name).toBe('Joe');
    });

    it('should work', () => {
        const state = make<ReallyAny[]>([]);
        const item = make<ReallyAny>({}, state);

        item.name = 'Joe';

        const stitched = stitch(state, item);

        expect(stitched?.[0]?.name).toBe('Joe');
    });

    it('should work', () => {
        const dataset = make<ReallyAny[]>([]);
        const states: ReallyAny[] = [];

        const steps = [1, 2, 3, 4, 5];

        for (const step of Object.keys(steps)) {
            const result = make({}, dataset);
            result.step = step;
            states.push(write(result));
        }

        const items = states.map((state) => read(state));

        const stitched = stitch(dataset, ...items);

        expect(stitched?.length).toBe(steps.length);
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
        const states: ReallyAny[] = [];

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
                        ],
                    },
                ],
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
                        ],
                    },
                    {
                        id: 2,
                        episodes: [
                            { id: 1, name: 'A name' },
                            { id: 2, name: 'Another name' },
                            { id: 3, name: 'Another name again' },
                        ],
                    },
                ],
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
                        ],
                    },
                ],
            },
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
                }, read<TvShow>(tvShowSaved).seasons);

                const seasonSaved = write(season);
                states.push(seasonSaved);

                for (const episodeItem of seasonItem.episodes) {
                    const episode = make<typeof episodeItem>({
                        id: episodeItem.id,
                        name: episodeItem.name,
                    }, read(seasonSaved).episodes);

                    const episodeSaved = write(episode);
                    states.push(episodeSaved);
                }
            }
        }

        const items = states.map((state) => read(state));
        const stitched = stitch(dataset, ...items);

        expect(stitched).toEqual(tvShows);
    });
});
