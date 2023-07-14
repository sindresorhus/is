import type {Buffer} from 'node:buffer';
import type {Class, Falsy, TypedArray, ObservableLike, Primitive, WeakRef} from './types.js';

const typedArrayTypeNames = [
	'Int8Array',
	'Uint8Array',
	'Uint8ClampedArray',
	'Int16Array',
	'Uint16Array',
	'Int32Array',
	'Uint32Array',
	'Float32Array',
	'Float64Array',
	'BigInt64Array',
	'BigUint64Array',
] as const;

type TypedArrayTypeName = typeof typedArrayTypeNames[number];

function isTypedArrayName(name: unknown): name is TypedArrayTypeName {
	return typedArrayTypeNames.includes(name as TypedArrayTypeName);
}

const objectTypeNames = [
	'Function',
	'Generator',
	'AsyncGenerator',
	'GeneratorFunction',
	'AsyncGeneratorFunction',
	'AsyncFunction',
	'Observable',
	'Array',
	'Buffer',
	'Blob',
	'Object',
	'RegExp',
	'Date',
	'Error',
	'Map',
	'Set',
	'WeakMap',
	'WeakSet',
	'WeakRef',
	'ArrayBuffer',
	'SharedArrayBuffer',
	'DataView',
	'Promise',
	'URL',
	'FormData',
	'URLSearchParams',
	'HTMLElement',
	'NaN',
	...typedArrayTypeNames,
] as const;

type ObjectTypeName = typeof objectTypeNames[number];

function isObjectTypeName(name: unknown): name is ObjectTypeName {
	return objectTypeNames.includes(name as ObjectTypeName);
}

const primitiveTypeNames = [
	'null',
	'undefined',
	'string',
	'number',
	'bigint',
	'boolean',
	'symbol',
] as const;

type PrimitiveTypeName = typeof primitiveTypeNames[number];

function isPrimitiveTypeName(name: unknown): name is PrimitiveTypeName {
	return primitiveTypeNames.includes(name as PrimitiveTypeName);
}

export type TypeName = ObjectTypeName | PrimitiveTypeName;

// eslint-disable-next-line @typescript-eslint/ban-types
function isOfType<T extends Primitive | Function>(type: PrimitiveTypeName | 'function') {
	return (value: unknown): value is T => typeof value === type;
}

const {toString} = Object.prototype;
const getObjectType = (value: unknown): ObjectTypeName | undefined => {
	const objectTypeName = toString.call(value).slice(8, -1);

	if (/HTML\w+Element/.test(objectTypeName) && is.domElement(value)) {
		return 'HTMLElement';
	}

	if (isObjectTypeName(objectTypeName)) {
		return objectTypeName;
	}

	return undefined;
};

const isObjectOfType = <T>(type: ObjectTypeName) => (value: unknown): value is T => getObjectType(value) === type;

function is(value: unknown): TypeName {
	if (value === null) {
		return 'null';
	}

	switch (typeof value) {
		case 'undefined': {
			return 'undefined';
		}

		case 'string': {
			return 'string';
		}

		case 'number': {
			return Number.isNaN(value) ? 'NaN' : 'number';
		}

		case 'boolean': {
			return 'boolean';
		}

		case 'function': {
			return 'Function';
		}

		case 'bigint': {
			return 'bigint';
		}

		case 'symbol': {
			return 'symbol';
		}

		default:
	}

	if (is.observable(value)) {
		return 'Observable';
	}

	if (is.array(value)) {
		return 'Array';
	}

	if (is.buffer(value)) {
		return 'Buffer';
	}

	const tagType = getObjectType(value);
	if (tagType) {
		return tagType;
	}

	if (value instanceof String || value instanceof Boolean || value instanceof Number) {
		throw new TypeError('Please don\'t use object wrappers for primitive types');
	}

	return 'Object';
}

is.undefined = isOfType<undefined>('undefined');

is.string = isOfType<string>('string');

const isNumberType = isOfType<number>('number');
is.number = (value: unknown): value is number => isNumberType(value) && !is.nan(value);

is.positiveNumber = (value: unknown): value is number => is.number(value) && value > 0;

is.negativeNumber = (value: unknown): value is number => is.number(value) && value < 0;

is.bigint = isOfType<bigint>('bigint');

// eslint-disable-next-line @typescript-eslint/ban-types
is.function_ = isOfType<Function>('function');

// eslint-disable-next-line @typescript-eslint/ban-types
is.null_ = (value: unknown): value is null => value === null;

is.class_ = (value: unknown): value is Class => is.function_(value) && value.toString().startsWith('class ');

is.boolean = (value: unknown): value is boolean => value === true || value === false;

is.symbol = isOfType<symbol>('symbol');

is.numericString = (value: unknown): value is `${number}` =>
	is.string(value) && !is.emptyStringOrWhitespace(value) && !Number.isNaN(Number(value));

