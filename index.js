'use strict';
const util = require('util');

const toString = Object.prototype.toString;
const getObjectType = x => toString.call(x).slice(8, -1);
const isOfType = type => x => typeof x === type; // eslint-disable-line valid-typeof
const isObjectOfType = type => x => getObjectType(x) === type;

const is = value => {
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

	if (is.function(value)) {
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

is.undefined = isOfType('undefined');
is.null = x => x === null;
is.string = isOfType('string');
is.number = isOfType('number');
is.boolean = x => x === true || x === false;
is.symbol = isOfType('symbol');

is.array = Array.isArray;
is.function = isOfType('function');
is.buffer = Buffer.isBuffer;

const isObject = x => typeof x === 'object';

is.object = x => !is.nullOrUndefined(x) && (is.function(x) || isObject(x));

is.nativePromise = isObjectOfType('Promise');

const hasPromiseAPI = x =>
	!is.null(x) &&
	isObject(x) &&
	is.function(x.then) &&
	is.function(x.catch);

is.promise = x => is.nativePromise(x) || hasPromiseAPI(x);

is.generator = x => is.iterable(x) && is.function(x.next) && is.function(x.throw);

// TODO: Change to use `isObjectOfType` once Node.js 6 or higher is targeted
const isFunctionOfType = type => x => is.function(x) && is.function(x.constructor) && x.constructor.name === type;

is.generatorFunction = isFunctionOfType('GeneratorFunction');
is.asyncFunction = isFunctionOfType('AsyncFunction');

is.regExp = isObjectOfType('RegExp');
is.date = isObjectOfType('Date');
is.error = isObjectOfType('Error');
is.map = isObjectOfType('Map');
is.set = isObjectOfType('Set');
is.weakMap = isObjectOfType('WeakMap');
is.weakSet = isObjectOfType('WeakSet');

is.int8Array = isObjectOfType('Int8Array');
is.uint8Array = isObjectOfType('Uint8Array');
is.uint8ClampedArray = isObjectOfType('Uint8ClampedArray');
is.int16Array = isObjectOfType('Int16Array');
is.uint16Array = isObjectOfType('Uint16Array');
is.int32Array = isObjectOfType('Int32Array');
is.uint32Array = isObjectOfType('Uint32Array');
is.float32Array = isObjectOfType('Float32Array');
is.float64Array = isObjectOfType('Float64Array');

is.arrayBuffer = isObjectOfType('ArrayBuffer');
is.sharedArrayBuffer = isObjectOfType('SharedArrayBuffer');

is.truthy = x => !!x; // eslint-disable-line no-implicit-coercion
is.falsy = x => !x;

is.nan = Number.isNaN;
is.nullOrUndefined = x => is.null(x) || is.undefined(x);

const primitiveTypes = new Set([
	'undefined',
	'string',
	'number',
	'boolean',
	'symbol'
]);
is.primitive = x => is.null(x) || primitiveTypes.has(typeof x);

is.integer = Number.isInteger;
is.safeInteger = Number.isSafeInteger;

is.plainObject = x => {
	// From: https://github.com/sindresorhus/is-plain-obj/blob/master/index.js
	let prototype;
	// eslint-disable-next-line no-return-assign
	return getObjectType(x) === 'Object' &&
		(prototype = Object.getPrototypeOf(x), prototype === null ||
			prototype === Object.getPrototypeOf({}));
};

is.iterable = x => !is.nullOrUndefined(x) && is.function(x[Symbol.iterator]);

is.class = x => is.function(x) && x.toString().startsWith('class ');

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
is.typedArray = x => typedArrayTypes.has(getObjectType(x));

const isValidLength = x => is.safeInteger(x) && x > -1;
is.arrayLike = x => !is.nullOrUndefined(x) && !is.function(x) && isValidLength(x.length);

is.inRange = (x, range) => {
	if (is.number(range)) {
		return x >= Math.min(0, range) && x <= Math.max(range, 0);
	}

	if (is.array(range) && range.length === 2) {
		// TODO: Use spread operator here when targeting Node.js 6 or higher
		return x >= Math.min.apply(null, range) && x <= Math.max.apply(null, range);
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

is.domElement = x => is.object(x) && x.nodeType === NODE_TYPE_ELEMENT && is.string(x.nodeName) &&
	!is.plainObject(x) && DOM_PROPERTIES_TO_CHECK.every(property => property in x);

is.infinite = x => x === Infinity || x === -Infinity;

const isAbsoluteMod2 = value => x => is.integer(x) && Math.abs(x % 2) === value;
is.even = isAbsoluteMod2(0);
is.odd = isAbsoluteMod2(1);

const isWhiteSpaceString = x => is.string(x) && /\S/.test(x) === false;
const isEmptyStringOrArray = x => (is.string(x) || is.array(x)) && x.length === 0;
const isEmptyObject = x => !is.map(x) && !is.set(x) && is.object(x) && Object.keys(x).length === 0;
const isEmptyMapOrSet = x => (is.map(x) || is.set(x)) && x.size === 0;

is.empty = x => is.falsy(x) || isEmptyStringOrArray(x) || isEmptyObject(x) || isEmptyMapOrSet(x);
is.emptyOrWhitespace = x => is.empty(x) || isWhiteSpaceString(x);

const predicateOnArray = (method, predicate, values) => {
	// `values` is the calling function's "arguments object".
	// We have to do it this way to keep node v4 support.
	// So here we convert it to an array and slice off the first item.
	values = Array.prototype.slice.call(values, 1);

	if (is.function(predicate) === false) {
		throw new TypeError(`Invalid predicate: ${util.inspect(predicate)}`);
	}

	if (values.length === 0) {
		throw new TypeError(`Invalid number of values`);
	}

	return method.call(values, predicate);
};

// We have to use anonymous functions for the any() and all() methods
// to get the arguments since we can't use rest parameters in node v4.
is.any = function (predicate) {
	return predicateOnArray(Array.prototype.some, predicate, arguments);
};

is.all = function (predicate) {
	return predicateOnArray(Array.prototype.every, predicate, arguments);
};

module.exports = is;
