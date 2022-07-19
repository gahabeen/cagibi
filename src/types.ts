// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReallyAny = any;

export type ObjectLike = { [Key in string | number | symbol]: ReallyAny; } | ArrayLike<ReallyAny>

export type PatchedObject = ObjectLike;

export type WithProperties<T> = T extends ArrayLike<ReallyAny> ? T : (T & { [key: string | number | symbol]: ReallyAny })

export type InputOuputType = 'compressed' | 'object';
