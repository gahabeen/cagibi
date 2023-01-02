export const createSymbol = (key: string) => Symbol(`📦${key}`);
export const toString = (symbol: symbol) => `${symbol.toString()}`;
export const toSymbol = (key: string | symbol) => {
    if (typeof key === 'symbol') return key;
    const symbolString = key.match?.(/\(.+\)/g)?.[0] as unknown as string;
    if (!symbolString) {
        throw new Error('Invalid symbol string');
    }
    const matched = ContextSymbols.find((symbol) => symbol.toString().includes((symbolString).slice(1, -1)));
    if (!matched) {
        throw new Error('No symbol found');
    }
    return matched;
};

// Context Symbols
export const Reference = createSymbol('RF');
export const OriginReference = createSymbol('OR');
export const CreatedAt = createSymbol('CA');
export const UpdatedAt = createSymbol('UA');
export const UpdateIndex = createSymbol('UO');

export const ContextSymbols = [Reference, OriginReference, CreatedAt, UpdatedAt, UpdateIndex];

// IO
export const Data = createSymbol('DT');
export const Contexts = createSymbol('CX');

// Helper Symbols
export const Root = createSymbol('RT');
export const Source = createSymbol('SR');
export const IsProxied = createSymbol('IP');
