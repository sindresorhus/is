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

const isEmptyStringOrArray = x => (is.string(x) || is.array(x)) && x.length === 0;
const isEmptyObject = x => !is.map(x) && !is.set(x) && is.object(x) && Object.keys(x).length === 0;
const isEmptyMapOrSet = x => (is.map(x) || is.set(x)) && x.size === 0;

is.empty = x => !x || isEmptyStringOrArray(x) || isEmptyObject(x) || isEmptyMapOrSet(x);

const isType = (value, type) => {
	switch (String(type).toLowerCase()) {
		case 'undefined':
			return is.undefined(value);
		case 'null':
			return is.null(value);
		case 'string':
			return is.string(value);
		case 'number':
			return is.number(value);
		case 'boolean':
			return is.boolean(value);
		case 'symbol':
			return is.symbol(value);
		case 'array':
			return is.array(value);
		case 'function':
			return is.function(value);
		case 'buffer':
			return is.buffer(value);
		case 'object':
			return is.object(value);
		case 'regexp':
			return is.regExp(value);
		case 'date':
			return is.date(value);
		case 'error':
			return is.error(value);
		case 'nativepromise':
			return is.nativePromise(value);
		case 'promise':
			return is.promise(value);
		case 'generator':
			return is.generator(value);
		case 'generatorfunction':
			return is.generatorFunction(value);
		case 'map':
			return is.map(value);
		case 'set':
			return is.set(value);
		case 'weakmap':
			return is.weakMap(value);
		case 'weakset':
			return is.weakSet(value);
		case 'int8array':
			return is.int8Array(value);
		case 'uint8array':
			return is.uint8Array(value);
		case 'uint8clampedarray':
			return is.uint8ClampedArray(value);
		case 'int16array':
			return is.int16Array(value);
		case 'uint16array':
			return is.uint16Array(value);
		case 'int32array':
			return is.int32Array(value);
		case 'uint32array':
			return is.uint32Array(value);
		case 'float32array':
			return is.float32Array(value);
		case 'float64arrat':
			return is.float64Array(value);
		case 'arraybuffer':
			return is.arrayBuffer(value);
		case 'sharedarraybuffer':
			return is.sharedArrayBuffer(value);
		case 'dataview':
			return is.dataView(value);
		case 'nan':
			return is.nan(value);
		case 'nullorundefined':
			return is.nullOrUndefined(value);
		case 'primitive':
			return is.primitive(value);
		case 'integer':
			return is.integer(value);
		case 'plainobject':
			return is.plainObject(value);
		case 'iterable':
			return is.iterable(value);
		case 'class':
			return is.class(value);
		case 'typedarray':
			return is.typedArray(value);
		default:
			return false;
	}
};

is.any = (values, types) => {
	let ret = false;

	values.forEach(value => {
		types.forEach(type => {
			if (isType(value, type)) {
				ret = true;
			}
		});
	});

	return ret;
};

is.all = (values, types) => {
	let ret = true;

	values.forEach(value => {
		types.forEach(type => {
			if (!isType(value, type)) {
				ret = false;
			}
		});
	});

	return ret;
};

module.exports = is;
