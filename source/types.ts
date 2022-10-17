// Extracted from https://github.com/sindresorhus/type-fest/blob/78019f42ea888b0cdceb41a4a78163868de57555/index.d.ts

/**
Matches any [primitive value](https://developer.mozilla.org/en-US/docs/Glossary/Primitive).
*/
export type Primitive =
	| null // eslint-disable-line @typescript-eslint/ban-types
	| undefined
	| string
	| number
	| boolean
	| symbol
	| bigint;

/**
Matches a [`class` constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes).
*/
/// type Constructor<T, Arguments extends unknown[] = any[]> = new(...arguments_: Arguments) => T;

/**
Matches a [`class`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes).
*/
// TODO: Use the below in the next major version.
// export type Class<T, Arguments extends unknown[] = any[]> = Constructor<T, Arguments> & {prototype: T};
export type Class<T = unknown, Arguments extends any[] = any[]> = new (...arguments_: Arguments) => T;

/**
Matches any [typed array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray), like `Uint8Array` or `Float64Array`.
*/
export type TypedArray =
	| Int8Array
	| Uint8Array
	| Uint8ClampedArray
	| Int16Array
	| Uint16Array
	| Int32Array
	| Uint32Array
	| Float32Array
	| Float64Array
	| BigInt64Array
	| BigUint64Array;

declare global {
	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- This must be an `interface` so it can be merged.
	interface SymbolConstructor {
		readonly observable: symbol;
	}
}

/**
Matches a value that is like an [Observable](https://github.com/tc39/proposal-observable).
*/
export type ObservableLike = {
	subscribe(observer: (value: unknown) => void): void;
	[Symbol.observable](): ObservableLike;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type Falsy = false | 0 | 0n | '' | null | undefined;

export type WeakRef<T extends object> = { // eslint-disable-line @typescript-eslint/ban-types
	readonly [Symbol.toStringTag]: 'WeakRef';
	deref(): T | undefined;
};