is.array = <T = unknown>(value: unknown, assertion?: (value: T) => value is T): value is T[] => {
	if (!Array.isArray(value)) {
		return false;
	}

	if (!is.function_(assertion)) {
		return true;
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	return value.every(element => assertion(element));
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
is.buffer = (value: unknown): value is Buffer => (value as any)?.constructor?.isBuffer?.(value) ?? false;

is.blob = (value: unknown): value is Blob => isObjectOfType<Blob>('Blob')(value);

is.nullOrUndefined = (value: unknown): value is null | undefined => is.null_(value) || is.undefined(value); // eslint-disable-line @typescript-eslint/ban-types

is.object = (value: unknown): value is object => !is.null_(value) && (typeof value === 'object' || is.function_(value)); // eslint-disable-line @typescript-eslint/ban-types

is.iterable = <T = unknown>(value: unknown): value is Iterable<T> => is.function_((value as Iterable<T>)?.[Symbol.iterator]);

is.asyncIterable = <T = unknown>(value: unknown): value is AsyncIterable<T> => is.function_((value as AsyncIterable<T>)?.[Symbol.asyncIterator]);

is.generator = (value: unknown): value is Generator => is.iterable(value) && is.function_((value as Generator)?.next) && is.function_((value as Generator)?.throw);

is.asyncGenerator = (value: unknown): value is AsyncGenerator => is.asyncIterable(value) && is.function_((value as AsyncGenerator).next) && is.function_((value as AsyncGenerator).throw);

is.nativePromise = <T = unknown>(value: unknown): value is Promise<T> =>
	isObjectOfType<Promise<T>>('Promise')(value);

const hasPromiseApi = <T = unknown>(value: unknown): value is Promise<T> =>
	is.function_((value as Promise<T>)?.then)
		&& is.function_((value as Promise<T>)?.catch);

is.promise = <T = unknown>(value: unknown): value is Promise<T> => is.nativePromise(value) || hasPromiseApi(value);

is.generatorFunction = isObjectOfType<GeneratorFunction>('GeneratorFunction');

is.asyncGeneratorFunction = (value: unknown): value is ((...args: any[]) => Promise<unknown>) => getObjectType(value) === 'AsyncGeneratorFunction';

is.asyncFunction = <T = unknown>(value: unknown): value is ((...args: any[]) => Promise<T>) => getObjectType(value) === 'AsyncFunction';

// eslint-disable-next-line no-prototype-builtins, @typescript-eslint/ban-types
is.boundFunction = (value: unknown): value is Function => is.function_(value) && !value.hasOwnProperty('prototype');

is.regExp = isObjectOfType<RegExp>('RegExp');

is.date = isObjectOfType<Date>('Date');

is.error = isObjectOfType<Error>('Error');

is.map = <Key = unknown, Value = unknown>(value: unknown): value is Map<Key, Value> => isObjectOfType<Map<Key, Value>>('Map')(value);

is.set = <T = unknown>(value: unknown): value is Set<T> => isObjectOfType<Set<T>>('Set')(value);

is.weakMap = <Key extends object = object, Value = unknown>(value: unknown): value is WeakMap<Key, Value> => isObjectOfType<WeakMap<Key, Value>>('WeakMap')(value); // eslint-disable-line @typescript-eslint/ban-types

is.weakSet = (value: unknown): value is WeakSet<object> => isObjectOfType<WeakSet<object>>('WeakSet')(value); // eslint-disable-line @typescript-eslint/ban-types

is.weakRef = (value: unknown): value is WeakRef<object> => isObjectOfType<WeakRef<object>>('WeakRef')(value); // eslint-disable-line @typescript-eslint/ban-types

is.int8Array = isObjectOfType<Int8Array>('Int8Array');
is.uint8Array = isObjectOfType<Uint8Array>('Uint8Array');
is.uint8ClampedArray = isObjectOfType<Uint8ClampedArray>('Uint8ClampedArray');
is.int16Array = isObjectOfType<Int16Array>('Int16Array');
is.uint16Array = isObjectOfType<Uint16Array>('Uint16Array');
is.int32Array = isObjectOfType<Int32Array>('Int32Array');
is.uint32Array = isObjectOfType<Uint32Array>('Uint32Array');
is.float32Array = isObjectOfType<Float32Array>('Float32Array');
is.float64Array = isObjectOfType<Float64Array>('Float64Array');
is.bigInt64Array = isObjectOfType<BigInt64Array>('BigInt64Array');
is.bigUint64Array = isObjectOfType<BigUint64Array>('BigUint64Array');

is.arrayBuffer = isObjectOfType<ArrayBuffer>('ArrayBuffer');

is.sharedArrayBuffer = isObjectOfType<SharedArrayBuffer>('SharedArrayBuffer');

is.dataView = isObjectOfType<DataView>('DataView');

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
is.enumCase = <T = unknown>(value: unknown, targetEnum: T): boolean => Object.values(targetEnum as any).includes(value as string);

is.directInstanceOf = <T>(instance: unknown, class_: Class<T>): instance is T => Object.getPrototypeOf(instance) === class_.prototype;

is.urlInstance = (value: unknown): value is URL => isObjectOfType<URL>('URL')(value);

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

// Example: `is.truthy = (value: unknown): value is (not false | not 0 | not '' | not undefined | not null) => Boolean(value);`
is.truthy = <T>(value: T | Falsy): value is T => Boolean(value); // eslint-disable-line unicorn/prefer-native-coercion-functions

// Example: `is.falsy = (value: unknown): value is (not true | 0 | '' | undefined | null) => Boolean(value);`
is.falsy = <T>(value: T | Falsy): value is Falsy => !value;

is.nan = (value: unknown) => Number.isNaN(value as number);

is.primitive = (value: unknown): value is Primitive => is.null_(value) || isPrimitiveTypeName(typeof value);

is.integer = (value: unknown): value is number => Number.isInteger(value as number);

is.safeInteger = (value: unknown): value is number => Number.isSafeInteger(value as number);

is.plainObject = <Value = unknown>(value: unknown): value is Record<PropertyKey, Value> => {
	// From: https://github.com/sindresorhus/is-plain-obj/blob/main/index.js
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const prototype = Object.getPrototypeOf(value);

	return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in value) && !(Symbol.iterator in value);
};

is.typedArray = (value: unknown): value is TypedArray => isTypedArrayName(getObjectType(value));

export type ArrayLike<T> = {
	readonly [index: number]: T;
	readonly length: number;
};

const isValidLength = (value: unknown): value is number => is.safeInteger(value) && value >= 0;
is.arrayLike = <T = unknown>(value: unknown): value is ArrayLike<T> => !is.nullOrUndefined(value) && !is.function_(value) && isValidLength((value as ArrayLike<T>).length);

is.inRange = (value: number, range: number | number[]): value is number => {
	if (is.number(range)) {
		return value >= Math.min(0, range) && value <= Math.max(range, 0);
	}

	if (is.array(range) && range.length === 2) {
		return value >= Math.min(...range) && value <= Math.max(...range);
	}

	throw new TypeError(`Invalid range: ${JSON.stringify(range)}`);
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const NODE_TYPE_ELEMENT = 1;

// eslint-disable-next-line @typescript-eslint/naming-convention
const DOM_PROPERTIES_TO_CHECK: Array<(keyof HTMLElement)> = [
	'innerHTML',
	'ownerDocument',
	'style',
	'attributes',
	'nodeValue',
];

is.domElement = (value: unknown): value is HTMLElement => is.object(value)
	&& (value as HTMLElement).nodeType === NODE_TYPE_ELEMENT
	&& is.string((value as HTMLElement).nodeName)
	&& !is.plainObject(value)
	&& DOM_PROPERTIES_TO_CHECK.every(property => property in value);

is.observable = (value: unknown): value is ObservableLike => {
	if (!value) {
		return false;
	}

	// eslint-disable-next-line no-use-extend-native/no-use-extend-native, @typescript-eslint/no-unsafe-call
	if (value === (value as any)[Symbol.observable]?.()) {
		return true;
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	if (value === (value as any)['@@observable']?.()) {
		return true;
	}

	return false;
};

export type NodeStream = {
	pipe<T extends NodeJS.WritableStream>(destination: T, options?: {end?: boolean}): T;
} & NodeJS.EventEmitter;

is.nodeStream = (value: unknown): value is NodeStream => is.object(value) && is.function_((value as NodeStream).pipe) && !is.observable(value);

is.infinite = (value: unknown): value is number => value === Number.POSITIVE_INFINITY || value === Number.NEGATIVE_INFINITY;

const isAbsoluteMod2 = (remainder: number) => (value: number): value is number => is.integer(value) && Math.abs(value % 2) === remainder;
is.evenInteger = isAbsoluteMod2(0);
is.oddInteger = isAbsoluteMod2(1);

is.emptyArray = (value: unknown): value is never[] => is.array(value) && value.length === 0;

is.nonEmptyArray = <T = unknown, Item = unknown>(value: T | Item[]): value is (T extends Item[] ? [Item, ...Item[]] : T) => is.array(value) && value.length > 0;

is.emptyString = (value: unknown): value is '' => is.string(value) && value.length === 0;

const isWhiteSpaceString = (value: unknown): value is string => is.string(value) && !/\S/.test(value);
is.emptyStringOrWhitespace = (value: unknown): value is string => is.emptyString(value) || isWhiteSpaceString(value);

// TODO: Use `not ''` when the `not` operator is available.
is.nonEmptyString = (value: unknown): value is string => is.string(value) && value.length > 0;

// TODO: Use `not ''` when the `not` operator is available.
is.nonEmptyStringAndNotWhitespace = (value: unknown): value is string => is.string(value) && !is.emptyStringOrWhitespace(value);

// eslint-disable-next-line unicorn/no-array-callback-reference
is.emptyObject = <Key extends keyof any = string>(value: unknown): value is Record<Key, never> => is.object(value) && !is.map(value) && !is.set(value) && Object.keys(value).length === 0;

// TODO: Use `not` operator here to remove `Map` and `Set` from type guard:
// - https://github.com/Microsoft/TypeScript/pull/29317
// eslint-disable-next-line unicorn/no-array-callback-reference
is.nonEmptyObject = <Key extends keyof any = string, Value = unknown>(value: unknown): value is Record<Key, Value> => is.object(value) && !is.map(value) && !is.set(value) && Object.keys(value).length > 0;

is.emptySet = (value: unknown): value is Set<never> => is.set(value) && value.size === 0;

is.nonEmptySet = <T = unknown>(value: unknown): value is Set<T> => is.set(value) && value.size > 0;

// eslint-disable-next-line unicorn/no-array-callback-reference
is.emptyMap = (value: unknown): value is Map<never, never> => is.map(value) && value.size === 0;

// eslint-disable-next-line unicorn/no-array-callback-reference
is.nonEmptyMap = <Key = unknown, Value = unknown>(value: unknown): value is Map<Key, Value> => is.map(value) && value.size > 0;

// `PropertyKey` is any value that can be used as an object key (string, number, or symbol)
is.propertyKey = (value: unknown): value is PropertyKey => is.any([is.string, is.number, is.symbol], value);

is.formData = (value: unknown): value is FormData => isObjectOfType<FormData>('FormData')(value);

is.urlSearchParams = (value: unknown): value is URLSearchParams => isObjectOfType<URLSearchParams>('URLSearchParams')(value);

export type Predicate = (value: unknown) => boolean;

type ArrayMethod = (fn: (value: unknown, index: number, array: unknown[]) => boolean, thisArg?: unknown) => boolean;

const predicateOnArray = (method: ArrayMethod, predicate: Predicate, values: unknown[]) => {
	if (!is.function_(predicate)) {
		throw new TypeError(`Invalid predicate: ${JSON.stringify(predicate)}`);
	}

	if (values.length === 0) {
		throw new TypeError('Invalid number of values');
	}

	return method.call(values, predicate);
};

is.any = (predicate: Predicate | Predicate[], ...values: unknown[]): boolean => {
	const predicates = is.array(predicate) ? predicate : [predicate];
	return predicates.some(singlePredicate =>
		predicateOnArray(Array.prototype.some, singlePredicate, values),
	);
};

is.all = (predicate: Predicate, ...values: unknown[]): boolean => predicateOnArray(Array.prototype.every, predicate, values);

const assertType = (condition: boolean, description: string, value: unknown, options: {multipleValues?: boolean} = {}): asserts condition => {
	if (!condition) {
		const {multipleValues} = options;
		const valuesMessage = multipleValues
			? `received values of types ${[
				...new Set(
					(value as any[]).map(singleValue => `\`${is(singleValue)}\``),
				),
			].join(', ')}`
			: `received value of type \`${is(value)}\``;

		throw new TypeError(`Expected value which is \`${description}\`, ${valuesMessage}.`);
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
	safeInteger = 'integer', // eslint-disable-line @typescript-eslint/no-duplicate-enum-values
	plainObject = 'plain object',
	arrayLike = 'array-like',
	typedArray = 'TypedArray',
	domElement = 'HTMLElement',
	nodeStream = 'Node.js Stream',
	infinite = 'infinite number',
	emptyArray = 'empty array',
	nonEmptyArray = 'non-empty array',
	emptyString = 'empty string',
	emptyStringOrWhitespace = 'empty string or whitespace',
	nonEmptyString = 'non-empty string',
	nonEmptyStringAndNotWhitespace = 'non-empty string and not whitespace',
	emptyObject = 'empty object',
	nonEmptyObject = 'non-empty object',
	emptySet = 'empty set',
	nonEmptySet = 'non-empty set',
	emptyMap = 'empty map',
	nonEmptyMap = 'non-empty map',

	evenInteger = 'even integer',
	oddInteger = 'odd integer',

	positiveNumber = 'positive number',
	negativeNumber = 'negative number',

	directInstanceOf = 'T',
	inRange = 'in range',

	any = 'predicate returns truthy for any value',
	all = 'predicate returns truthy for all values',
}

