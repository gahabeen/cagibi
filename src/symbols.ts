export const createSymbol = (key: string) => Symbol(`Cagibi__${key}`);
export const toString = (symbol: Symbol) => `${symbol.toString()}`;
export const toSymbol = (key: string | symbol) => {
  if (typeof key === 'symbol') return key;
  const symbolString = key.match?.(/\(.+\)/g)?.[0] as unknown as string;
  if (!symbolString) {
    throw new Error("Invalid symbol string");
  }
  const matched = ContextSymbols.find((symbol) => symbol.toString().includes((symbolString).slice(1, -1)));
  if (!matched) {
    throw new Error("No symbol found");
  }
  return matched;
};

// Context Symbols
export const Reference = createSymbol('Reference');
export const DestinationReference = createSymbol('DestinationReference');
export const CreatedAt = createSymbol('CreatedAt');
export const UpdatedAt = createSymbol('UpdatedAt');

export const ContextSymbols = [Reference, DestinationReference, CreatedAt, UpdatedAt];

// Flatten
export const Data = createSymbol('Data');
export const Contexts = createSymbol('Contexts');

// Helper Symbols
export const Root = createSymbol('Root');
export const Source = createSymbol('Source');
export const IsProxied = createSymbol('IsProxied');