export type ObjectLike = { [Key in string | number | symbol]: any; } | ArrayLike<any>

export type WithProperties<T> = T extends ArrayLike<any> ? T : (T & { [key: string | number | symbol]: any })