// Type assertions have to be declared with an explicit type.
type Assert = {
	// Unknowns.
	undefined: (value: unknown) => asserts value is undefined;
	string: (value: unknown) => asserts value is string;
	number: (value: unknown) => asserts value is number;
	positiveNumber: (value: unknown) => asserts value is number;
	negativeNumber: (value: unknown) => asserts value is number;
	bigint: (value: unknown) => asserts value is bigint;
	// eslint-disable-next-line @typescript-eslint/ban-types
	function_: (value: unknown) => asserts value is Function;
	null_: (value: unknown) => asserts value is null; // eslint-disable-line @typescript-eslint/ban-types
	class_: (value: unknown) => asserts value is Class;
	boolean: (value: unknown) => asserts value is boolean;
	symbol: (value: unknown) => asserts value is symbol;
	numericString: (value: unknown) => asserts value is `${number}`;
	array: <T = unknown>(value: unknown, assertion?: (element: unknown) => asserts element is T) => asserts value is T[];
	buffer: (value: unknown) => asserts value is Buffer;
	blob: (value: unknown) => asserts value is Blob;
	nullOrUndefined: (value: unknown) => asserts value is null | undefined; // eslint-disable-line @typescript-eslint/ban-types
	object: <Key extends keyof any = string, Value = unknown>(value: unknown) => asserts value is Record<Key, Value>;
	iterable: <T = unknown>(value: unknown) => asserts value is Iterable<T>;
	asyncIterable: <T = unknown>(value: unknown) => asserts value is AsyncIterable<T>;
	generator: (value: unknown) => asserts value is Generator;
	asyncGenerator: (value: unknown) => asserts value is AsyncGenerator;
	nativePromise: <T = unknown>(value: unknown) => asserts value is Promise<T>;
	promise: <T = unknown>(value: unknown) => asserts value is Promise<T>;
	generatorFunction: (value: unknown) => asserts value is GeneratorFunction;
	asyncGeneratorFunction: (value: unknown) => asserts value is AsyncGeneratorFunction;
	// eslint-disable-next-line @typescript-eslint/ban-types
	asyncFunction: (value: unknown) => asserts value is Function;
	// eslint-disable-next-line @typescript-eslint/ban-types
	boundFunction: (value: unknown) => asserts value is Function;
	regExp: (value: unknown) => asserts value is RegExp;
	date: (value: unknown) => asserts value is Date;
	error: (value: unknown) => asserts value is Error;
	map: <Key = unknown, Value = unknown>(value: unknown) => asserts value is Map<Key, Value>;
	set: <T = unknown>(value: unknown) => asserts value is Set<T>;
	weakMap: <Key extends object = object, Value = unknown>(value: unknown) => asserts value is WeakMap<Key, Value>; // eslint-disable-line @typescript-eslint/ban-types
	weakSet: <T extends object = object>(value: unknown) => asserts value is WeakSet<T>; // eslint-disable-line @typescript-eslint/ban-types
	weakRef: <T extends object = object>(value: unknown) => asserts value is WeakRef<T>; // eslint-disable-line @typescript-eslint/ban-types
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
	enumCase: <T = unknown>(value: unknown, targetEnum: T) => asserts value is T[keyof T];
	urlInstance: (value: unknown) => asserts value is URL;
	urlString: (value: unknown) => asserts value is string;
	truthy: (value: unknown) => asserts value is unknown;
	falsy: (value: unknown) => asserts value is unknown;
	nan: (value: unknown) => asserts value is unknown;
	primitive: (value: unknown) => asserts value is Primitive;
	integer: (value: unknown) => asserts value is number;
	safeInteger: (value: unknown) => asserts value is number;
	plainObject: <Value = unknown>(value: unknown) => asserts value is Record<PropertyKey, Value>;
	typedArray: (value: unknown) => asserts value is TypedArray;
	arrayLike: <T = unknown>(value: unknown) => asserts value is ArrayLike<T>;
	domElement: (value: unknown) => asserts value is HTMLElement;
	observable: (value: unknown) => asserts value is ObservableLike;
	nodeStream: (value: unknown) => asserts value is NodeStream;
	infinite: (value: unknown) => asserts value is number;
	emptyArray: (value: unknown) => asserts value is never[];
	nonEmptyArray: <T = unknown, Item = unknown>(value: T | Item[]) => asserts value is (T extends Item[] ? [Item, ...Item[]] : T);
	emptyString: (value: unknown) => asserts value is '';
	emptyStringOrWhitespace: (value: unknown) => asserts value is string;
	nonEmptyString: (value: unknown) => asserts value is string;
	nonEmptyStringAndNotWhitespace: (value: unknown) => asserts value is string;
	emptyObject: <Key extends keyof any = string>(value: unknown) => asserts value is Record<Key, never>;
	nonEmptyObject: <Key extends keyof any = string, Value = unknown>(value: unknown) => asserts value is Record<Key, Value>;
	emptySet: (value: unknown) => asserts value is Set<never>;
	nonEmptySet: <T = unknown>(value: unknown) => asserts value is Set<T>;
	emptyMap: (value: unknown) => asserts value is Map<never, never>;
	nonEmptyMap: <Key = unknown, Value = unknown>(value: unknown) => asserts value is Map<Key, Value>;
	propertyKey: (value: unknown) => asserts value is PropertyKey;
	formData: (value: unknown) => asserts value is FormData;
	urlSearchParams: (value: unknown) => asserts value is URLSearchParams;

	// Numbers.
	evenInteger: (value: number) => asserts value is number;
	oddInteger: (value: number) => asserts value is number;

	// Two arguments.
	directInstanceOf: <T>(instance: unknown, class_: Class<T>) => asserts instance is T;
	inRange: (value: number, range: number | number[]) => asserts value is number;

	// Variadic functions.
	any: (predicate: Predicate | Predicate[], ...values: unknown[]) => void | never;
	all: (predicate: Predicate, ...values: unknown[]) => void | never;
};

