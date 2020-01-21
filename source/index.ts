/// <reference lib="es2018"/>
/// <reference lib="dom"/>
/// <reference types="node"/>

export type Class<T = unknown> = new (...args: any[]) => T;

export const enum TypeName {
	null = 'null',
	boolean = 'boolean',
	undefined = 'undefined',
	string = 'string',
	number = 'number',
	bigint = 'bigint',
	symbol = 'symbol',
	Function = 'Function',
	Generator = 'Generator',
	GeneratorFunction = 'GeneratorFunction',
	AsyncFunction = 'AsyncFunction',
	Observable = 'Observable',
	Array = 'Array',
	Buffer = 'Buffer',
	Object = 'Object',
	RegExp = 'RegExp',
	Date = 'Date',
	Error = 'Error',
	Map = 'Map',
	Set = 'Set',
	WeakMap = 'WeakMap',
	WeakSet = 'WeakSet',
	Int8Array = 'Int8Array',
	Uint8Array = 'Uint8Array',
	Uint8ClampedArray = 'Uint8ClampedArray',
	Int16Array = 'Int16Array',
	Uint16Array = 'Uint16Array',
	Int32Array = 'Int32Array',
	Uint32Array = 'Uint32Array',
	Float32Array = 'Float32Array',
	Float64Array = 'Float64Array',
	BigInt64Array = 'BigInt64Array',
	BigUint64Array = 'BigUint64Array',
	ArrayBuffer = 'ArrayBuffer',
	SharedArrayBuffer = 'SharedArrayBuffer',
	DataView = 'DataView',
	Promise = 'Promise',
	URL = 'URL'
}

const {toString} = Object.prototype;
const isOfType = <T>(type: string) => (value: unknown): value is T => typeof value === type;

const getObjectType = (value: unknown): TypeName | undefined => {
	const objectName = toString.call(value).slice(8, -1);
	if (objectName) {
		return objectName as TypeName;
	}

	return undefined;
};

const isObjectOfType = <T>(type: TypeName) => (value: unknown): value is T => getObjectType(value) === type;

function is(value: unknown): TypeName {
	switch (value) {
		case null:
			return TypeName.null;
		case true:
		case false:
			return TypeName.boolean;
		default:
	}

	switch (typeof value) {
		case 'undefined':
			return TypeName.undefined;
		case 'string':
			return TypeName.string;
		case 'number':
			return TypeName.number;
		case 'bigint':
			return TypeName.bigint;
		case 'symbol':
			return TypeName.symbol;
		default:
	}

	if (is.function_(value)) {
		return TypeName.Function;
	}

	if (is.observable(value)) {
		return TypeName.Observable;
	}

	if (is.array(value)) {
		return TypeName.Array;
	}

	if (is.buffer(value)) {
		return TypeName.Buffer;
	}

	const tagType = getObjectType(value);
	if (tagType) {
		return tagType;
	}

	if (value instanceof String || value instanceof Boolean || value instanceof Number) {
		throw new TypeError('Please don\'t use object wrappers for primitive types');
	}

	return TypeName.Object;
}

is.undefined = isOfType<undefined>('undefined');
is.string = isOfType<string>('string');

const isNumberType = isOfType<number>('number');
is.number = (value: unknown): value is number => isNumberType(value) && !is.nan(value);

is.bigint = isOfType<bigint>('bigint');

// eslint-disable-next-line @typescript-eslint/ban-types
is.function_ = isOfType<Function>('function');

is.null_ = (value: unknown): value is null => value === null;
is.class_ = (value: unknown): value is Class => is.function_(value) && value.toString().startsWith('class ');
is.boolean = (value: unknown): value is boolean => value === true || value === false;
is.symbol = isOfType<symbol>('symbol');

is.numericString = (value: unknown): value is string =>
	is.string(value) && value.length > 0 && !Number.isNaN(Number(value));

