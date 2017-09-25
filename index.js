'use strict';
const toString = Object.prototype.toString;
const getObjectType = x => toString.call(x).slice(8, -1);
const isOfType = type => x => getObjectType(x) === type;

const is = value => {
	if (value == null) { // eslint-disable-line no-eq-null, eqeqeq
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

	if (type === 'function') {
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

is.undefined = x => typeof x === 'undefined';
is.null = x => x === null;
is.string = x => typeof x === 'string';
is.number = x => typeof x === 'number';
is.boolean = x => typeof x === 'boolean';
is.symbol = x => typeof x === 'symbol';
is.nullOrUndefined = x => is.null(x) || is.undefined(x);

const primitiveTypes = new Set([
	'undefined',
	'string',
	'number',
	'boolean',
	'symbol'
]);
is.primitive = x => is.null(x) || primitiveTypes.has(typeof x);

is.array = Array.isArray;
is.function = x => typeof x === 'function';
is.buffer = Buffer.isBuffer;

is.object = x => !is.nullOrUndefined(x) && (is.function(x) || typeof x === 'object');

is.nativePromise = isOfType('Promise');

const hasPromiseAPI = x =>
	!is.null(x) &&
	typeof x === 'object' &&
	is.function(x.then) &&
	is.function(x.catch);

is.promise = x => is.nativePromise(x) || hasPromiseAPI(x);

is.regExp = isOfType('RegExp');
is.date = isOfType('Date');
is.error = isOfType('Error');
is.map = isOfType('Map');
is.set = isOfType('Set');
is.weakMap = isOfType('WeakMap');
is.weakSet = isOfType('WeakSet');

is.int8Array = isOfType('Int8Array');
is.uint8Array = isOfType('Uint8Array');
is.uint8ClampedArray = isOfType('Uint8ClampedArray');
is.int16Array = isOfType('Int16Array');
is.uint16Array = isOfType('Uint16Array');
is.int32Array = isOfType('Int32Array');
is.uint32Array = isOfType('Uint32Array');
is.float32Array = isOfType('Float32Array');
is.float64Array = isOfType('Float64Array');

is.arrayBuffer = isOfType('ArrayBuffer');
is.sharedArrayBuffer = isOfType('SharedArrayBuffer');

is.nan = Number.isNaN;
is.integer = Number.isInteger;

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

is.inRange = (x, range) => {
	if (is.number(range)) {
		return x >= Math.min(0, range) && x <= Math.max(range, 0);
	}

	if (is.array(range) && range.length === 2) {
		// TODO: Use spread operator here when targeting Node.js 6 or higher
		return x >= Math.min.apply(null, range) && x <= Math.max.apply(null, range);
	}

	throw new TypeError('Invalid range');
};

module.exports = is;
