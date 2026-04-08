// Extracted from https://github.com/sindresorhus/type-fest/blob/78019f42ea888b0cdceb41a4a78163868de57555/index.d.ts

/**
Matches any [primitive value](https://developer.mozilla.org/en-US/docs/Glossary/Primitive).
*/
export type Primitive =
	// eslint-disable-next-line @typescript-eslint/no-restricted-types
	| null
	| undefined
	| string
	| number
	| boolean
	| symbol
	| bigint;

/**
Matches a [`class` constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes).
*/
type Constructor<T, Arguments extends unknown[] = any[]> = new(...arguments_: Arguments) => T;

/**
Matches a [`class`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes).
*/
export type Class<T, Arguments extends unknown[] = any[]> = Constructor<T, Arguments> & {prototype: T};

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

// eslint-disable-next-line @typescript-eslint/no-restricted-types
export type Falsy = false | 0 | 0n | '' | null | undefined;

// eslint-disable-next-line @typescript-eslint/no-restricted-types
export type WeakRef<T extends object> = {
	readonly [Symbol.toStringTag]: 'WeakRef';
	deref(): T | undefined;
};

export type ArrayLike<T> = {
	readonly [index: number]: T;
	readonly length: number;
};

export type NodeStream = {
	pipe<T extends NodeJS.WritableStream>(destination: T, options?: {end?: boolean}): T;
} & NodeJS.EventEmitter;

export type Predicate = (value: unknown) => boolean;

export type NonEmptyString = string & {0: string};

export type Whitespace = ' ';

type Brand<Key extends string> = Readonly<Record<Key, true>>;

/**
A string that represents a valid URL.

This is a branded type to prevent incorrect TypeScript type narrowing.
*/
export type UrlString = string & {readonly __brand: 'UrlString'};

// Keep numeric guards branded and simple. This intentionally favors correct false-branch narrowing for `number` inputs over perfect success-branch narrowing for numeric literal unions.

/**
The IEEE 754 "Not-a-Number" value, typed as a subtype of `number`.

Branded to prevent false-branch narrowing to `never` when the input is `number`.
*/
export type NaN = number & Brand<'__nanBrand'>;

/**
A finite number (excludes `NaN`, `Infinity`, and `-Infinity`).

Branded to prevent false-branch narrowing to `never` when the input is `number`.
*/
export type FiniteNumber = number & Brand<'__finiteNumberBrand'>;

/**
A number greater than or equal to zero.

Branded to prevent false-branch narrowing to `never` when the input is `number`.
*/
export type NonNegativeNumber = number & Brand<'__nonNegativeNumberBrand'>;

/**
An integer value (no fractional part).

Branded to prevent false-branch narrowing to `never` when the input is `number`.
*/
export type Integer = FiniteNumber & Brand<'__integerBrand'>;

/**
A number greater than zero.

Branded to prevent false-branch narrowing to `never` when the input is `number`.
*/
export type PositiveNumber = NonNegativeNumber & Brand<'__positiveNumberBrand'>;

/**
A number less than zero.

Branded to prevent false-branch narrowing to `never` when the input is `number`.
*/
export type NegativeNumber = number & Brand<'__negativeNumberBrand'>;

/**
An integer less than zero.

Branded to prevent false-branch narrowing to `never` when the input is `number`.
*/
export type NegativeInteger = Integer & NegativeNumber & Brand<'__negativeIntegerBrand'>;

/**
An integer greater than or equal to zero.

Branded to prevent false-branch narrowing to `never` when the input is `number`.
*/
export type NonNegativeInteger = Integer & NonNegativeNumber & Brand<'__nonNegativeIntegerBrand'>;

/**
An integer greater than zero.

Branded to prevent false-branch narrowing to `never` when the input is `number`.
*/
export type PositiveInteger = NonNegativeInteger & PositiveNumber & Brand<'__positiveIntegerBrand'>;

// Note: type-fest uses the `1e999` overflow trick to represent these types (since TypeScript has
// no built-in Infinity type), but we use branded types here for consistency and to avoid
// relying on numeric overflow behavior.

/**
A positive infinite number (`Infinity`).

Branded to prevent false-branch narrowing to `never` when the input is `number`.
*/
export type PositiveInfinity = PositiveNumber & Brand<'__positiveInfinityBrand'>;

/**
A negative infinite number (`-Infinity`).

Branded to prevent false-branch narrowing to `never` when the input is `number`.
*/
export type NegativeInfinity = NegativeNumber & Brand<'__negativeInfinityBrand'>;

/**
A safe integer (within the range of `Number.MIN_SAFE_INTEGER` to `Number.MAX_SAFE_INTEGER`).

Branded to prevent false-branch narrowing to `never` when the input is `number`.
*/
export type SafeInteger = Integer & Brand<'__safeIntegerBrand'>;

/**
An even integer.

Branded to prevent false-branch narrowing to `never` when the input is `number`.
*/
export type EvenInteger = Integer & Brand<'__evenIntegerBrand'>;

/**
An odd integer.

Branded to prevent false-branch narrowing to `never` when the input is `number`.
*/
export type OddInteger = Integer & Brand<'__oddIntegerBrand'>;

/**
A non-negative safe integer, suitable as an array or string length.

Branded to prevent false-branch narrowing to `never` when the input is `number`.
*/
export type ValidLength = SafeInteger & NonNegativeInteger & Brand<'__validLengthBrand'>;