is.array = Array.isArray;
is.buffer = (value: unknown): value is Buffer => !is.nullOrUndefined(value) && !is.nullOrUndefined((value as Buffer).constructor) && is.function_((value as Buffer).constructor.isBuffer) && (value as Buffer).constructor.isBuffer(value);

is.nullOrUndefined = (value: unknown): value is null | undefined => is.null_(value) || is.undefined(value);
is.object = (value: unknown): value is object => !is.null_(value) && (typeof value === 'object' || is.function_(value));
is.iterable = (value: unknown): value is IterableIterator<unknown> => !is.nullOrUndefined(value) && is.function_((value as IterableIterator<unknown>)[Symbol.iterator]);

is.asyncIterable = (value: unknown): value is AsyncIterableIterator<unknown> => !is.nullOrUndefined(value) && is.function_((value as AsyncIterableIterator<unknown>)[Symbol.asyncIterator]);

is.generator = (value: unknown): value is Generator => is.iterable(value) && is.function_(value.next) && is.function_(value.throw);

is.nativePromise = (value: unknown): value is Promise<unknown> =>
	isObjectOfType<Promise<unknown>>(TypeName.Promise)(value);

const hasPromiseAPI = (value: unknown): value is Promise<unknown> =>
	is.object(value) &&
	is.function_((value as Promise<unknown>).then) && // eslint-disable-line promise/prefer-await-to-then
	is.function_((value as Promise<unknown>).catch);

is.promise = (value: unknown): value is Promise<unknown> => is.nativePromise(value) || hasPromiseAPI(value);

is.generatorFunction = isObjectOfType<GeneratorFunction>(TypeName.GeneratorFunction);

is.asyncFunction = (value: unknown): value is ((...args: any[]) => Promise<unknown>) => getObjectType(value) === TypeName.AsyncFunction;

// eslint-disable-next-line no-prototype-builtins, @typescript-eslint/ban-types
is.boundFunction = (value: unknown): value is Function => is.function_(value) && !value.hasOwnProperty('prototype');

is.regExp = isObjectOfType<RegExp>(TypeName.RegExp);
is.date = isObjectOfType<Date>(TypeName.Date);
is.error = isObjectOfType<Error>(TypeName.Error);
is.map = (value: unknown): value is Map<unknown, unknown> => isObjectOfType<Map<unknown, unknown>>(TypeName.Map)(value);
is.set = (value: unknown): value is Set<unknown> => isObjectOfType<Set<unknown>>(TypeName.Set)(value);
is.weakMap = (value: unknown): value is WeakMap<object, unknown> => isObjectOfType<WeakMap<object, unknown>>(TypeName.WeakMap)(value);
is.weakSet = (value: unknown): value is WeakSet<object> => isObjectOfType<WeakSet<object>>(TypeName.WeakSet)(value);

is.int8Array = isObjectOfType<Int8Array>(TypeName.Int8Array);
is.uint8Array = isObjectOfType<Uint8Array>(TypeName.Uint8Array);
is.uint8ClampedArray = isObjectOfType<Uint8ClampedArray>(TypeName.Uint8ClampedArray);
is.int16Array = isObjectOfType<Int16Array>(TypeName.Int16Array);
is.uint16Array = isObjectOfType<Uint16Array>(TypeName.Uint16Array);
is.int32Array = isObjectOfType<Int32Array>(TypeName.Int32Array);
is.uint32Array = isObjectOfType<Uint32Array>(TypeName.Uint32Array);
is.float32Array = isObjectOfType<Float32Array>(TypeName.Float32Array);
is.float64Array = isObjectOfType<Float64Array>(TypeName.Float64Array);
is.bigInt64Array = isObjectOfType<BigInt64Array>(TypeName.BigInt64Array);
is.bigUint64Array = isObjectOfType<BigUint64Array>(TypeName.BigUint64Array);

