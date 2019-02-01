/// <reference lib="es2016"/>
/// <reference lib="es2017.sharedmemory"/>
/// <reference lib="esnext.asynciterable"/>
/// <reference lib="dom"/>

// TODO: Use the `URL` global when targeting Node.js 10
// tslint:disable-next-line
const URLGlobal = typeof URL === 'undefined' ? require('url').URL : URL;

type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;

// TODO: This should be able to be `not object` when the `not` operator is out
type Primitive = null | undefined | string | number | boolean | symbol;

export interface ArrayLike {
	length: number;
}

export type Class<T = unknown> = new(...args: any[]) => T;

type DomElement = object & {nodeType: 1; nodeName: string};
type NodeStream = object & {pipe: Function};

export const enum TypeName {
	null = 'null',
	boolean = 'boolean',
	undefined = 'undefined',
	string = 'string',
	number = 'number',
	symbol = 'symbol',
	Function = 'Function',
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
	ArrayBuffer = 'ArrayBuffer',
	SharedArrayBuffer = 'SharedArrayBuffer',
	DataView = 'DataView',
	Promise = 'Promise',
	URL = 'URL'
}

const toString = Object.prototype.toString;
const isOfType = <T>(type: string) => (value: unknown): value is T => typeof value === type;

const getObjectType = (value: unknown): TypeName | null => {
	const objectName = toString.call(value).slice(8, -1);
	if (objectName) {
		return objectName as TypeName;
	}

	return null;
};

const isObjectOfType = <T>(type: TypeName) => (value: unknown): value is T => getObjectType(value) === type;

// tslint:disable-next-line: no-use-before-declare
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

// tslint:disable-next-line: strict-type-predicates
const isObject = (value: unknown): value is object => typeof value === 'object';

is.undefined = isOfType<undefined>('undefined');
is.string = isOfType<string>('string');
is.number = isOfType<number>('number');
is.function_ = isOfType<Function>('function');
// tslint:disable-next-line: strict-type-predicates
is.null_ = (value: unknown): value is null => value === null;
is.class_ = (value: unknown): value is Class => is.function_(value) && value.toString().startsWith('class ');
is.boolean = (value: unknown): value is boolean => value === true || value === false;
is.symbol = isOfType<symbol>('symbol');

is.numericString = (value: unknown): value is string =>
	is.string(value) && value.length > 0 && !Number.isNaN(Number(value));

is.array = Array.isArray;
is.buffer = (value: unknown): value is Buffer => !is.nullOrUndefined(value) && !is.nullOrUndefined((value as Buffer).constructor) && is.function_((value as Buffer).constructor.isBuffer) && (value as Buffer).constructor.isBuffer(value);

is.nullOrUndefined = (value: unknown): value is null | undefined => is.null_(value) || is.undefined(value);
is.object = (value: unknown): value is object => !is.nullOrUndefined(value) && (is.function_(value) || isObject(value));
is.iterable = (value: unknown): value is IterableIterator<unknown> => !is.nullOrUndefined(value) && is.function_((value as IterableIterator<unknown>)[Symbol.iterator]);
is.asyncIterable = (value: unknown): value is AsyncIterableIterator<unknown> => !is.nullOrUndefined(value) && is.function_((value as AsyncIterableIterator<unknown>)[Symbol.asyncIterator]);
is.generator = (value: unknown): value is Generator => is.iterable(value) && is.function_(value.next) && is.function_(value.throw);

is.nativePromise = (value: unknown): value is Promise<unknown> =>
	isObjectOfType<Promise<unknown>>(TypeName.Promise)(value);

const hasPromiseAPI = (value: unknown): value is Promise<unknown> =>
	!is.null_(value) &&
	isObject(value) as unknown &&
	is.function_((value as Promise<unknown>).then) &&
	is.function_((value as Promise<unknown>).catch);

is.promise = (value: unknown): value is Promise<unknown> => is.nativePromise(value) || hasPromiseAPI(value);

is.generatorFunction = isObjectOfType<GeneratorFunction>(TypeName.GeneratorFunction);
is.asyncFunction = isObjectOfType<Function>(TypeName.AsyncFunction);
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

is.arrayBuffer = isObjectOfType<ArrayBuffer>(TypeName.ArrayBuffer);
is.sharedArrayBuffer = isObjectOfType<SharedArrayBuffer>(TypeName.SharedArrayBuffer);
is.dataView = isObjectOfType<DataView>(TypeName.DataView);

