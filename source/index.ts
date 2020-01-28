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
	AsyncGenerator = 'AsyncGenerator',
	GeneratorFunction = 'GeneratorFunction',
	AsyncGeneratorFunction = 'AsyncGeneratorFunction',
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

is.asyncGenerator = (value: unknown): value is AsyncGenerator => is.asyncIterable(value) && is.function_(value.next) && is.function_(value.throw);

is.nativePromise = (value: unknown): value is Promise<unknown> =>
	isObjectOfType<Promise<unknown>>(TypeName.Promise)(value);

const hasPromiseAPI = (value: unknown): value is Promise<unknown> =>
	is.object(value) &&
	is.function_((value as Promise<unknown>).then) && // eslint-disable-line promise/prefer-await-to-then
	is.function_((value as Promise<unknown>).catch);

is.promise = (value: unknown): value is Promise<unknown> => is.nativePromise(value) || hasPromiseAPI(value);

is.generatorFunction = isObjectOfType<GeneratorFunction>(TypeName.GeneratorFunction);

is.asyncGeneratorFunction = (value: unknown): value is ((...args: any[]) => Promise<unknown>) => getObjectType(value) === TypeName.AsyncGeneratorFunction;

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

const assertType = (condition: boolean, description: string, value: unknown): asserts condition => {
	if (!condition) {
		throw new TypeError(`Expected value which is \`${description}\`, received value of type \`${is(value)}\`.`);
	}
};

export const enum AssertionTypeDescription {
	class_ = 'Class',
	numericString = 'string with a number',
	nullOrUndefined = 'null or undefined',
	iterable = 'Iterable',
	asyncIterable = 'AsyncIterable',
	nativePromise = 'native Promise',
	urlString = 'string with a URL',
	truthy = 'truthy',
	falsy = 'falsy',
	nan = 'NaN',
	primitive = 'primitive',
	integer = 'integer',
	safeInteger = 'integer',
	plainObject = 'plain object',
	arrayLike = 'array-like',
	typedArray = 'TypedArray',
	domElement = 'Element',
	nodeStream = 'Node.js Stream',
	infinite = 'infinite number',
	emptyArray = 'empty array',
	nonEmptyArray = 'non-empty array',
	emptyString = 'empty string',
	nonEmptyString = 'non-empty string',
	emptyStringOrWhitespace = 'empty string or whitespace',
	emptyObject = 'empty object',
	nonEmptyObject = 'non-empty object',
	emptySet = 'empty set',
	nonEmptySet = 'non-empty set',
	emptyMap = 'empty map',
	nonEmptyMap = 'non-empty map',

	evenInteger = 'even integer',
	oddInteger = 'odd integer',

	directInstanceOf = 'T',
	inRange = 'in range',

	any = 'predicate returns truthy for any value',
	all = 'predicate returns truthy for all values',
}