is.arrayBuffer = isObjectOfType<ArrayBuffer>(TypeName.ArrayBuffer);
is.sharedArrayBuffer = isObjectOfType<SharedArrayBuffer>(TypeName.SharedArrayBuffer);
is.dataView = isObjectOfType<DataView>(TypeName.DataView);

is.directInstanceOf = <T>(instance: unknown, class_: Class<T>): instance is T => Object.getPrototypeOf(instance) === class_.prototype;
is.urlInstance = (value: unknown): value is URL => isObjectOfType<URL>(TypeName.URL)(value);

is.urlString = (value: unknown): value is string => {
	if (!is.string(value)) {
		return false;
	}

	try {
		new URL(value); // eslint-disable-line no-new
		return true;
	} catch {
		return false;
	}
};

// TODO: Use the `not` operator with a type guard here when it's available.
// Example: `is.truthy = (value: unknown): value is (not false | not 0 | not '' | not undefined | not null) => Boolean(value);`
is.truthy = (value: unknown) => Boolean(value);
// Example: `is.falsy = (value: unknown): value is (not true | 0 | '' | undefined | null) => Boolean(value);`
is.falsy = (value: unknown) => !value;

is.nan = (value: unknown) => Number.isNaN(value as number);

const primitiveTypeOfTypes = new Set([
	'undefined',
	'string',
	'number',
	'bigint',
	'boolean',
	'symbol'
]);

// TODO: This should be able to be `not object` when the `not` operator is out
export type Primitive =
	| null
	| undefined
	| string
	| number
	| bigint
	| boolean
	| symbol;

is.primitive = (value: unknown): value is Primitive => is.null_(value) || primitiveTypeOfTypes.has(typeof value);

is.integer = (value: unknown): value is number => Number.isInteger(value as number);
is.safeInteger = (value: unknown): value is number => Number.isSafeInteger(value as number);

is.plainObject = (value: unknown): value is {[key: string]: unknown} => {
	// From: https://github.com/sindresorhus/is-plain-obj/blob/master/index.js
	if (getObjectType(value) !== TypeName.Object) {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);

	return prototype === null || prototype === Object.getPrototypeOf({});
};

const typedArrayTypes = new Set([
	TypeName.Int8Array,
	TypeName.Uint8Array,
	TypeName.Uint8ClampedArray,
	TypeName.Int16Array,
	TypeName.Uint16Array,
	TypeName.Int32Array,
	TypeName.Uint32Array,
	TypeName.Float32Array,
	TypeName.Float64Array,
	TypeName.BigInt64Array,
	TypeName.BigUint64Array
]);

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

is.typedArray = (value: unknown): value is TypedArray => {
	const objectType = getObjectType(value);
	if (objectType === undefined) {
		return false;
	}

	return typedArrayTypes.has(objectType);
};

export interface ArrayLike<T> {
	readonly [index: number]: T;
	readonly length: number;
}

const isValidLength = (value: unknown): value is number => is.safeInteger(value) && value >= 0;
is.arrayLike = (value: unknown): value is ArrayLike<unknown> => !is.nullOrUndefined(value) && !is.function_(value) && isValidLength((value as ArrayLike<unknown>).length);

is.inRange = (value: number, range: number | number[]): value is number => {
	if (is.number(range)) {
		return value >= Math.min(0, range) && value <= Math.max(range, 0);
	}

	if (is.array(range) && range.length === 2) {
		return value >= Math.min(...range) && value <= Math.max(...range);
	}

	throw new TypeError(`Invalid range: ${JSON.stringify(range)}`);
};

const NODE_TYPE_ELEMENT = 1;
const DOM_PROPERTIES_TO_CHECK = [
	'innerHTML',
	'ownerDocument',
	'style',
	'attributes',
	'nodeValue'
];

is.domElement = (value: unknown): value is Element => is.object(value) && (value as Element).nodeType === NODE_TYPE_ELEMENT && is.string((value as Element).nodeName) &&
	!is.plainObject(value) && DOM_PROPERTIES_TO_CHECK.every(property => property in (value as Element));