/* eslint-disable @typescript-eslint/no-confusing-void-expression */
export const assert: Assert = {
	// Unknowns.
	undefined: (value: unknown): asserts value is undefined => assertType(is.undefined(value), 'undefined', value),
	string: (value: unknown): asserts value is string => assertType(is.string(value), 'string', value),
	number: (value: unknown): asserts value is number => assertType(is.number(value), 'number', value),
	positiveNumber: (value: unknown): asserts value is number => assertType(is.positiveNumber(value), AssertionTypeDescription.positiveNumber, value),
	negativeNumber: (value: unknown): asserts value is number => assertType(is.negativeNumber(value), AssertionTypeDescription.negativeNumber, value),
	bigint: (value: unknown): asserts value is bigint => assertType(is.bigint(value), 'bigint', value),
	// eslint-disable-next-line @typescript-eslint/ban-types
	function_: (value: unknown): asserts value is Function => assertType(is.function_(value), 'Function', value),
	null_: (value: unknown): asserts value is null => assertType(is.null_(value), 'null', value), // eslint-disable-line @typescript-eslint/ban-types
	class_: (value: unknown): asserts value is Class => assertType(is.class_(value), AssertionTypeDescription.class_, value),
	boolean: (value: unknown): asserts value is boolean => assertType(is.boolean(value), 'boolean', value),
	symbol: (value: unknown): asserts value is symbol => assertType(is.symbol(value), 'symbol', value),
	numericString: (value: unknown): asserts value is `${number}` => assertType(is.numericString(value), AssertionTypeDescription.numericString, value),
	array: <T = unknown>(value: unknown, assertion?: (element: unknown) => asserts element is T): asserts value is T[] => { // eslint-disable-line object-shorthand
		const assert: (condition: boolean, description: string, value: unknown) => asserts condition = assertType;
		assert(is.array(value), 'Array', value);

		if (assertion) {
			// eslint-disable-next-line unicorn/no-array-for-each, unicorn/no-array-callback-reference
			value.forEach(assertion);
		}
	},
	buffer: (value: unknown): asserts value is Buffer => assertType(is.buffer(value), 'Buffer', value),
	blob: (value: unknown): asserts value is Blob => assertType(is.blob(value), 'Blob', value),
	nullOrUndefined: (value: unknown): asserts value is null | undefined => assertType(is.nullOrUndefined(value), AssertionTypeDescription.nullOrUndefined, value), // eslint-disable-line @typescript-eslint/ban-types
	object: (value: unknown): asserts value is object => assertType(is.object(value), 'Object', value), // eslint-disable-line @typescript-eslint/ban-types
	iterable: <T = unknown>(value: unknown): asserts value is Iterable<T> => assertType(is.iterable(value), AssertionTypeDescription.iterable, value),
	asyncIterable: <T = unknown>(value: unknown): asserts value is AsyncIterable<T> => assertType(is.asyncIterable(value), AssertionTypeDescription.asyncIterable, value),
	generator: (value: unknown): asserts value is Generator => assertType(is.generator(value), 'Generator', value),
	asyncGenerator: (value: unknown): asserts value is AsyncGenerator => assertType(is.asyncGenerator(value), 'AsyncGenerator', value),
	nativePromise: <T = unknown>(value: unknown): asserts value is Promise<T> => assertType(is.nativePromise(value), AssertionTypeDescription.nativePromise, value),
	promise: <T = unknown>(value: unknown): asserts value is Promise<T> => assertType(is.promise(value), 'Promise', value),
	generatorFunction: (value: unknown): asserts value is GeneratorFunction => assertType(is.generatorFunction(value), 'GeneratorFunction', value),
	asyncGeneratorFunction: (value: unknown): asserts value is AsyncGeneratorFunction => assertType(is.asyncGeneratorFunction(value), 'AsyncGeneratorFunction', value),
	// eslint-disable-next-line @typescript-eslint/ban-types
	asyncFunction: (value: unknown): asserts value is Function => assertType(is.asyncFunction(value), 'AsyncFunction', value),
	// eslint-disable-next-line @typescript-eslint/ban-types
	boundFunction: (value: unknown): asserts value is Function => assertType(is.boundFunction(value), 'Function', value),
	regExp: (value: unknown): asserts value is RegExp => assertType(is.regExp(value), 'RegExp', value),
	date: (value: unknown): asserts value is Date => assertType(is.date(value), 'Date', value),
	error: (value: unknown): asserts value is Error => assertType(is.error(value), 'Error', value),
	map: <Key = unknown, Value = unknown>(value: unknown): asserts value is Map<Key, Value> => assertType(is.map(value), 'Map', value), // eslint-disable-line unicorn/no-array-callback-reference
	set: <T = unknown>(value: unknown): asserts value is Set<T> => assertType(is.set(value), 'Set', value),
	weakMap: <Key extends object = object, Value = unknown>(value: unknown): asserts value is WeakMap<Key, Value> => assertType(is.weakMap(value), 'WeakMap', value), // eslint-disable-line @typescript-eslint/ban-types
	weakSet: <T extends object = object>(value: unknown): asserts value is WeakSet<T> => assertType(is.weakSet(value), 'WeakSet', value), // eslint-disable-line @typescript-eslint/ban-types
	weakRef: <T extends object = object>(value: unknown): asserts value is WeakRef<T> => assertType(is.weakRef(value), 'WeakRef', value), // eslint-disable-line @typescript-eslint/ban-types
	int8Array: (value: unknown): asserts value is Int8Array => assertType(is.int8Array(value), 'Int8Array', value),
	uint8Array: (value: unknown): asserts value is Uint8Array => assertType(is.uint8Array(value), 'Uint8Array', value),
	uint8ClampedArray: (value: unknown): asserts value is Uint8ClampedArray => assertType(is.uint8ClampedArray(value), 'Uint8ClampedArray', value),
	int16Array: (value: unknown): asserts value is Int16Array => assertType(is.int16Array(value), 'Int16Array', value),
	uint16Array: (value: unknown): asserts value is Uint16Array => assertType(is.uint16Array(value), 'Uint16Array', value),
	int32Array: (value: unknown): asserts value is Int32Array => assertType(is.int32Array(value), 'Int32Array', value),
	uint32Array: (value: unknown): asserts value is Uint32Array => assertType(is.uint32Array(value), 'Uint32Array', value),
	float32Array: (value: unknown): asserts value is Float32Array => assertType(is.float32Array(value), 'Float32Array', value),
	float64Array: (value: unknown): asserts value is Float64Array => assertType(is.float64Array(value), 'Float64Array', value),
	bigInt64Array: (value: unknown): asserts value is BigInt64Array => assertType(is.bigInt64Array(value), 'BigInt64Array', value),
	bigUint64Array: (value: unknown): asserts value is BigUint64Array => assertType(is.bigUint64Array(value), 'BigUint64Array', value),
	arrayBuffer: (value: unknown): asserts value is ArrayBuffer => assertType(is.arrayBuffer(value), 'ArrayBuffer', value),
	sharedArrayBuffer: (value: unknown): asserts value is SharedArrayBuffer => assertType(is.sharedArrayBuffer(value), 'SharedArrayBuffer', value),
	dataView: (value: unknown): asserts value is DataView => assertType(is.dataView(value), 'DataView', value),
	enumCase: <T = unknown>(value: unknown, targetEnum: T): asserts value is T[keyof T] => assertType(is.enumCase(value, targetEnum), 'EnumCase', value),
	urlInstance: (value: unknown): asserts value is URL => assertType(is.urlInstance(value), 'URL', value),
	urlString: (value: unknown): asserts value is string => assertType(is.urlString(value), AssertionTypeDescription.urlString, value),
	truthy: (value: unknown): asserts value is unknown => assertType(is.truthy(value), AssertionTypeDescription.truthy, value),
	falsy: (value: unknown): asserts value is unknown => assertType(is.falsy(value), AssertionTypeDescription.falsy, value),
	nan: (value: unknown): asserts value is unknown => assertType(is.nan(value), AssertionTypeDescription.nan, value),
	primitive: (value: unknown): asserts value is Primitive => assertType(is.primitive(value), AssertionTypeDescription.primitive, value),
	integer: (value: unknown): asserts value is number => assertType(is.integer(value), AssertionTypeDescription.integer, value),
	safeInteger: (value: unknown): asserts value is number => assertType(is.safeInteger(value), AssertionTypeDescription.safeInteger, value),
	plainObject: <Value = unknown>(value: unknown): asserts value is Record<PropertyKey, Value> => assertType(is.plainObject(value), AssertionTypeDescription.plainObject, value),
	typedArray: (value: unknown): asserts value is TypedArray => assertType(is.typedArray(value), AssertionTypeDescription.typedArray, value),
	arrayLike: <T = unknown>(value: unknown): asserts value is ArrayLike<T> => assertType(is.arrayLike(value), AssertionTypeDescription.arrayLike, value),
	domElement: (value: unknown): asserts value is HTMLElement => assertType(is.domElement(value), AssertionTypeDescription.domElement, value),
	observable: (value: unknown): asserts value is ObservableLike => assertType(is.observable(value), 'Observable', value),
	nodeStream: (value: unknown): asserts value is NodeStream => assertType(is.nodeStream(value), AssertionTypeDescription.nodeStream, value),
	infinite: (value: unknown): asserts value is number => assertType(is.infinite(value), AssertionTypeDescription.infinite, value),
	emptyArray: (value: unknown): asserts value is never[] => assertType(is.emptyArray(value), AssertionTypeDescription.emptyArray, value),
	nonEmptyArray: <T = unknown, Item = unknown>(value: T | Item[]): asserts value is (T extends Item[] ? [Item, ...Item[]] : T) => assertType(is.nonEmptyArray(value), AssertionTypeDescription.nonEmptyArray, value),
	emptyString: (value: unknown): asserts value is '' => assertType(is.emptyString(value), AssertionTypeDescription.emptyString, value),
	emptyStringOrWhitespace: (value: unknown): asserts value is string => assertType(is.emptyStringOrWhitespace(value), AssertionTypeDescription.emptyStringOrWhitespace, value),
	nonEmptyString: (value: unknown): asserts value is string => assertType(is.nonEmptyString(value), AssertionTypeDescription.nonEmptyString, value),
	nonEmptyStringAndNotWhitespace: (value: unknown): asserts value is string => assertType(is.nonEmptyStringAndNotWhitespace(value), AssertionTypeDescription.nonEmptyStringAndNotWhitespace, value),
	emptyObject: <Key extends keyof any = string>(value: unknown): asserts value is Record<Key, never> => assertType(is.emptyObject(value), AssertionTypeDescription.emptyObject, value),
	nonEmptyObject: <Key extends keyof any = string, Value = unknown>(value: unknown): asserts value is Record<Key, Value> => assertType(is.nonEmptyObject(value), AssertionTypeDescription.nonEmptyObject, value),
	emptySet: (value: unknown): asserts value is Set<never> => assertType(is.emptySet(value), AssertionTypeDescription.emptySet, value),
	nonEmptySet: <T = unknown>(value: unknown): asserts value is Set<T> => assertType(is.nonEmptySet(value), AssertionTypeDescription.nonEmptySet, value),
	emptyMap: (value: unknown): asserts value is Map<never, never> => assertType(is.emptyMap(value), AssertionTypeDescription.emptyMap, value),
	nonEmptyMap: <Key = unknown, Value = unknown>(value: unknown): asserts value is Map<Key, Value> => assertType(is.nonEmptyMap(value), AssertionTypeDescription.nonEmptyMap, value),
	propertyKey: (value: unknown): asserts value is number => assertType(is.propertyKey(value), 'PropertyKey', value),
	formData: (value: unknown): asserts value is FormData => assertType(is.formData(value), 'FormData', value),
	urlSearchParams: (value: unknown): asserts value is URLSearchParams => assertType(is.urlSearchParams(value), 'URLSearchParams', value),

	// Numbers.
	evenInteger: (value: number): asserts value is number => assertType(is.evenInteger(value), AssertionTypeDescription.evenInteger, value),
	oddInteger: (value: number): asserts value is number => assertType(is.oddInteger(value), AssertionTypeDescription.oddInteger, value),

	// Two arguments.
	directInstanceOf: <T>(instance: unknown, class_: Class<T>): asserts instance is T => assertType(is.directInstanceOf(instance, class_), AssertionTypeDescription.directInstanceOf, instance),
	inRange: (value: number, range: number | number[]): asserts value is number => assertType(is.inRange(value, range), AssertionTypeDescription.inRange, value),

	// Variadic functions.
	any: (predicate: Predicate | Predicate[], ...values: unknown[]): void | never => assertType(is.any(predicate, ...values), AssertionTypeDescription.any, values, {multipleValues: true}),
	all: (predicate: Predicate, ...values: unknown[]): void | never => assertType(is.all(predicate, ...values), AssertionTypeDescription.all, values, {multipleValues: true}),
};
/* eslint-enable @typescript-eslint/no-confusing-void-expression */

// Some few keywords are reserved, but we'll populate them for Node.js users
// See https://github.com/Microsoft/TypeScript/issues/2536
Object.defineProperties(is, {
	class: {
		value: is.class_,
	},
	function: {
		value: is.function_,
	},
	null: {
		value: is.null_,
	},
});
Object.defineProperties(assert, {
	class: {
		value: assert.class_,
	},
	function: {
		value: assert.function_,
	},
	null: {
		value: assert.null_,
	},
});

export default is;

export type {Class, TypedArray, ObservableLike, Primitive} from './types.js';
