import * as util from "util";

const toString = Object.prototype.toString;
const getObjectType = (value: any) => toString.call(value).slice(8, -1) as string;
const isOfType = (type: string) => (value: any) => typeof value === type;
const isObjectOfType = (type: string) => (value: any) => getObjectType(value) === type;

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
	export const boolean = (value: any) => value === true || value === false;
	export const symbol = isOfType('symbol');
	export const func = isOfType('function');
	export const null_ = (value: any) => value === null;

	export const array = Array.isArray;
	export const buffer = Buffer.isBuffer;

	const isObject = (value: any) => typeof value === 'object';

	export const object = (value: any) => !is.nullOrUndefined(value) && (is.func(value) || isObject(value));

	export const nativePromise = isObjectOfType('Promise');

	const hasPromiseAPI = (value: any) =>
		!is.null_(value) &&
		isObject(value) &&
		is.func(value.then) &&
		is.func(value.catch);

	export const promise = (value: any) => is.nativePromise(value) || hasPromiseAPI(value);

	export const generator = (value: any) => is.iterable(value) && is.func(value.next) && is.func(value.throw);

	// TODO: Change to use `isObjectOfType` once Node.js 6 or higher is targeted
	const isFunctionOfType = (type: string) => (value: any) => is.func(value) && is.func(value.constructor) && value.constructor.name === type;

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

	export const truthy = (value: any) => Boolean(value);
	export const falsy = (value: any) => !value;

	// Number.isNaN is currently not supported and isNaN() is typeguarded to only accept number
	// see https://github.com/Microsoft/TypeScript/issues/15149
	export const nan = (value: any) => is.number(value) && isNaN(Number(value)); 
	
	export const nullOrUndefined = (value: any) => is.null_(value) || is.undefined(value);

	const primitiveTypes = new Set([
		'undefined',
		'string',
		'number',
		'boolean',
		'symbol'
	]);

	export const primitive = (value: any) => is.null_(value) || primitiveTypes.has(typeof value);

	export const integer = (value: any) => is.number(value) && isFinite(value) && (value | 0) === value;
	// Target es5 requires ugly constant here: https://github.com/Microsoft/TypeScript/issues/9937
	export const safeInteger = (value: any) => is.number(value) && Math.abs(value) <= 9007199254740991;

	export const plainObject = (value: any) => {
		// From: https://github.com/sindresorhus/is-plain-obj/blob/master/index.js
		let prototype;
		return getObjectType(value) === 'Object' &&
			(prototype = Object.getPrototypeOf(value), prototype === null ||
				prototype === Object.getPrototypeOf({}));
	};

	export const iterable = (value: any) => !is.nullOrUndefined(value) && is.func(value[Symbol.iterator]);

	export const class_ = (value: any) => is.func(value) && value.toString().startsWith('class ');

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
	export const typedArray = (value: any) => typedArrayTypes.has(getObjectType(value));

	const isValidLength = (value: any) => is.safeInteger(value) && value > -1;
	export const arrayLike = (value: any) => !is.nullOrUndefined(value) && !is.func(value) && isValidLength(value.length);

	export const inRange = (value: number, range: number | number[]) => {
		if (is.number(range)) {
			return value >= Math.min(0, range as number) && value <= Math.max(range as number, 0);
		}

		if (is.array(range) && range.length === 2) {
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

	export const domElement = (value: any) => is.object(value) && value.nodeType === NODE_TYPE_ELEMENT && is.string(value.nodeName) &&
		!is.plainObject(value) && DOM_PROPERTIES_TO_CHECK.every(property => property in value);

	export const infinite = (value: any) => value === Infinity || value === -Infinity;

	const isAbsoluteMod2 = (value: number) => (rem: number) => is.integer(rem) && Math.abs(rem % 2) === value;
	export const even = isAbsoluteMod2(0);
	export const odd = isAbsoluteMod2(1);

	const isWhiteSpaceString = (value: any) => is.string(value) && /\S/.test(value) === false;
	const isEmptyStringOrArray = (value: any) => (is.string(value) || is.array(value)) && value.length === 0;
	const isEmptyObject = (value: any) => !is.map(value) && !is.set(value) && is.object(value) && Object.keys(value).length === 0;
	const isEmptyMapOrSet = (value: any) => (is.map(value) || is.set(value)) && value.size === 0;

	export const empty = (value: any) => is.falsy(value) || isEmptyStringOrArray(value) || isEmptyObject(value) || isEmptyMapOrSet(value);
	export const emptyOrWhitespace = (value: any) => is.empty(value) || isWhiteSpaceString(value);

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
