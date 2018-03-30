import * as util from 'util';

type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
type Primitive = null | undefined | string | number | boolean | Symbol;

export interface ArrayLike {
	length: number;
}

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
	Promise = 'Promise'
}

const toString = Object.prototype.toString;
const isOfType = <T>(type: string) => (value: any): value is T => typeof value === type; // tslint:disable-line:strict-type-predicates

const getObjectType = (value: any): TypeName | null => {
	const objectName = toString.call(value).slice(8, -1) as string;

	if (objectName) {
		return objectName as TypeName;
	}

	return null;
};

const isObjectOfType = <T>(type: TypeName) => (value: any): value is T => getObjectType(value) === type;

function is(value: any): TypeName { // tslint:disable-line:only-arrow-functions
	if (value === null) {
		return TypeName.null;
	}

	if (value === true || value === false) {
		return TypeName.boolean;
	}

	const type = typeof value;

	if (type === 'undefined') {
		return TypeName.undefined;
	}

	if (type === 'string') {
		return TypeName.string;
	}

	if (type === 'number') {
		return TypeName.number;
	}

	if (type === 'symbol') {
		return TypeName.symbol;
	}

	if (is.function_(value)) {
		return TypeName.Function;
	}

	if (Array.isArray(value)) {
		return TypeName.Array;
	}

	if (Buffer.isBuffer(value)) {
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
	const isObject = (value: any) => typeof value === 'object';

	// tslint:disable:variable-name
	export const undefined = isOfType<undefined>('undefined');
	export const string = isOfType<string>('string');
	export const number = isOfType<number>('number');
	export const function_ = isOfType<Function>('function');
	export const null_ = (value: any): value is null => value === null;
	export const class_ = (value: any) => function_(value) && value.toString().startsWith('class ');
	export const boolean = (value: any): value is boolean => value === true || value === false;
	export const symbol = isOfType<Symbol>('symbol');
	// tslint:enable:variable-name

	export const array = Array.isArray;
	export const buffer = Buffer.isBuffer;

	export const nullOrUndefined = (value: any): value is null | undefined => null_(value) || undefined(value);
	export const object = (value: any) => !nullOrUndefined(value) && (function_(value) || isObject(value));
	export const iterable = <T = any>(value: any): value is Iterator<T> => !nullOrUndefined(value) && function_(value[Symbol.iterator]);
	export const generator = (value: any): value is Generator => iterable(value) && function_(value.next) && function_(value.throw);

	export const nativePromise = isObjectOfType<Promise<any>>(TypeName.Promise);

	const hasPromiseAPI = <T = any>(value: any): value is Promise<T> =>
		!null_(value) &&
		isObject(value) &&
		function_(value.then) &&
		function_(value.catch);

	export const promise = <T = any>(value: any): value is Promise<T> => nativePromise(value) || hasPromiseAPI<T>(value);

	const isFunctionOfType = <T>(type: TypeName) => isObjectOfType<T>(type);
	export const generatorFunction = isFunctionOfType<GeneratorFunction>(TypeName.GeneratorFunction);
	export const asyncFunction = isFunctionOfType<Function>(TypeName.AsyncFunction);
	export const boundFunction = (value: any): value is Function => function_(value) && !value.hasOwnProperty('prototype');

	export const regExp = isObjectOfType<RegExp>(TypeName.RegExp);
	export const date = isObjectOfType<Date>(TypeName.Date);
	export const error = isObjectOfType<Error>(TypeName.Error);
	export const map = isObjectOfType<Map<any, any>>(TypeName.Map);
	export const set = isObjectOfType<Set<any>>(TypeName.Set);
	export const weakMap = isObjectOfType<WeakMap<any, any>>(TypeName.WeakMap);
	export const weakSet = isObjectOfType<WeakSet<any>>(TypeName.WeakSet);

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

	export const directInstanceOf = (instance: any, klass: any) => Object.getPrototypeOf(instance) === klass.prototype;

	export const truthy = (value: any) => Boolean(value);
	export const falsy = (value: any) => !value;

	export const nan = (value: any) => Number.isNaN(value);

	const primitiveTypes = new Set([
		'undefined',
		'string',
		'number',
		'boolean',
		'symbol'
	]);

	export const primitive = (value: any): value is Primitive => null_(value) || primitiveTypes.has(typeof value);

	export const integer = (value: any): value is number => Number.isInteger(value);
	export const safeInteger = (value: any): value is number => Number.isSafeInteger(value);

	export const plainObject = (value: any) => {
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
	export const typedArray = (value: any): value is TypedArray => {
		const objectType = getObjectType(value);

		if (objectType === null) {
			return false;
		}

		return typedArrayTypes.has(objectType);
	};

	const isValidLength = (value: any) => safeInteger(value) && value > -1;
	export const arrayLike = (value: any): value is ArrayLike => !nullOrUndefined(value) && !function_(value) && isValidLength(value.length);

	export const inRange = (value: number, range: number | number[]) => {
		if (number(range)) {
			return value >= Math.min(0, range) && value <= Math.max(range, 0);
		}

		if (array(range) && range.length === 2) {
			return value >= Math.min(...range) && value <= Math.max(...range);
		}

		throw new TypeError(`Invalid range: ${util.inspect(range)}`);
	};

	const NODE_TYPE_ELEMENT = 1;
	const DOM_PROPERTIES_TO_CHECK = [
		'innerHTML',
		'ownerDocument',
		'style',
		'attributes',
		'nodeValue'
	];

	export const domElement = (value: any) => object(value) && value.nodeType === NODE_TYPE_ELEMENT && string(value.nodeName) &&
		!plainObject(value) && DOM_PROPERTIES_TO_CHECK.every(property => property in value);

	export const nodeStream = (value: any) => !nullOrUndefined(value) && isObject(value) && function_(value.pipe);

	export const infinite = (value: any) => value === Infinity || value === -Infinity;

	const isAbsoluteMod2 = (value: number) => (rem: number) => integer(rem) && Math.abs(rem % 2) === value;
	export const even = isAbsoluteMod2(0);
	export const odd = isAbsoluteMod2(1);

	const isWhiteSpaceString = (value: any) => string(value) && /\S/.test(value) === false;
	const isEmptyStringOrArray = (value: any) => (string(value) || array(value)) && value.length === 0;
	const isEmptyObject = (value: any) => !map(value) && !set(value) && object(value) && Object.keys(value).length === 0;
	const isEmptyMapOrSet = (value: any) => (map(value) || set(value)) && value.size === 0;

	export const empty = (value: any) => falsy(value) || isEmptyStringOrArray(value) || isEmptyObject(value) || isEmptyMapOrSet(value);
	export const emptyOrWhitespace = (value: any) => empty(value) || isWhiteSpaceString(value);

	type ArrayMethod = (fn: (value: any, index: number, array: any[]) => boolean, thisArg?: any) => boolean;
	const predicateOnArray = (method: ArrayMethod, predicate: any, values: any[]) => {
		if (function_(predicate) === false) {
			throw new TypeError(`Invalid predicate: ${util.inspect(predicate)}`);
		}

		if (values.length === 0) {
			throw new TypeError('Invalid number of values');
		}

		return method.call(values, predicate);
	};

	// tslint:disable variable-name
	export const any = (predicate: any, ...values: any[]) => predicateOnArray(Array.prototype.some, predicate, values);
	export const all = (predicate: any, ...values: any[]) => predicateOnArray(Array.prototype.every, predicate, values);
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
