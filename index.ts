import * as util from "util";

const toString = Object.prototype.toString;
const getObjectType = (x: any) => toString.call(x).slice(8, -1) as string;
const isOfType = (type: string) => (x: any) => typeof x === type;
const isObjectOfType = (type: string) => (x: any) => getObjectType(x) === type;

//export default is
function is(value: any) {
	if (value === null) {
		return 'null';
	}

	if (value === true || value === false) {
		return 'boolean';
	}

	const type = typeof value;

	if (type === 'undefined') {
		return 'undefined';
	}

	if (type === 'string') {
		return 'string';
	}

	if (type === 'number') {
		return 'number';
	}

	if (type === 'symbol') {
		return 'symbol';
	}

	if (is.func(value)) {
		return 'Function';
	}

	if (Array.isArray(value)) {
		return 'Array';
	}

	if (Buffer.isBuffer(value)) {
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
};

namespace is {
	export const undefined = isOfType('undefined');
	export const string = isOfType('string');
	export const number = isOfType('number');
	export const boolean = (x: any) => x === true || x === false;
	export const symbol = isOfType('symbol');
	export const func = isOfType('function');
	export const null_ = (x: any) => x === null;

	export const array = Array.isArray;
	export const buffer = Buffer.isBuffer;

	const isObject = (x: any) => typeof x === 'object';

	export const object = (x: any) => !is.nullOrUndefined(x) && (is.func(x) || isObject(x));

	export const nativePromise = isObjectOfType('Promise');

	const hasPromiseAPI = (x: any) =>
		!is.null_(x) &&
		isObject(x) &&
		is.func(x.then) &&
		is.func(x.catch);

	export const promise = (x: any) => is.nativePromise(x) || hasPromiseAPI(x);

	export const generator = (x: any) => is.iterable(x) && is.func(x.next) && is.func(x.throw);

	// TODO: Change to use `isObjectOfType` once Node.js 6 or higher is targeted
	const isFunctionOfType = (type: string) => (x: any) => is.func(x) && is.func(x.constructor) && x.constructor.name === type;

	export const generatorFunction = isFunctionOfType('GeneratorFunction');
	export const asyncFunction = isFunctionOfType('AsyncFunction');

	export const regExp = isObjectOfType('RegExp');
	export const date = isObjectOfType('Date');
	export const error = isObjectOfType('Error');
	export const map = isObjectOfType('Map');
	export const set = isObjectOfType('Set');
	export const weakMap = isObjectOfType('WeakMap');
	export const weakSet = isObjectOfType('WeakSet');

	export const int8Array = isObjectOfType('Int8Array');
	export const uint8Array = isObjectOfType('Uint8Array');
	export const uint8ClampedArray = isObjectOfType('Uint8ClampedArray');
	export const int16Array = isObjectOfType('Int16Array');
	export const uint16Array = isObjectOfType('Uint16Array');
	export const int32Array = isObjectOfType('Int32Array');
	export const uint32Array = isObjectOfType('Uint32Array');
	export const float32Array = isObjectOfType('Float32Array');
	export const float64Array = isObjectOfType('Float64Array');

	export const arrayBuffer = isObjectOfType('ArrayBuffer');
	export const sharedArrayBuffer = isObjectOfType('SharedArrayBuffer');

	export const truthy = (x: any) => Boolean(x);
	export const falsy = (x: any) => !x;

	// Number.isNaN is currently not supported and isNaN() is typeguarded to only accept number
	// see https://github.com/Microsoft/TypeScript/issues/15149
	export const nan = (x: any) => is.number(x) && isNaN(Number(x)); 
	
	export const nullOrUndefined = (x: any) => is.null_(x) || is.undefined(x);

	const primitiveTypes = new Set([
		'undefined',
		'string',
		'number',
		'boolean',
		'symbol'
	]);

	export const primitive = (x: any) => is.null_(x) || primitiveTypes.has(typeof x);

	export const integer = (x: any) => is.number(x) && isFinite(x) && (x | 0) === x;
	// Target es5 requires ugly constant here: https://github.com/Microsoft/TypeScript/issues/9937
	export const safeInteger = (x: any) => is.number(x) && Math.abs(x) <= 9007199254740991;

	export const plainObject = (x: any) => {
		// From: https://github.com/sindresorhus/is-plain-obj/blob/master/index.js
		let prototype;
		return getObjectType(x) === 'Object' &&
			(prototype = Object.getPrototypeOf(x), prototype === null ||
				prototype === Object.getPrototypeOf({}));
	};

	export const iterable = (x: any) => !is.nullOrUndefined(x) && is.func(x[Symbol.iterator]);

	export const class_ = (x: any) => is.func(x) && x.toString().startsWith('class ');

	const typedArrayTypes = new Set([
		'Int8Array',
		'Uint8Array',
		'Uint8ClampedArray',
		'Int16Array',
		'Uint16Array',
		'Int32Array',
		'Uint32Array',
		'Float32Array',
		'Float64Array'
	]);
	export const typedArray = (x: any) => typedArrayTypes.has(getObjectType(x));

	const isValidLength = (x: any) => is.safeInteger(x) && x > -1;
	export const arrayLike = (x: any) => !is.nullOrUndefined(x) && !is.func(x) && isValidLength(x.length);

	export const inRange = (x: number, range: number | number[]) => {
		if (is.number(range)) {
			return x >= Math.min(0, range as number) && x <= Math.max(range as number, 0);
		}

		if (is.array(range) && range.length === 2) {
			return x >= Math.min(...range) && x <= Math.max(...range);
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

	export const domElement = (x: any) => is.object(x) && x.nodeType === NODE_TYPE_ELEMENT && is.string(x.nodeName) &&
		!is.plainObject(x) && DOM_PROPERTIES_TO_CHECK.every(property => property in x);

	export const infinite = (x: any) => x === Infinity || x === -Infinity;

	const isAbsoluteMod2 = (value: number) => (x: number) => is.integer(x) && Math.abs(x % 2) === value;
	export const even = isAbsoluteMod2(0);
	export const odd = isAbsoluteMod2(1);

	const isWhiteSpaceString = (x: any) => is.string(x) && /\S/.test(x) === false;
	const isEmptyStringOrArray = (x: any) => (is.string(x) || is.array(x)) && x.length === 0;
	const isEmptyObject = (x: any) => !is.map(x) && !is.set(x) && is.object(x) && Object.keys(x).length === 0;
	const isEmptyMapOrSet = (x: any) => (is.map(x) || is.set(x)) && x.size === 0;

	export const empty = (x: any) => is.falsy(x) || isEmptyStringOrArray(x) || isEmptyObject(x) || isEmptyMapOrSet(x);
	export const emptyOrWhitespace = (x: any) => is.empty(x) || isWhiteSpaceString(x);

	type ArrayMethod = (fn: (value: any, index: number, arr: any[]) => boolean, thisArg?: any) => boolean
	const predicateOnArray = (method: ArrayMethod, predicate: any, values: any[]) => {
		if (is.func(predicate) === false) {
			throw new TypeError(`Invalid predicate: ${util.inspect(predicate)}`);
		}

		if (values.length === 0) {
			throw new TypeError(`Invalid number of values`);
		}

		return method.call(values, predicate);
	};

	export const any = function (predicate: any, ...values: any[]) {
		return predicateOnArray(Array.prototype.some, predicate, values);
	};

	export const all = function (predicate: any, ...values: any[]) {
		return predicateOnArray(Array.prototype.every, predicate, values);
	};
}

// Some few keywords are reserved, but we'll populate them for the node-folks
// see https://github.com/Microsoft/TypeScript/issues/2536
Object.defineProperties(is, { 
	"class": { value: is.class_ },
	"function": { value: is.func },
	"null": { value: is.null_ }
});


export default is
