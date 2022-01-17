// Extracted from https://github.com/sindresorhus/type-fest/blob/78019f42ea888b0cdceb41a4a78163868de57555/index.d.ts

/**
Matches any [primitive value](https://developer.mozilla.org/en-US/docs/Glossary/Primitive).
*/
export type Primitive =
	| null
	| undefined
	| string
	| number
	| boolean
	| symbol
	| bigint;

// TODO: Remove the `= unknown` sometime  in the future when most users are on TS 3.5 as it's now the default
/**
Matches a [`class` constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes).
*/
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
	interface SymbolConstructor {
		readonly observable: symbol;
	}
}

/**
Matches a value that is like an [Observable](https://github.com/tc39/proposal-observable).
*/
export interface ObservableLike {
	subscribe(observer: (value: unknown) => void): void;
	[Symbol.observable](): ObservableLike;
}

/**
A `number` that is an integer.
You can't pass a `bigint` as they are already guaranteed to be integers.

Use-case: Validating and documenting parameters.

@example
```
import {Integer} from 'type-fest';
declare function setYear<T extends number>(length: Integer<T>): void;
```

@see NegativeInteger
@see NonNegativeInteger

@category Numeric
*/
// `${bigint}` is a type that matches a valid bigint literal without the `n` (ex. 1, 0b1, 0o1, 0x1)
// Because T is a number and not a string we can effectively use this to filter out any numbers containing decimal points
export type Integer<Type extends number> = `${Type}` extends `${bigint}` ? Type : never;

/**
Matches the hidden `Infinity` type.
Please upvote [this issue](https://github.com/microsoft/TypeScript/issues/32277) if you want to have this type as a built-in in TypeScript.
@see NegativeInfinity
@category Numeric
*/
// See https://github.com/microsoft/TypeScript/issues/31752
export type PositiveInfinity = 1e999;

/**
Matches the hidden `-Infinity` type.
Please upvote [this issue](https://github.com/microsoft/TypeScript/issues/32277) if you want to have this type as a built-in in TypeScript.
@see PositiveInfinity
@category Numeric
*/
// See https://github.com/microsoft/TypeScript/issues/31752
export type NegativeInfinity = -1e999;