export interface ObservableLike {
	subscribe(observer: (value: unknown) => void): void;
	[Symbol.observable](): ObservableLike;
}

is.observable = (value: unknown): value is ObservableLike => {
	if (!value) {
		return false;
	}

	// eslint-disable-next-line no-use-extend-native/no-use-extend-native
	if ((value as any)[Symbol.observable] && value === (value as any)[Symbol.observable]()) {
		return true;
	}

	if ((value as any)['@@observable'] && value === (value as any)['@@observable']()) {
		return true;
	}

	return false;
};

export interface NodeStream extends NodeJS.EventEmitter {
	pipe<T extends NodeJS.WritableStream>(destination: T, options?: {end?: boolean}): T;
}

is.nodeStream = (value: unknown): value is NodeStream => is.object(value) && is.function_((value as NodeStream).pipe) && !is.observable(value);

is.infinite = (value: unknown): value is number => value === Infinity || value === -Infinity;

const isAbsoluteMod2 = (remainder: number) => (value: number): value is number => is.integer(value) && Math.abs(value % 2) === remainder;
is.evenInteger = isAbsoluteMod2(0);
is.oddInteger = isAbsoluteMod2(1);

is.emptyArray = (value: unknown): value is never[] => is.array(value) && value.length === 0;
is.nonEmptyArray = (value: unknown): value is unknown[] => is.array(value) && value.length > 0;

is.emptyString = (value: unknown): value is '' => is.string(value) && value.length === 0;

// TODO: Use `not ''` when the `not` operator is available.
is.nonEmptyString = (value: unknown): value is string => is.string(value) && value.length > 0;

const isWhiteSpaceString = (value: unknown): value is string => is.string(value) && /\S/.test(value) === false;
is.emptyStringOrWhitespace = (value: unknown): value is string => is.emptyString(value) || isWhiteSpaceString(value);

is.emptyObject = (value: unknown): value is {[key: string]: never} => is.object(value) && !is.map(value) && !is.set(value) && Object.keys(value).length === 0;

// TODO: Use `not` operator here to remove `Map` and `Set` from type guard:
// - https://github.com/Microsoft/TypeScript/pull/29317
is.nonEmptyObject = (value: unknown): value is {[key: string]: unknown} => is.object(value) && !is.map(value) && !is.set(value) && Object.keys(value).length > 0;

is.emptySet = (value: unknown): value is Set<never> => is.set(value) && value.size === 0;
is.nonEmptySet = (value: unknown): value is Set<unknown> => is.set(value) && value.size > 0;

is.emptyMap = (value: unknown): value is Map<never, never> => is.map(value) && value.size === 0;
is.nonEmptyMap = (value: unknown): value is Map<unknown, unknown> => is.map(value) && value.size > 0;

export type Predicate = (value: unknown) => boolean;

type ArrayMethod = (fn: (value: unknown, index: number, array: unknown[]) => boolean, thisArg?: unknown) => boolean;

const predicateOnArray = (method: ArrayMethod, predicate: Predicate, values: unknown[]) => {
	if (is.function_(predicate) === false) {
		throw new TypeError(`Invalid predicate: ${JSON.stringify(predicate)}`);
	}

	if (values.length === 0) {
		throw new TypeError('Invalid number of values');
	}

	return method.call(values, predicate);
};

is.any = (predicate: Predicate, ...values: unknown[]): boolean => predicateOnArray(Array.prototype.some, predicate, values);
is.all = (predicate: Predicate, ...values: unknown[]): boolean => predicateOnArray(Array.prototype.every, predicate, values);

// Some few keywords are reserved, but we'll populate them for Node.js users
// See https://github.com/Microsoft/TypeScript/issues/2536
Object.defineProperties(is, {
	class: {
		value: is.class_
	},
	function: {
		value: is.function_
	},
	null: {
		value: is.null_
	}
});

export default is;

// For CommonJS default export support
module.exports = is;
module.exports.default = is;
