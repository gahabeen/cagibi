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
export const Reference = createSymbol('R');
export const ParentReference = createSymbol('DR');
export const CreatedAt = createSymbol('CAT');
export const UpdatedAt = createSymbol('UAT');
export const UpdateIndex = createSymbol('UO');

export const ContextSymbols = [Reference, ParentReference, CreatedAt, UpdatedAt, UpdateIndex];

// IO
export const Data = createSymbol('D');
export const Contexts = createSymbol('C');

// Helper Symbols
export const Root = createSymbol('RT');
export const Source = createSymbol('S');
export const IsProxied = createSymbol('IP');
