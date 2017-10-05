'use strict';
const util = require('util');

const toString = Object.prototype.toString;
const getObjectType = x => toString.call(x).slice(8, -1);
const isOfType = type => x => typeof x === type; // eslint-disable-line valid-typeof
const isObjectOfType = type => x => getObjectType(x) === type;

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
is.boolean = isOfType('boolean');
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
is.generatorFunction = x => is.function(x) && is.function(x.constructor) && x.constructor.name === 'GeneratorFunction';

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

	throw new TypeError(`Invalid range: ${util.inspect(range)}`);
};

is.infinite = x => x === Infinity || x === -Infinity;

module.exports = is;
