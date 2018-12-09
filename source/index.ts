/// <reference lib="es2016"/>
/// <reference lib="es2017.sharedmemory"/>
/// <reference lib="esnext.asynciterable"/>
/// <reference lib="dom"/>
import symbolObservable from 'symbol-observable';
import {URL} from 'url';

type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
type Primitive = null | undefined | string | number | boolean | Symbol;

export interface ArrayLike {
	length: number;
}

export interface Class<T = unknown> {
	new(...args: any[]): T;
}

type DomElement = object & { nodeType: 1; nodeName: string };
type NodeStream = object & { pipe: Function };

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
const isBuffer = (input: unknown): input is Buffer => !is.nullOrUndefined(input) && !is.nullOrUndefined((input as Buffer).constructor) && is.function_((input as Buffer).constructor.isBuffer) && (input as Buffer).constructor.isBuffer(input);

const getObjectType = (value: unknown): TypeName | null => {
	const objectName = toString.call(value).slice(8, -1);

	if (objectName) {
		return objectName as TypeName;
	}

	return null;
};

const isObjectOfType = <T>(type: TypeName) => (value: unknown): value is T => getObjectType(value) === type;

function is(value: unknown): TypeName { // tslint:disable-line:only-arrow-functions
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

	if (Array.isArray(value)) {
		return TypeName.Array;
	}

	if (isBuffer(value)) {
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

namespace is { // tslint:disable-line:no-namespace
	// tslint:disable-next-line:strict-type-predicates
	const isObject = (value: unknown): value is object => typeof value === 'object';

	// tslint:disable:variable-name
	export const undefined = isOfType<undefined>('undefined');
	export const string = isOfType<string>('string');
	export const number = isOfType<number>('number');
	export const function_ = isOfType<Function>('function');
	// tslint:disable-next-line:strict-type-predicates
	export const null_ = (value: unknown): value is null => value === null;
	export const class_ = (value: unknown): value is Class => function_(value) && value.toString().startsWith('class ');
	export const boolean = (value: unknown): value is boolean => value === true || value === false;
	export const symbol = isOfType<Symbol>('symbol');
	// tslint:enable:variable-name

	export const numericString = (value: unknown): boolean =>
		string(value) && value.length > 0 && !Number.isNaN(Number(value));

	export const array = Array.isArray;
	export const buffer = isBuffer;

	export const nullOrUndefined = (value: unknown): value is null | undefined => null_(value) || undefined(value);
	export const object = (value: unknown): value is object => !nullOrUndefined(value) && (function_(value) || isObject(value));
	export const iterable = (value: unknown): value is IterableIterator<unknown> => !nullOrUndefined(value) && function_((value as IterableIterator<unknown>)[Symbol.iterator]);
	export const asyncIterable = (value: unknown): value is AsyncIterableIterator<unknown> => !nullOrUndefined(value) && function_((value as AsyncIterableIterator<unknown>)[Symbol.asyncIterator]);
	export const generator = (value: unknown): value is Generator => iterable(value) && function_(value.next) && function_(value.throw);

	export const nativePromise = (value: unknown): value is Promise<unknown> =>
		isObjectOfType<Promise<unknown>>(TypeName.Promise)(value);

	const hasPromiseAPI = (value: unknown): value is Promise<unknown> =>
		!null_(value) &&
		isObject(value) as unknown &&
		function_((value as Promise<unknown>).then) &&
		function_((value as Promise<unknown>).catch);

	export const promise = (value: unknown): value is Promise<unknown> => nativePromise(value) || hasPromiseAPI(value);

	export const generatorFunction = isObjectOfType<GeneratorFunction>(TypeName.GeneratorFunction);
	export const asyncFunction = isObjectOfType<Function>(TypeName.AsyncFunction);
	export const boundFunction = (value: unknown): value is Function => function_(value) && !value.hasOwnProperty('prototype');

	export const regExp = isObjectOfType<RegExp>(TypeName.RegExp);
	export const date = isObjectOfType<Date>(TypeName.Date);
	export const error = isObjectOfType<Error>(TypeName.Error);
	export const map = (value: unknown): value is Map<unknown, unknown> => isObjectOfType<Map<unknown, unknown>>(TypeName.Map)(value);
	export const set = (value: unknown): value is Set<unknown> => isObjectOfType<Set<unknown>>(TypeName.Set)(value);
	export const weakMap = (value: unknown): value is WeakMap<object, unknown> => isObjectOfType<WeakMap<object, unknown>>(TypeName.WeakMap)(value);
	export const weakSet = (value: unknown): value is WeakSet<object> => isObjectOfType<WeakSet<object>>(TypeName.WeakSet)(value);

	export const int8Array = isObjectOfType<Int8Array>(TypeName.Int8Array);
	export const uint8Array = isObjectOfType<Uint8Array>(TypeName.Uint8Array);
	export const uint8ClampedArray = isObjectOfType<Uint8ClampedArray>(TypeName.Uint8ClampedArray);
	export const int16Array = isObjectOfType<Int16Array>(TypeName.Int16Array);
	export const uint16Array = isObjectOfType<Uint16Array>(TypeName.Uint16Array);
	export const int32Array = isObjectOfType<Int32Array>(TypeName.Int32Array);
	export const uint32Array = isObjectOfType<Uint32Array>(TypeName.Uint32Array);
	export const float32Array = isObjectOfType<Float32Array>(TypeName.Float32Array);
	export const float64Array = isObjectOfType<Float64Array>(TypeName.Float64Array);

	export const arrayBuffer = isObjectOfType<ArrayBuffer>(TypeName.ArrayBuffer);
	export const sharedArrayBuffer = isObjectOfType<SharedArrayBuffer>(TypeName.SharedArrayBuffer);
	export const dataView = isObjectOfType<DataView>(TypeName.DataView);

	export const directInstanceOf = <T>(instance: unknown, klass: Class<T>): instance is T => Object.getPrototypeOf(instance) === klass.prototype;
	export const urlInstance = (value: unknown): value is URL => isObjectOfType<URL>(TypeName.URL)(value);

	export const url = (value: unknown) => {
		if (!string(value)) {
			return false;
		}

		try {
			new URL(value); // tslint:disable-line no-unused-expression
			return true;
		} catch {
			return false;
		}
	};

	export const truthy = (value: unknown) => Boolean(value);
	export const falsy = (value: unknown) => !value;

	export const nan = (value: unknown) => Number.isNaN(value as number);

	const primitiveTypes = new Set([
		'undefined',
		'string',
		'number',
		'boolean',
		'symbol'
	]);

	export const primitive = (value: unknown): value is Primitive => null_(value) || primitiveTypes.has(typeof value);

	export const integer = (value: unknown): value is number => Number.isInteger(value as number);
	export const safeInteger = (value: unknown): value is number => Number.isSafeInteger(value as number);

	export const plainObject = (value: unknown) => {
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
	export const typedArray = (value: unknown): value is TypedArray => {
		const objectType = getObjectType(value);

		if (objectType === null) {
			return false;
		}

		return typedArrayTypes.has(objectType);
	};

	const isValidLength = (value: unknown) => safeInteger(value) && value > -1;
	export const arrayLike = (value: unknown): value is ArrayLike => !nullOrUndefined(value) && !function_(value) && isValidLength((value as ArrayLike).length);

	export const inRange = (value: number, range: number | number[]) => {
		if (number(range)) {
			return value >= Math.min(0, range) && value <= Math.max(range, 0);
		}

		if (array(range) && range.length === 2) {
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

	export const domElement = (value: unknown): value is DomElement => object(value) && (value as DomElement).nodeType === NODE_TYPE_ELEMENT && string((value as DomElement).nodeName) &&
		!plainObject(value) && DOM_PROPERTIES_TO_CHECK.every(property => property in (value as DomElement));

	export const observable = (value: unknown) => Boolean(value && (value as any)[symbolObservable] && value === (value as any)[symbolObservable]());
	export const nodeStream = (value: unknown): value is NodeStream => !nullOrUndefined(value) && isObject(value) as unknown && function_((value as NodeStream).pipe) && !observable(value);

	export const infinite = (value: unknown) => value === Infinity || value === -Infinity;

	const isAbsoluteMod2 = (rem: number) => (value: number) => integer(value) && Math.abs(value % 2) === rem;
	export const even = isAbsoluteMod2(0);
	export const odd = isAbsoluteMod2(1);

	const isWhiteSpaceString = (value: unknown) => string(value) && /\S/.test(value) === false;

	export const emptyArray = (value: unknown) => array(value) && value.length === 0;
	export const nonEmptyArray = (value: unknown) => array(value) && value.length > 0;

	export const emptyString = (value: unknown) => string(value) && value.length === 0;
	export const nonEmptyString = (value: unknown) => string(value) && value.length > 0;
	export const emptyStringOrWhitespace = (value: unknown) => emptyString(value) || isWhiteSpaceString(value);

	export const emptyObject = (value: unknown) => object(value) && !map(value) && !set(value) && Object.keys(value).length === 0;
	export const nonEmptyObject = (value: unknown) => object(value) && !map(value) && !set(value) && Object.keys(value).length > 0;

	export const emptySet = (value: unknown) => set(value) && value.size === 0;
	export const nonEmptySet = (value: unknown) => set(value) && value.size > 0;

	export const emptyMap = (value: unknown) => map(value) && value.size === 0;
	export const nonEmptyMap = (value: unknown) => map(value) && value.size > 0;

	type ArrayMethod = (fn: (value: unknown, index: number, array: unknown[]) => boolean, thisArg?: unknown) => boolean;
	const predicateOnArray = (method: ArrayMethod, predicate: unknown, values: unknown[]) => {
		if (function_(predicate) === false) {
			throw new TypeError(`Invalid predicate: ${JSON.stringify(predicate)}`);
		}

		if (values.length === 0) {
			throw new TypeError('Invalid number of values');
		}

		return method.call(values, predicate as any);
	};

	// tslint:disable variable-name
	export const any = (predicate: unknown, ...values: unknown[]) => predicateOnArray(Array.prototype.some, predicate, values);
	export const all = (predicate: unknown, ...values: unknown[]) => predicateOnArray(Array.prototype.every, predicate, values);
	// tslint:enable variable-name
}

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