// Type assertions have to be declared with an explicit type.
interface Assert {
	// Unknowns.
	undefined: (value: unknown) => asserts value is undefined;
	string: (value: unknown) => asserts value is string;
	number: (value: unknown) => asserts value is number;
	bigint: (value: unknown) => asserts value is bigint;
	// eslint-disable-next-line @typescript-eslint/ban-types
	function_: (value: unknown) => asserts value is Function;
	null_: (value: unknown) => asserts value is null;
	class_: (value: unknown) => asserts value is Class;
	boolean: (value: unknown) => asserts value is boolean;
	symbol: (value: unknown) => asserts value is symbol;
	numericString: (value: unknown) => asserts value is string;
	array: <T = unknown>(value: unknown) => asserts value is T[];
	buffer: (value: unknown) => asserts value is Buffer;
	nullOrUndefined: (value: unknown) => asserts value is null | undefined;
	object: (value: unknown) => asserts value is Record<string, unknown>;
	iterable: <T = unknown>(value: unknown) => asserts value is Iterable<T>;
	asyncIterable: <T = unknown>(value: unknown) => asserts value is AsyncIterable<T>;
	generator: (value: unknown) => asserts value is Generator;
	nativePromise: <T = unknown>(value: unknown) => asserts value is Promise<T>;
	promise: <T = unknown>(value: unknown) => asserts value is Promise<T>;
	generatorFunction: (value: unknown) => asserts value is GeneratorFunction;
	// eslint-disable-next-line @typescript-eslint/ban-types
	asyncFunction: (value: unknown) => asserts value is Function;
	// eslint-disable-next-line @typescript-eslint/ban-types
	boundFunction: (value: unknown) => asserts value is Function;
	regExp: (value: unknown) => asserts value is RegExp;
	date: (value: unknown) => asserts value is Date;
	error: (value: unknown) => asserts value is Error;
	map: <TKey = unknown, TValue = unknown>(value: unknown) => asserts value is Map<TKey, TValue>;
	set: <T = unknown>(value: unknown) => asserts value is Set<T>;
	weakMap: <TKey extends object = object, TValue = unknown>(value: unknown) => asserts value is WeakMap<TKey, TValue>;
	weakSet: <T extends object = object>(value: unknown) => asserts value is WeakSet<T>;
	int8Array: (value: unknown) => asserts value is Int8Array;
	uint8Array: (value: unknown) => asserts value is Uint8Array;
	uint8ClampedArray: (value: unknown) => asserts value is Uint8ClampedArray;
	int16Array: (value: unknown) => asserts value is Int16Array;
	uint16Array: (value: unknown) => asserts value is Uint16Array;
	int32Array: (value: unknown) => asserts value is Int32Array;
	uint32Array: (value: unknown) => asserts value is Uint32Array;
	float32Array: (value: unknown) => asserts value is Float32Array;
	float64Array: (value: unknown) => asserts value is Float64Array;
	bigInt64Array: (value: unknown) => asserts value is BigInt64Array;
	bigUint64Array: (value: unknown) => asserts value is BigUint64Array;
	arrayBuffer: (value: unknown) => asserts value is ArrayBuffer;
	sharedArrayBuffer: (value: unknown) => asserts value is SharedArrayBuffer;
	dataView: (value: unknown) => asserts value is DataView;
	urlInstance: (value: unknown) => asserts value is URL;
	urlString: (value: unknown) => asserts value is string;
	truthy: (value: unknown) => asserts value is unknown;
	falsy: (value: unknown) => asserts value is unknown;
	nan: (value: unknown) => asserts value is unknown;
	primitive: (value: unknown) => asserts value is Primitive;
	integer: (value: unknown) => asserts value is number;
	safeInteger: (value: unknown) => asserts value is number;
	plainObject: (value: unknown) => asserts value is {[key: string]: unknown};
	typedArray: (value: unknown) => asserts value is TypedArray;
	arrayLike: <T = unknown>(value: unknown) => asserts value is ArrayLike<T>;
	domElement: (value: unknown) => asserts value is Element;
	observable: (value: unknown) => asserts value is ObservableLike;
	nodeStream: (value: unknown) => asserts value is NodeStream;
	infinite: (value: unknown) => asserts value is number;
	emptyArray: (value: unknown) => asserts value is never[];
	nonEmptyArray: (value: unknown) => asserts value is unknown[];
	emptyString: (value: unknown) => asserts value is '';
	nonEmptyString: (value: unknown) => asserts value is string;
	emptyStringOrWhitespace: (value: unknown) => asserts value is string;
	emptyObject: (value: unknown) => asserts value is {[key: string]: never};
	nonEmptyObject: (value: unknown) => asserts value is {[key: string]: unknown};
	emptySet: (value: unknown) => asserts value is Set<never>;
	nonEmptySet: (value: unknown) => asserts value is Set<unknown>;
	emptyMap: (value: unknown) => asserts value is Map<never, never>;
	nonEmptyMap: (value: unknown) => asserts value is Map<unknown, unknown>;