is.directInstanceOf = <T>(instance: unknown, klass: Class<T>): instance is T => Object.getPrototypeOf(instance) === klass.prototype;
is.urlInstance = (value: unknown): value is URL => isObjectOfType<URL>(TypeName.URL)(value);

is.urlString = (value: unknown): value is string => {
	if (!is.string(value)) {
		return false;
	}

	try {
		new URLGlobal(value); // tslint:disable-line no-unused-expression
		return true;
	} catch {
		return false;
	}
};

// TODO: Use the `not` operator with a type guard here when it's available.
// Example: `is.truthy = (value: unknown): value is not (false | undefined | null) => Boolean(value);`
is.truthy = (value: unknown) => Boolean(value);
// Example: `is.falsy = (value: unknown): value is not (true | …) => Boolean(value);`
is.falsy = (value: unknown) => !value;

is.nan = (value: unknown) => Number.isNaN(value as number);

const primitiveTypeOfTypes = new Set([
	'undefined',
	'string',
	'number',
	'boolean',
	'symbol'
]);

is.primitive = (value: unknown): value is Primitive => is.null_(value) || primitiveTypeOfTypes.has(typeof value);

is.integer = (value: unknown): value is number => Number.isInteger(value as number);
is.safeInteger = (value: unknown): value is number => Number.isSafeInteger(value as number);

is.plainObject = (value: unknown): value is {[key: string]: unknown} => {
	// From: https://github.com/sindresorhus/is-plain-obj/blob/master/index.js
	let prototype;

	return getObjectType(value) === TypeName.Object &&
		(prototype = Object.getPrototypeOf(value), prototype === null || // tslint:disable-line:ban-comma-operator
			prototype === Object.getPrototypeOf({}));
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
	TypeName.Float64Array
]);

is.typedArray = (value: unknown): value is TypedArray => {
	const objectType = getObjectType(value);
	if (objectType === null) {
		return false;
	}

	return typedArrayTypes.has(objectType);
};

const isValidLength = (value: unknown) => is.safeInteger(value) && value >= 0;
is.arrayLike = (value: unknown): value is ArrayLike => !is.nullOrUndefined(value) && !is.function_(value) && isValidLength((value as ArrayLike).length);

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

is.domElement = (value: unknown): value is DomElement => is.object(value) && (value as DomElement).nodeType === NODE_TYPE_ELEMENT && is.string((value as DomElement).nodeName) &&
	!is.plainObject(value) && DOM_PROPERTIES_TO_CHECK.every(property => property in (value as DomElement));

export interface ObservableLike {
	subscribe(observer: (value: unknown) => void): void;
	[Symbol.observable](): ObservableLike;
}

is.observable = (value: unknown): value is ObservableLike => {
	if (!value) {
		return false;
	}

	if ((value as any)[Symbol.observable] && value === (value as any)[Symbol.observable]()) {
		return true;
	}

	if ((value as any)['@@observable'] && value === (value as any)['@@observable']()) {
		return true;
	}

	return false;
};

is.nodeStream = (value: unknown): value is NodeStream => !is.nullOrUndefined(value) && isObject(value) as unknown && is.function_((value as NodeStream).pipe) && !is.observable(value);

is.infinite = (value: unknown) => value === Infinity || value === -Infinity;

const isAbsoluteMod2 = (rem: number) => (value: number): value is number => is.integer(value) && Math.abs(value % 2) === rem;
is.evenInteger = isAbsoluteMod2(0);
is.oddInteger = isAbsoluteMod2(1);

is.emptyArray = (value: unknown): value is never[] => is.array(value) && value.length === 0;
is.nonEmptyArray = (value: unknown): value is unknown[] => is.array(value) && value.length > 0;

is.emptyString = (value: unknown): value is string => is.string(value) && value.length === 0;
is.nonEmptyString = (value: unknown): value is string => is.string(value) && value.length > 0;

const isWhiteSpaceString = (value: unknown) => is.string(value) && /\S/.test(value) === false;
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

// tslint:disable variable-name
is.any = (predicate: Predicate, ...values: unknown[]): boolean => predicateOnArray(Array.prototype.some, predicate, values);
is.all = (predicate: Predicate, ...values: unknown[]): boolean => predicateOnArray(Array.prototype.every, predicate, values);
// tslint:enable variable-name

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
