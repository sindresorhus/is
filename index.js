'use strict';
const toString = Object.prototype.toString;
const getObjectType = x => toString.call(x).slice(8, -1);

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

is.array = Array.isArray;
is.function = x => typeof x === 'function';
is.buffer = Buffer.isBuffer;

is.object = x => {
	const type = typeof x;
	return x !== null && (type === 'object' || type === 'function');
};

is.nativePromise = x => getObjectType(x) === 'Promise';

is.promise = x => {
	return is.nativePromise(x) ||
		(
			x !== null &&
			typeof x === 'object' &&
			typeof x.then === 'function' &&
			typeof x.catch === 'function'
		);
};

is.regExp = x => getObjectType(x) === 'RegExp';
is.date = x => getObjectType(x) === 'Date';
is.error = x => getObjectType(x) === 'Error';
is.map = x => getObjectType(x) === 'Map';
is.set = x => getObjectType(x) === 'Set';
is.weakMap = x => getObjectType(x) === 'WeakMap';
is.weakSet = x => getObjectType(x) === 'WeakSet';

is.int8Array = x => getObjectType(x) === 'Int8Array';
is.uint8Array = x => getObjectType(x) === 'Uint8Array';
is.uint8ClampedArray = x => getObjectType(x) === 'Uint8ClampedArray';
is.int16Array = x => getObjectType(x) === 'Int16Array';
is.uint16Array = x => getObjectType(x) === 'Uint16Array';
is.int32Array = x => getObjectType(x) === 'Int32Array';
is.uint32Array = x => getObjectType(x) === 'Uint32Array';
is.float32Array = x => getObjectType(x) === 'Float32Array';
is.float64Array = x => getObjectType(x) === 'Float64Array';

is.arrayBuffer = x => getObjectType(x) === 'ArrayBuffer';

is.sharedArrayBuffer = x => {
	try {
		return getObjectType(x) === 'SharedArrayBuffer';
	} catch (err) {
		return false;
	}
};

is.nan = Number.isNaN;
is.nullOrUndefined = x => x === null || typeof x === 'undefined';

is.primitive = x => {
	const type = typeof x;
	return x === null ||
		type === 'undefined' ||
		type === 'string' ||
		type === 'number' ||
		type === 'boolean' ||
		type === 'symbol';
};

is.integer = Number.isInteger;

is.plainObject = x => {
	// From: https://github.com/sindresorhus/is-plain-obj/blob/master/index.js
	let prototype;
	// eslint-disable-next-line no-return-assign
	return getObjectType(x) === 'Object' &&
		(prototype = Object.getPrototypeOf(x), prototype === null ||
		prototype === Object.getPrototypeOf({}));
};

is.iterable = x => !is.null(x) && !is.undefined(x) && typeof x[Symbol.iterator] === 'function';

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

is.withinRange = (x, [min, max]) => x >= min && x <= max;

module.exports = is;