	// Numbers.
	evenInteger: (value: number) => asserts value is number;
	oddInteger: (value: number) => asserts value is number;

	// Two arguments.
	directInstanceOf: <T>(instance: unknown, class_: Class<T>) => asserts instance is T;
	inRange: (value: number, range: number | number[]) => asserts value is number;

	// Variadic functions.
	any: (predicate: Predicate, ...values: unknown[]) => void | never;
	all: (predicate: Predicate, ...values: unknown[]) => void | never;
}

export const assert: Assert = {
	// Unknowns.
	undefined: (value: unknown): asserts value is undefined => assertType(is.undefined(value), TypeName.undefined, value),
	string: (value: unknown): asserts value is string => assertType(is.string(value), TypeName.string, value),
	number: (value: unknown): asserts value is number => assertType(is.number(value), TypeName.number, value),
	bigint: (value: unknown): asserts value is bigint => assertType(is.bigint(value), TypeName.bigint, value),
	// eslint-disable-next-line @typescript-eslint/ban-types
	function_: (value: unknown): asserts value is Function => assertType(is.function_(value), TypeName.Function, value),
	null_: (value: unknown): asserts value is null => assertType(is.null_(value), TypeName.null, value),
	class_: (value: unknown): asserts value is Class => assertType(is.class_(value), AssertionTypeDescription.class_, value),
	boolean: (value: unknown): asserts value is boolean => assertType(is.boolean(value), TypeName.boolean, value),
	symbol: (value: unknown): asserts value is symbol => assertType(is.symbol(value), TypeName.symbol, value),
	numericString: (value: unknown): asserts value is string => assertType(is.numericString(value), AssertionTypeDescription.numericString, value),
	array: <T = unknown>(value: unknown): asserts value is T[] => assertType(is.array(value), TypeName.Array, value),
	buffer: (value: unknown): asserts value is Buffer => assertType(is.buffer(value), TypeName.Buffer, value),
	nullOrUndefined: (value: unknown): asserts value is null | undefined => assertType(is.nullOrUndefined(value), AssertionTypeDescription.nullOrUndefined, value),
	object: (value: unknown): asserts value is Record<string, unknown> => assertType(is.object(value), TypeName.Object, value),
	iterable: <T = unknown>(value: unknown): asserts value is Iterable<T> => assertType(is.iterable(value), AssertionTypeDescription.iterable, value),
	asyncIterable: <T = unknown>(value: unknown): asserts value is AsyncIterable<T> => assertType(is.asyncIterable(value), AssertionTypeDescription.asyncIterable, value),
	generator: (value: unknown): asserts value is Generator => assertType(is.generator(value), TypeName.Generator, value),
	nativePromise: <T = unknown>(value: unknown): asserts value is Promise<T> => assertType(is.nativePromise(value), AssertionTypeDescription.nativePromise, value),
	promise: <T = unknown>(value: unknown): asserts value is Promise<T> => assertType(is.promise(value), TypeName.Promise, value),
	generatorFunction: (value: unknown): asserts value is GeneratorFunction => assertType(is.generatorFunction(value), TypeName.GeneratorFunction, value),
	// eslint-disable-next-line @typescript-eslint/ban-types
	asyncFunction: (value: unknown): asserts value is Function => assertType(is.asyncFunction(value), TypeName.AsyncFunction, value),
	// eslint-disable-next-line @typescript-eslint/ban-types
	boundFunction: (value: unknown): asserts value is Function => assertType(is.boundFunction(value), TypeName.Function, value),
	regExp: (value: unknown): asserts value is RegExp => assertType(is.regExp(value), TypeName.RegExp, value),
	date: (value: unknown): asserts value is Date => assertType(is.date(value), TypeName.Date, value),
	error: (value: unknown): asserts value is Error => assertType(is.error(value), TypeName.Error, value),
	map: <TKey = unknown, TValue = unknown>(value: unknown): asserts value is Map<TKey, TValue> => assertType(is.map(value), TypeName.Map, value),
	set: <T = unknown>(value: unknown): asserts value is Set<T> => assertType(is.set(value), TypeName.Set, value),
	weakMap: <TKey extends object = object, TValue = unknown>(value: unknown): asserts value is WeakMap<TKey, TValue> => assertType(is.weakMap(value), TypeName.WeakMap, value),
	weakSet: <T extends object = object>(value: unknown): asserts value is WeakSet<T> => assertType(is.weakSet(value), TypeName.WeakSet, value),
	int8Array: (value: unknown): asserts value is Int8Array => assertType(is.int8Array(value), TypeName.Int8Array, value),
	uint8Array: (value: unknown): asserts value is Uint8Array => assertType(is.uint8Array(value), TypeName.Uint8Array, value),
	uint8ClampedArray: (value: unknown): asserts value is Uint8ClampedArray => assertType(is.uint8ClampedArray(value), TypeName.Uint8ClampedArray, value),
	int16Array: (value: unknown): asserts value is Int16Array => assertType(is.int16Array(value), TypeName.Int16Array, value),
	uint16Array: (value: unknown): asserts value is Uint16Array => assertType(is.uint16Array(value), TypeName.Uint16Array, value),
	int32Array: (value: unknown): asserts value is Int32Array => assertType(is.int32Array(value), TypeName.Int32Array, value),
	uint32Array: (value: unknown): asserts value is Uint32Array => assertType(is.uint32Array(value), TypeName.Uint32Array, value),
	float32Array: (value: unknown): asserts value is Float32Array => assertType(is.float32Array(value), TypeName.Float32Array, value),
	float64Array: (value: unknown): asserts value is Float64Array => assertType(is.float64Array(value), TypeName.Float64Array, value),
	bigInt64Array: (value: unknown): asserts value is BigInt64Array => assertType(is.bigInt64Array(value), TypeName.BigInt64Array, value),
	bigUint64Array: (value: unknown): asserts value is BigUint64Array => assertType(is.bigUint64Array(value), TypeName.BigUint64Array, value),
	arrayBuffer: (value: unknown): asserts value is ArrayBuffer => assertType(is.arrayBuffer(value), TypeName.ArrayBuffer, value),
	sharedArrayBuffer: (value: unknown): asserts value is SharedArrayBuffer => assertType(is.sharedArrayBuffer(value), TypeName.SharedArrayBuffer, value),
	dataView: (value: unknown): asserts value is DataView => assertType(is.dataView(value), TypeName.DataView, value),
	urlInstance: (value: unknown): asserts value is URL => assertType(is.urlInstance(value), TypeName.URL, value),
	urlString: (value: unknown): asserts value is string => assertType(is.urlString(value), AssertionTypeDescription.urlString, value),
	truthy: (value: unknown): asserts value is unknown => assertType(is.truthy(value), AssertionTypeDescription.truthy, value),
	falsy: (value: unknown): asserts value is unknown => assertType(is.falsy(value), AssertionTypeDescription.falsy, value),
	nan: (value: unknown): asserts value is unknown => assertType(is.nan(value), AssertionTypeDescription.nan, value),
	primitive: (value: unknown): asserts value is Primitive => assertType(is.primitive(value), AssertionTypeDescription.primitive, value),
	integer: (value: unknown): asserts value is number => assertType(is.integer(value), AssertionTypeDescription.integer, value),
	safeInteger: (value: unknown): asserts value is number => assertType(is.safeInteger(value), AssertionTypeDescription.safeInteger, value),
	plainObject: (value: unknown): asserts value is {[key: string]: unknown} => assertType(is.plainObject(value), AssertionTypeDescription.plainObject, value),
	typedArray: (value: unknown): asserts value is TypedArray => assertType(is.typedArray(value), AssertionTypeDescription.typedArray, value),
	arrayLike: <T = unknown>(value: unknown): asserts value is ArrayLike<T> => assertType(is.arrayLike(value), AssertionTypeDescription.arrayLike, value),
	domElement: (value: unknown): asserts value is Element => assertType(is.domElement(value), AssertionTypeDescription.domElement, value),
	observable: (value: unknown): asserts value is ObservableLike => assertType(is.observable(value), TypeName.Observable, value),
	nodeStream: (value: unknown): asserts value is NodeStream => assertType(is.nodeStream(value), AssertionTypeDescription.nodeStream, value),
	infinite: (value: unknown): asserts value is number => assertType(is.infinite(value), AssertionTypeDescription.infinite, value),
	emptyArray: (value: unknown): asserts value is never[] => assertType(is.emptyArray(value), AssertionTypeDescription.emptyArray, value),
	nonEmptyArray: (value: unknown): asserts value is unknown[] => assertType(is.nonEmptyArray(value), AssertionTypeDescription.nonEmptyArray, value),
	emptyString: (value: unknown): asserts value is '' => assertType(is.emptyString(value), AssertionTypeDescription.emptyString, value),
	nonEmptyString: (value: unknown): asserts value is string => assertType(is.nonEmptyString(value), AssertionTypeDescription.nonEmptyString, value),
	emptyStringOrWhitespace: (value: unknown): asserts value is string => assertType(is.emptyStringOrWhitespace(value), AssertionTypeDescription.emptyStringOrWhitespace, value),
	emptyObject: (value: unknown): asserts value is {[key: string]: never} => assertType(is.emptyObject(value), AssertionTypeDescription.emptyObject, value),
	nonEmptyObject: (value: unknown): asserts value is {[key: string]: unknown} => assertType(is.nonEmptyObject(value), AssertionTypeDescription.nonEmptyObject, value),
	emptySet: (value: unknown): asserts value is Set<never> => assertType(is.emptySet(value), AssertionTypeDescription.emptySet, value),
	nonEmptySet: (value: unknown): asserts value is Set<unknown> => assertType(is.nonEmptySet(value), AssertionTypeDescription.nonEmptySet, value),
	emptyMap: (value: unknown): asserts value is Map<never, never> => assertType(is.emptyMap(value), AssertionTypeDescription.emptyMap, value),
	nonEmptyMap: (value: unknown): asserts value is Map<unknown, unknown> => assertType(is.nonEmptyMap(value), AssertionTypeDescription.nonEmptyMap, value),

	// Numbers.
	evenInteger: (value: number): asserts value is number => assertType(is.evenInteger(value), AssertionTypeDescription.evenInteger, value),
	oddInteger: (value: number): asserts value is number => assertType(is.oddInteger(value), AssertionTypeDescription.oddInteger, value),

	// Two arguments.
	directInstanceOf: <T>(instance: unknown, class_: Class<T>): asserts instance is T => assertType(is.directInstanceOf(instance, class_), AssertionTypeDescription.directInstanceOf, instance),
	inRange: (value: number, range: number | number[]): asserts value is number => assertType(is.inRange(value, range), AssertionTypeDescription.inRange, value),

	// Variadic functions.
	any: (predicate: Predicate, ...values: unknown[]): void | never => assertType(is.any(predicate, ...values), AssertionTypeDescription.any, values),
	all: (predicate: Predicate, ...values: unknown[]): void | never => assertType(is.all(predicate, ...values), AssertionTypeDescription.all, values)
};

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
Object.defineProperties(assert, {
	class: {
		value: assert.class_
	},
	function: {
		value: assert.function_
	},
	null: {
		value: assert.null_
	}
});

export default is;

// For CommonJS default export support
module.exports = is;
module.exports.default = is;
module.exports.assert = assert;
