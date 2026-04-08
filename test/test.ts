/* eslint-disable @typescript-eslint/no-empty-function, @stylistic/curly-newline, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/no-unsafe-argument */
import {Buffer} from 'node:buffer';
import fs from 'node:fs';
import net from 'node:net';
import Stream from 'node:stream';
import {inspect} from 'node:util';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {Subject, Observable} from 'rxjs';
import {temporaryFile} from 'tempy';
import {expectTypeOf} from 'expect-type';
import ZenObservable from 'zen-observable';
import is, {
	assert as isAssert,
	assertPropertyKey,
	type AssertionTypeDescription,
	type Predicate,
	type Primitive,
	type TypedArray,
	type TypeName,
	type UrlString,
} from '../source/index.ts';
import {keysOf} from '../source/utilities.ts';

class PromiseSubclassFixture<T> extends Promise<T> {}
class ErrorSubclassFixture extends Error {}

const {window} = new JSDOM();
const {document} = window;

type Test = Readonly<{
	fixtures: unknown[];
	typename?: TypeName;
	typeDescription?: AssertionTypeDescription;
}>;

// Every entry should be unique and belongs in the most specific type for that entry
const reusableFixtures = {
	asyncFunction: [async function () {}, async () => {}],
	asyncGeneratorFunction: [
		async function * () {},
		async function * () {
			yield 4;
		},
	],
	boundFunction: [() => {}, function () {}.bind(null)], // eslint-disable-line no-extra-bind
	buffer: [Buffer.from('🦄')],
	emptyArray: [[], new Array()], // eslint-disable-line @typescript-eslint/no-array-constructor
	emptyMap: [new Map()],
	emptySet: [new Set()],
	emptyString: ['', String()],
	function: [
		function foo() {}, // eslint-disable-line func-names
		function () {},
	],
	generatorFunction: [
		function * () {},
		function * () {
			yield 4;
		},
	],
	infinite: [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY],
	integer: [0, -0, 6],
	nativePromise: [Promise.resolve(), PromiseSubclassFixture.resolve()],
	number: [1.4],
	numericString: ['5', '-3.2', 'Infinity', '0x56'],
	plainObject: [
		{x: 1},
		Object.create(null),
		new Object(), // eslint-disable-line no-object-constructor
		structuredClone({x: 1}),
		structuredClone(Object.create(null)),
		structuredClone(new Object()), // eslint-disable-line no-object-constructor
	],
	promise: [Object.create({then() {}, catch() {}})], // eslint-disable-line unicorn/no-thenable
	safeInteger: [(2 ** 53) - 1, -(2 ** 53) + 1],
} as const satisfies Partial<{[K in keyof typeof is]: unknown[]}>;

const primitiveTypes = {
	undefined: {
		fixtures: [
			undefined,
		],
		typename: 'undefined',
	},
	null: {
		fixtures: [
			null,
		],
		typename: 'null',
	},
	string: {
		fixtures: [
			'🦄',
			'hello world',
			...reusableFixtures.emptyString,
			...reusableFixtures.numericString,
		],
		typename: 'string',
	},
	emptyString: {
		fixtures: [...reusableFixtures.emptyString],
		typename: 'string',
		typeDescription: 'empty string',
	},
	number: {
		fixtures: [
			...reusableFixtures.number,
			...reusableFixtures.infinite,
			...reusableFixtures.integer,
			...reusableFixtures.safeInteger,
		],
		typename: 'number',
	},
	bigint: {
		fixtures: [
			1n,
			0n,
			-0n,
			1234n,
		],
		typename: 'bigint',
	},
	boolean: {
		fixtures: [
			true, false,
		],
		typename: 'boolean',
	},
	numericString: {
		fixtures: [...reusableFixtures.numericString],
		typename: 'string',
		typeDescription: 'string with a number',
	},
	nan: {
		fixtures: [
			NaN, // eslint-disable-line unicorn/prefer-number-properties
			Number.NaN,
		],
		typename: 'NaN',
		typeDescription: 'NaN',
	},
	nullOrUndefined: {
		fixtures: [
			null,
			undefined,
		],
		typeDescription: 'null or undefined',
	},
	integer: {
		fixtures: [...reusableFixtures.integer, ...reusableFixtures.safeInteger],
		typename: 'number',
		typeDescription: 'integer',
	},
	safeInteger: {
		fixtures: [...reusableFixtures.integer, ...reusableFixtures.safeInteger],
		typename: 'number',
		typeDescription: 'integer',
	},
	infinite: {
		fixtures: [...reusableFixtures.infinite],
		typename: 'number',
		typeDescription: 'infinite number',
	},
} as const satisfies Partial<{[K in keyof typeof is]: Test}>;

const objectTypes = {
	symbol: {
		fixtures: [
			Symbol('🦄'),
		],
		typename: 'symbol',
	},
	array: {
		fixtures: [
			[1, 2],
			Array.from({length: 2}),
			...reusableFixtures.emptyArray,
		],
		typename: 'Array',
	},
	emptyArray: {
		fixtures: [...reusableFixtures.emptyArray],
		typename: 'Array',
		typeDescription: 'empty array',
	},
	function: {
		fixtures: [
			...reusableFixtures.asyncFunction,
			...reusableFixtures.asyncGeneratorFunction,
			...reusableFixtures.boundFunction,
			...reusableFixtures.function,
			...reusableFixtures.generatorFunction,
		],
		typename: 'Function',
	},
	buffer: {
		fixtures: [...reusableFixtures.buffer],
		typename: 'Buffer',
	},
	blob: {
		fixtures: [
			new window.Blob(),
		],
		typename: 'Blob',
	},
	object: {
		fixtures: [
			Object.create({x: 1}),
			...reusableFixtures.plainObject,
		],
		typename: 'Object',
	},
	regExp: {
		fixtures: [
			/\w/v,
			// eslint-disable-next-line prefer-regex-literals
			new RegExp(String.raw`\w`, 'v'),
		],
		typename: 'RegExp',
	},
	date: {
		fixtures: [
			new Date(),
		],
		typename: 'Date',
	},
	error: {
		fixtures: [
			new Error('🦄'),
			new ErrorSubclassFixture(),
		],
		typename: 'Error',
	},
	nativePromise: {
		fixtures: [...reusableFixtures.nativePromise],
		typename: 'Promise',
		typeDescription: 'native Promise',
	},
	promise: {
		fixtures: [
			...reusableFixtures.nativePromise,
			...reusableFixtures.promise,
		],
		typename: 'Promise',
		typeDescription: 'Promise',
	},
	generator: {
		fixtures: [
			(function * () {
				yield 4;
			})(),
		],
		typename: 'Generator',
	},
	asyncGenerator: {
		fixtures: [
			(async function * () {
				yield 4;
			})(),
		],
		typename: 'AsyncGenerator',
	},
	generatorFunction: {
		fixtures: [...reusableFixtures.generatorFunction],
		typename: 'Function',
		typeDescription: 'GeneratorFunction',
	},
	asyncGeneratorFunction: {
		fixtures: [...reusableFixtures.asyncGeneratorFunction],
		typename: 'Function',
		typeDescription: 'AsyncGeneratorFunction',
	},
	asyncFunction: {
		fixtures: [...reusableFixtures.asyncFunction],
		typename: 'Function',
		typeDescription: 'AsyncFunction',
	},
	boundFunction: {
		fixtures: [...reusableFixtures.boundFunction, ...reusableFixtures.asyncFunction],
		typename: 'Function',
	},
	map: {
		fixtures: [
			new Map([['one', '1']]),
			...reusableFixtures.emptyMap,
		],
		typename: 'Map',
	},
	emptyMap: {
		fixtures: [...reusableFixtures.emptyMap],
		typename: 'Map',
		typeDescription: 'empty map',
	},
	set: {
		fixtures: [
			new Set(['one']),
			...reusableFixtures.emptySet,
		],
		typename: 'Set',
	},
	emptySet: {
		fixtures: [...reusableFixtures.emptySet],
		typename: 'Set',
		typeDescription: 'empty set',
	},
	weakSet: {
		fixtures: [
			new WeakSet(),
		],
		typename: 'WeakSet',
	},
	weakRef: {
		fixtures: [
			new window.WeakRef({}),
		],
		typename: 'WeakRef',
	},
	weakMap: {
		fixtures: [
			new WeakMap(),
		],
		typename: 'WeakMap',
	},
	int8Array: {
		fixtures: [
			new Int8Array(),
		],
		typename: 'Int8Array',
	},
	uint8Array: {
		fixtures: [
			new Uint8Array(),
		],
		typename: 'Uint8Array',
	},
	uint8ClampedArray: {
		fixtures: [
			new Uint8ClampedArray(),
		],
		typename: 'Uint8ClampedArray',
	},
	int16Array: {
		fixtures: [
			new Int16Array(),
		],
		typename: 'Int16Array',
	},
	uint16Array: {
		fixtures: [
			new Uint16Array(),
		],
		typename: 'Uint16Array',
	},
	int32Array: {
		fixtures: [
			new Int32Array(),
		],
		typename: 'Int32Array',
	},
	uint32Array: {
		fixtures: [
			new Uint32Array(),
		],
		typename: 'Uint32Array',
	},
	float32Array: {
		fixtures: [
			new Float32Array(),
		],
		typename: 'Float32Array',
	},
	float64Array: {
		fixtures: [
			new Float64Array(),
		],
		typename: 'Float64Array',
	},
	bigInt64Array: {
		fixtures: [
			new BigInt64Array(),
		],
		typename: 'BigInt64Array',
	},
	bigUint64Array: {
		fixtures: [
			new BigUint64Array(),
		],
		typename: 'BigUint64Array',
	},
	arrayBuffer: {
		fixtures: [
			new ArrayBuffer(10),
		],
		typename: 'ArrayBuffer',
	},
	dataView: {
		fixtures: [
			new DataView(new ArrayBuffer(10)),
		],
		typename: 'DataView',
	},
	plainObject: {
		fixtures: [
			...reusableFixtures.plainObject,
		],
		typename: 'Object',
		typeDescription: 'plain object',
	},
	htmlElement: {
		fixtures: [
			'div',
			'input',
			'span',
			'img',
			'canvas',
			'script',
		]
			.map(fixture => document.createElement(fixture)),
		typeDescription: 'HTMLElement',
	},
	observable: {
		fixtures: [
			new Observable(),
			new Subject(),
			new ZenObservable(() => {}),
		],
		typename: 'Observable',
	},
	nodeStream: {
		fixtures: [
			fs.createReadStream('readme.md'),
			fs.createWriteStream(temporaryFile()),
			new net.Socket(),
			new Stream.Duplex(),
			new Stream.PassThrough(),
			new Stream.Readable(),
			new Stream.Transform(),
			new Stream.Stream(),
			new Stream.Writable(),
		],
		typename: 'Object',
		typeDescription: 'Node.js Stream',
	},
	formData: {
		fixtures: [
			new window.FormData(),
		],
		typename: 'FormData',
	},
} as const satisfies Partial<{[K in keyof typeof is]: Test}>;

const types = {
	...objectTypes,
	...primitiveTypes,
} as const satisfies Partial<{[K in keyof typeof is]: Test}>;

type TypeNameWithFixture = keyof typeof types;

const subClasses = new Map<TypeNameWithFixture, TypeNameWithFixture[]>([
	['uint8Array', ['buffer']], // It's too hard to differentiate the two
	['object', keysOf(objectTypes)],
]);

// This ensures a certain method matches only the types it's supposed to and none of the other methods' types
for (const type of keysOf(types)) {
	test(`is.${type}`, () => {
		const {fixtures, typeDescription, typename} = types[type] as Test;
		const valueType = typeDescription ?? typename ?? 'unspecified';

		const testAssert: (value: unknown) => never | void = isAssert[type];
		const testIs: Predicate = is[type];

		for (const fixture of fixtures) {
			assert.ok(testIs(fixture), `Value: ${inspect(fixture)}`);
			assert.doesNotThrow(() => {
				testAssert(fixture);
			});

			if (typename !== undefined) {
				assert.strictEqual(is(fixture), typename);
			}
		}

		for (const key of keysOf(types).filter(key => key !== type)) {
			if (subClasses.has(type) && subClasses.get(type)?.includes(key)) {
				continue;
			}

			for (let i = 0; i < types[key].fixtures.length; i += 1) {
				const fixture: unknown = types[key].fixtures[i];

				if (fixtures.includes(fixture)) {
					continue;
				}

				assert.strictEqual(testIs(fixture), false, `${key}.fixture[${i}]: ${inspect(fixture)} should not be ${type}`);
				assert.throws(() => {
					testAssert(fixture);
				}, {
					message: `Expected value which is \`${valueType}\`, received value of type \`${is(fixture)}\`.`,
				});
			}
		}
	});
}

test('is.positiveNumber', () => {
	assert.ok(is.positiveNumber(6));
	assert.ok(is.positiveNumber(1.4));
	assert.ok(is.positiveNumber(Number.POSITIVE_INFINITY));

	assert.doesNotThrow(() => {
		isAssert.positiveNumber(6);
	});
	assert.doesNotThrow(() => {
		isAssert.positiveNumber(1.4);
	});
	assert.doesNotThrow(() => {
		isAssert.positiveNumber(Number.POSITIVE_INFINITY);
	});

	assert.strictEqual(is.positiveNumber(0), false);
	assert.strictEqual(is.positiveNumber(-0), false);
	assert.strictEqual(is.positiveNumber(-6), false);
	assert.strictEqual(is.positiveNumber(-1.4), false);
	assert.strictEqual(is.positiveNumber(Number.NEGATIVE_INFINITY), false);

	assert.throws(() => {
		isAssert.positiveNumber(0);
	});
	assert.throws(() => {
		isAssert.positiveNumber(-0);
	});
	assert.throws(() => {
		isAssert.positiveNumber(-6);
	});
	assert.throws(() => {
		isAssert.positiveNumber(-1.4);
	});
	assert.throws(() => {
		isAssert.positiveNumber(Number.NEGATIVE_INFINITY);
	});
});

test('is.finiteNumber', () => {
	assert.ok(is.finiteNumber(6));
	assert.ok(is.finiteNumber(-6));
	assert.ok(is.finiteNumber(0));
	assert.ok(is.finiteNumber(1.4));

	assert.doesNotThrow(() => {
		isAssert.finiteNumber(6);
	});
	assert.doesNotThrow(() => {
		isAssert.finiteNumber(0);
	});

	assert.strictEqual(is.finiteNumber(Number.POSITIVE_INFINITY), false);
	assert.strictEqual(is.finiteNumber(Number.NEGATIVE_INFINITY), false);
	assert.strictEqual(is.finiteNumber(Number.NaN), false);

	assert.throws(() => {
		isAssert.finiteNumber(Number.POSITIVE_INFINITY);
	});
	assert.throws(() => {
		isAssert.finiteNumber(Number.NEGATIVE_INFINITY);
	});
	assert.throws(() => {
		isAssert.finiteNumber(Number.NaN);
	});
});

test('is.negativeNumber', () => {
	assert.ok(is.negativeNumber(-6));
	assert.ok(is.negativeNumber(-1.4));
	assert.ok(is.negativeNumber(Number.NEGATIVE_INFINITY));

	assert.doesNotThrow(() => {
		isAssert.negativeNumber(-6);
	});
	assert.doesNotThrow(() => {
		isAssert.negativeNumber(-1.4);
	});
	assert.doesNotThrow(() => {
		isAssert.negativeNumber(Number.NEGATIVE_INFINITY);
	});

	assert.strictEqual(is.negativeNumber(0), false);
	assert.strictEqual(is.negativeNumber(-0), false);
	assert.strictEqual(is.negativeNumber(6), false);
	assert.strictEqual(is.negativeNumber(1.4), false);
	assert.strictEqual(is.negativeNumber(Number.POSITIVE_INFINITY), false);

	assert.throws(() => {
		isAssert.negativeNumber(0);
	});
	assert.throws(() => {
		isAssert.negativeNumber(-0);
	});
	assert.throws(() => {
		isAssert.negativeNumber(6);
	});
	assert.throws(() => {
		isAssert.negativeNumber(1.4);
	});
	assert.throws(() => {
		isAssert.negativeNumber(Number.POSITIVE_INFINITY);
	});
});

test('is.nonNegativeNumber', () => {
	assert.ok(is.nonNegativeNumber(0));
	assert.ok(is.nonNegativeNumber(6));
	assert.ok(is.nonNegativeNumber(1.4));
	assert.ok(is.nonNegativeNumber(Number.POSITIVE_INFINITY));

	assert.doesNotThrow(() => {
		isAssert.nonNegativeNumber(0);
	});
	assert.doesNotThrow(() => {
		isAssert.nonNegativeNumber(6);
	});

	assert.ok(is.nonNegativeNumber(-0)); // -0 >= 0 is true in JavaScript
	assert.strictEqual(is.nonNegativeNumber(-6), false);
	assert.strictEqual(is.nonNegativeNumber(-1.4), false);
	assert.strictEqual(is.nonNegativeNumber(Number.NEGATIVE_INFINITY), false);
	assert.strictEqual(is.nonNegativeNumber(Number.NaN), false);

	assert.throws(() => {
		isAssert.nonNegativeNumber(-6);
	});
	assert.throws(() => {
		isAssert.nonNegativeNumber(Number.NEGATIVE_INFINITY);
	});
});

test('is.positiveInteger', () => {
	assert.ok(is.positiveInteger(1));
	assert.ok(is.positiveInteger(6));
	assert.ok(is.positiveInteger(100));

	assert.doesNotThrow(() => {
		isAssert.positiveInteger(1);
	});
	assert.doesNotThrow(() => {
		isAssert.positiveInteger(6);
	});

	assert.strictEqual(is.positiveInteger(0), false);
	assert.strictEqual(is.positiveInteger(-1), false);
	assert.strictEqual(is.positiveInteger(1.5), false);
	assert.strictEqual(is.positiveInteger(Number.POSITIVE_INFINITY), false);
	assert.strictEqual(is.positiveInteger(Number.NaN), false);

	assert.throws(() => {
		isAssert.positiveInteger(0);
	});
	assert.throws(() => {
		isAssert.positiveInteger(-1);
	});
	assert.throws(() => {
		isAssert.positiveInteger(1.5);
	});
});

test('is.negativeInteger', () => {
	assert.ok(is.negativeInteger(-1));
	assert.ok(is.negativeInteger(-6));
	assert.ok(is.negativeInteger(-100));

	assert.doesNotThrow(() => {
		isAssert.negativeInteger(-1);
	});
	assert.doesNotThrow(() => {
		isAssert.negativeInteger(-6);
	});

	assert.strictEqual(is.negativeInteger(0), false);
	assert.strictEqual(is.negativeInteger(-0), false); // -0 < 0 is false in JavaScript
	assert.strictEqual(is.negativeInteger(1), false);
	assert.strictEqual(is.negativeInteger(-1.5), false);
	assert.strictEqual(is.negativeInteger(Number.NEGATIVE_INFINITY), false);
	assert.strictEqual(is.negativeInteger(Number.NaN), false);

	assert.throws(() => {
		isAssert.negativeInteger(0);
	});
	assert.throws(() => {
		isAssert.negativeInteger(1);
	});
	assert.throws(() => {
		isAssert.negativeInteger(-1.5);
	});
	assert.throws(() => {
		isAssert.negativeInteger(Number.NEGATIVE_INFINITY);
	});
});

test('is.nonNegativeInteger', () => {
	assert.ok(is.nonNegativeInteger(0));
	assert.ok(is.nonNegativeInteger(1));
	assert.ok(is.nonNegativeInteger(100));

	assert.doesNotThrow(() => {
		isAssert.nonNegativeInteger(0);
	});
	assert.doesNotThrow(() => {
		isAssert.nonNegativeInteger(1);
	});

	assert.ok(is.nonNegativeInteger(-0)); // -0 >= 0 is true in JavaScript

	assert.strictEqual(is.nonNegativeInteger(-1), false);
	assert.strictEqual(is.nonNegativeInteger(1.5), false);
	assert.strictEqual(is.nonNegativeInteger(Number.POSITIVE_INFINITY), false);
	assert.strictEqual(is.nonNegativeInteger(Number.NaN), false);

	assert.throws(() => {
		isAssert.nonNegativeInteger(-1);
	});
	assert.throws(() => {
		isAssert.nonNegativeInteger(1.5);
	});
	assert.throws(() => {
		isAssert.nonNegativeInteger(Number.POSITIVE_INFINITY);
	});
});

test('is.numericString supplemental', () => {
	assert.strictEqual(is.numericString(''), false);
	assert.strictEqual(is.numericString(' '), false);
	assert.strictEqual(is.numericString(' \t\t\n'), false);
	assert.strictEqual(is.numericString(1), false);
	assert.strictEqual(is.numericString(' 5'), false);
	assert.strictEqual(is.numericString('5 '), false);
	assert.strictEqual(is.numericString(' 5 '), false);
	assert.strictEqual(is.numericString('\t3'), false);
	assert.throws(() => {
		isAssert.numericString('');
	});
	assert.throws(() => {
		isAssert.numericString(1);
	});
});

test('is.array supplemental', () => {
	assert.ok(is.array([1, 2, 3], is.number));
	assert.strictEqual(is.array([1, '2', 3], is.number), false);

	assert.doesNotThrow(() => {
		isAssert.array([1, 2], isAssert.number);
	});

	assert.throws(() => {
		isAssert.array([1, '2'], isAssert.number);
	});

	assert.doesNotThrow(() => {
		const x: unknown[] = [1, 2, 3];
		isAssert.array(x, isAssert.number);
		x[0]?.toFixed(0);
	});

	assert.doesNotThrow(() => {
		const x: unknown[] = [1, 2, 3];
		if (is.array<number>(x, is.number)) {
			x[0]?.toFixed(0);
		}
	});

	assert.throws(() => {
		isAssert.array([1, '2'], isAssert.number, 'Expected numbers');
	}, /Expected numbers/v);
});

test('is.arrayOf', () => {
	const isStringArray = is.arrayOf(is.string);
	assert.ok(isStringArray(['a', 'b', 'c']));
	assert.ok(isStringArray([]));
	assert.strictEqual(isStringArray([1, 2, 3]), false);
	assert.strictEqual(isStringArray(['a', 1]), false);
	assert.strictEqual(isStringArray('not an array'), false);
	assert.strictEqual(isStringArray(undefined), false);

	const isNumberArray = is.arrayOf(is.number);
	assert.ok(isNumberArray([1, 2, 3]));
	assert.strictEqual(isNumberArray([1, '2']), false);
});

test('is.oneOf', () => {
	const isDirection = is.oneOf(['north', 'south', 'east', 'west'] as const);
	assert.ok(isDirection('north'));
	assert.ok(isDirection('west'));
	assert.strictEqual(isDirection('up'), false);
	assert.strictEqual(isDirection(1), false);
	assert.strictEqual(isDirection(undefined), false);

	const isSmallNumber = is.oneOf([1, 2, 3] as const);
	assert.ok(isSmallNumber(1));
	assert.strictEqual(isSmallNumber(4), false);

	// Empty values array always returns false
	const isNever = is.oneOf([] as const);
	assert.strictEqual(isNever('anything'), false);

	// Array.includes uses SameValueZero, so NaN matches NaN (unlike ===)
	const isNanValue = is.oneOf([Number.NaN] as const);
	assert.ok(isNanValue(Number.NaN));
});

test('is.boundFunction supplemental', () => {
	assert.strictEqual(is.boundFunction(function () {}), false); // eslint-disable-line prefer-arrow-callback

	assert.throws(() => {
		isAssert.boundFunction(function () {}); // eslint-disable-line prefer-arrow-callback
	});
});

test('is.asyncFunction supplemental', () => {
	const fixture = async () => {};
	if (is.asyncFunction(fixture)) {
		assert.ok(is.function(fixture().then));

		assert.doesNotThrow(() => {
			isAssert.function(fixture().then);
		});
	}
});

test('is.asyncGenerator supplemental', () => {
	const fixture = (async function * () {
		yield 4;
	})();
	if (is.asyncGenerator(fixture)) {
		assert.ok(is.function(fixture.next));
	}
});

test('is.asyncGeneratorFunction supplemental', () => {
	const fixture = async function * () {
		yield 4;
	};

	if (is.asyncGeneratorFunction(fixture)) {
		assert.ok(is.function(fixture().next));
	}
});

test('is.enumCase', () => {
	enum NonNumericalEnum {
		Key1 = 'key1',
		Key2 = 'key2',
	}

	assert.ok(is.enumCase('key1', NonNumericalEnum));
	assert.doesNotThrow(() => {
		isAssert.enumCase('key1', NonNumericalEnum);
	});

	assert.strictEqual(is.enumCase('invalid', NonNumericalEnum), false);
	assert.throws(() => {
		isAssert.enumCase('invalid', NonNumericalEnum);
	});
});

test('is.directInstanceOf', () => {
	const error = new Error('fixture');
	const errorSubclass = new ErrorSubclassFixture();

	assert.ok(is.directInstanceOf(error, Error));
	assert.ok(is.directInstanceOf(errorSubclass, ErrorSubclassFixture));
	assert.doesNotThrow(() => {
		isAssert.directInstanceOf(error, Error);
	});
	assert.doesNotThrow(() => {
		isAssert.directInstanceOf(errorSubclass, ErrorSubclassFixture);
	});

	assert.strictEqual(is.directInstanceOf(error, ErrorSubclassFixture), false);
	assert.strictEqual(is.directInstanceOf(errorSubclass, Error), false);
	assert.throws(() => {
		isAssert.directInstanceOf(error, ErrorSubclassFixture);
	});
	assert.throws(() => {
		isAssert.directInstanceOf(errorSubclass, Error);
	});

	assert.strictEqual(is.directInstanceOf(undefined, Error), false);
	assert.strictEqual(is.directInstanceOf(null, Error), false);
});

test('is.urlInstance', () => {
	const url = new URL('https://example.com');
	assert.ok(is.urlInstance(url));
	assert.strictEqual(is.urlInstance({}), false);
	assert.strictEqual(is.urlInstance(undefined), false);
	assert.strictEqual(is.urlInstance(null), false);

	assert.doesNotThrow(() => {
		isAssert.urlInstance(url);
	});
	assert.throws(() => {
		isAssert.urlInstance({});
	});
	assert.throws(() => {
		isAssert.urlInstance(undefined);
	});
	assert.throws(() => {
		isAssert.urlInstance(null);
	});
});

test('is.urlString', () => {
	const url = 'https://example.com';
	assert.ok(is.urlString(url));
	assert.strictEqual(is.urlString(new URL(url)), false);
	assert.strictEqual(is.urlString({}), false);
	assert.strictEqual(is.urlString(undefined), false);
	assert.strictEqual(is.urlString(null), false);

	assert.doesNotThrow(() => {
		isAssert.urlString(url);
	});
	assert.throws(() => {
		isAssert.urlString(new URL(url));
	});
	assert.throws(() => {
		isAssert.urlString({});
	});
	assert.throws(() => {
		isAssert.urlString(undefined);
	});
	assert.throws(() => {
		isAssert.urlString(null);
	});
});

// Type test for urlString narrowing fix (issue #212)
// This test demonstrates that the fix allows proper type narrowing in both branches
(() => {
	const value: unknown = 'test';

	if (is.urlString(value)) {
		// ✅ In true branch: value is narrowed to UrlString
		expectTypeOf(value).toEqualTypeOf<UrlString>();
		expectTypeOf(value).toMatchTypeOf<string>();
	} else {
		// ✅ In false branch: value remains unknown (not incorrectly narrowed)
		expectTypeOf(value).toEqualTypeOf<unknown>();

		// ✅ Manual narrowing to string still works
		if (typeof value === 'string') {
			expectTypeOf(value).toEqualTypeOf<string>();
		}
	}
})();

test('is.truthy', () => {
	assert.ok(is.truthy('unicorn'));
	assert.ok(is.truthy('🦄'));
	assert.ok(is.truthy(new Set()));
	assert.ok(is.truthy(Symbol('🦄')));
	assert.ok(is.truthy(true));
	assert.ok(is.truthy(1));
	assert.ok(is.truthy(1n));

	assert.doesNotThrow(() => {
		isAssert.truthy('unicorn');
	});

	assert.doesNotThrow(() => {
		isAssert.truthy('🦄');
	});

	assert.doesNotThrow(() => {
		isAssert.truthy(new Set());
	});

	assert.doesNotThrow(() => {
		isAssert.truthy(Symbol('🦄'));
	});

	assert.doesNotThrow(() => {
		isAssert.truthy(true);
	});

	assert.doesNotThrow(() => {
		isAssert.truthy(1);
	});

	assert.doesNotThrow(() => {
		isAssert.truthy(1n);
	});

	// Checks that `isAssert.truthy` narrow downs boolean type to `true`.
	{
		const booleans = [true, false];
		const function_ = (value: true) => value;
		isAssert.truthy(booleans[0]);
		function_(booleans[0]);
	}

	// Checks that `isAssert.truthy` excludes zero value from number type.
	{
		const bits: Array<0 | 1> = [1, 0, -0];
		const function_ = (value: 1) => value;
		isAssert.truthy(bits[0]);
		function_(bits[0]);
	}

	// Checks that `isAssert.truthy` excludes zero value from bigint type.
	{
		const bits: Array<0n | 1n> = [1n, 0n, -0n];
		const function_ = (value: 1n) => value;
		isAssert.truthy(bits[0]);
		function_(bits[0]);
	}

	// Checks that `isAssert.truthy` excludes empty string from string type.
	{
		const strings: Array<'nonEmpty' | ''> = ['nonEmpty', ''];
		const function_ = (value: 'nonEmpty') => value;
		isAssert.truthy(strings[0]);
		function_(strings[0]);
	}

	// Checks that `isAssert.truthy` excludes undefined from mixed type.
	{
		const maybeUndefineds = ['🦄', undefined];
		const function_ = (value: string) => value;
		isAssert.truthy(maybeUndefineds[0]);
		function_(maybeUndefineds[0]);
	}

	// Checks that `isAssert.truthy` excludes null from mixed type.
	{
		const maybeNulls = ['🦄', null];
		const function_ = (value: string) => value;
		isAssert.truthy(maybeNulls[0]);
		function_(maybeNulls[0]);
	}
});

test('is.falsy', () => {
	assert.ok(is.falsy(false));
	assert.ok(is.falsy(0));
	assert.ok(is.falsy(''));
	assert.ok(is.falsy(null));
	assert.ok(is.falsy(undefined));
	assert.ok(is.falsy(Number.NaN));
	assert.ok(is.falsy(0n));

	assert.doesNotThrow(() => {
		isAssert.falsy(false);
	});

	assert.doesNotThrow(() => {
		isAssert.falsy(0);
	});

	assert.doesNotThrow(() => {
		isAssert.falsy('');
	});

	assert.doesNotThrow(() => {
		isAssert.falsy(null);
	});

	assert.doesNotThrow(() => {
		isAssert.falsy(undefined);
	});

	assert.doesNotThrow(() => {
		isAssert.falsy(Number.NaN);
	});

	assert.doesNotThrow(() => {
		isAssert.falsy(0n);
	});

	// Checks that `isAssert.falsy` narrow downs boolean type to `false`.
	{
		const booleans = [false, true];
		const function_ = (value?: false) => value;
		isAssert.falsy(booleans[0]);
		function_(booleans[0]);
	}

	// Checks that `isAssert.falsy` narrow downs number type to `0`.
	{
		const bits = [0, -0, 1];
		const function_ = (value?: 0) => value;
		isAssert.falsy(bits[0]);
		function_(bits[0]);
		isAssert.falsy(bits[1]);
		function_(bits[1]);
	}

	// Checks that `isAssert.falsy` narrow downs bigint type to `0n`.
	{
		const bits = [0n, -0n, 1n];
		const function_ = (value?: 0n) => value;
		isAssert.falsy(bits[0]);
		function_(bits[0]);
		isAssert.falsy(bits[1]);
		function_(bits[1]);
	}

	// Checks that `isAssert.falsy` narrow downs string type to empty string.
	{
		const strings = ['', 'nonEmpty'];
		const function_ = (value?: '') => value;
		isAssert.falsy(strings[0]);
		function_(strings[0]);
	}

	// Checks that `isAssert.falsy` can narrow down mixed type to undefined.
	{
		const maybeUndefineds = [undefined, Symbol('🦄')];
		const function_ = (value: undefined) => value;
		isAssert.falsy(maybeUndefineds[0]);
		function_(maybeUndefineds[0]);
	}

	// Checks that `isAssert.falsy` can narrow down mixed type to null.
	{
		const maybeNulls = [null, Symbol('🦄')];
		// eslint-disable-next-line @typescript-eslint/no-restricted-types
		const function_ = (value?: null) => value;
		isAssert.falsy(maybeNulls[0]);
		function_(maybeNulls[0]);
	}
});

test('is.primitive', () => {
	const primitives: Primitive[] = [
		undefined,
		null,
		'🦄',
		6,
		Number.POSITIVE_INFINITY,
		Number.NEGATIVE_INFINITY,
		true,
		false,
		Symbol('🦄'),
		6n,
	];

	for (const element of primitives) {
		assert.ok(is.primitive(element));
		assert.doesNotThrow(() => {
			isAssert.primitive(element);
		});
	}
});

test('is.integer supplemental', () => {
	assert.strictEqual(is.integer(1.4), false);
	assert.throws(() => {
		isAssert.integer(1.4);
	});
});

test('is.safeInteger supplemental', () => {
	assert.strictEqual(is.safeInteger(2 ** 53), false);
	assert.strictEqual(is.safeInteger(-(2 ** 53)), false);
	assert.throws(() => {
		isAssert.safeInteger(2 ** 53);
	});
	assert.throws(() => {
		isAssert.safeInteger(-(2 ** 53));
	});
});

test('is.iterable', () => {
	assert.ok(is.iterable(''));
	assert.ok(is.iterable([]));
	assert.ok(is.iterable(new Map()));
	assert.strictEqual(is.iterable(null), false);
	assert.strictEqual(is.iterable(undefined), false);
	assert.strictEqual(is.iterable(0), false);
	assert.strictEqual(is.iterable(Number.NaN), false);
	assert.strictEqual(is.iterable(Number.POSITIVE_INFINITY), false);
	assert.strictEqual(is.iterable({}), false);

	assert.doesNotThrow(() => {
		isAssert.iterable('');
	});
	assert.doesNotThrow(() => {
		isAssert.iterable([]);
	});
	assert.doesNotThrow(() => {
		isAssert.iterable(new Map());
	});
	assert.throws(() => {
		isAssert.iterable(null);
	});
	assert.throws(() => {
		isAssert.iterable(undefined);
	});
	assert.throws(() => {
		isAssert.iterable(0);
	});
	assert.throws(() => {
		isAssert.iterable(Number.NaN);
	});
	assert.throws(() => {
		isAssert.iterable(Number.POSITIVE_INFINITY);
	});
	assert.throws(() => {
		isAssert.iterable({});
	});
});

test('is.asyncIterable', () => {
	assert.ok(is.asyncIterable({
		[Symbol.asyncIterator]() {},
	}));

	assert.strictEqual(is.asyncIterable(null), false);
	assert.strictEqual(is.asyncIterable(undefined), false);
	assert.strictEqual(is.asyncIterable(0), false);
	assert.strictEqual(is.asyncIterable(Number.NaN), false);
	assert.strictEqual(is.asyncIterable(Number.POSITIVE_INFINITY), false);
	assert.strictEqual(is.asyncIterable({}), false);

	assert.doesNotThrow(() => {
		isAssert.asyncIterable({
			[Symbol.asyncIterator]() {},
		});
	});

	assert.throws(() => {
		isAssert.asyncIterable(null);
	});
	assert.throws(() => {
		isAssert.asyncIterable(undefined);
	});
	assert.throws(() => {
		isAssert.asyncIterable(0);
	});
	assert.throws(() => {
		isAssert.asyncIterable(Number.NaN);
	});
	assert.throws(() => {
		isAssert.asyncIterable(Number.POSITIVE_INFINITY);
	});
	assert.throws(() => {
		isAssert.asyncIterable({});
	});
});

test('is.class', () => {
	class Foo {} // eslint-disable-line @typescript-eslint/no-extraneous-class

	// Note: Using new Function to test a minified class (no whitespace in source)
	const minifiedClass = new Function('return class{};'); // eslint-disable-line no-new-func

	const classDeclarations = [
		Foo,
		class Bar extends Foo {},
		minifiedClass(),
	];

	for (const classDeclaration of classDeclarations) {
		assert.ok(is.class(classDeclaration));

		assert.doesNotThrow(() => {
			isAssert.class(classDeclaration);
		});
	}
});

test('is.typedArray', () => {
	const typedArrays: TypedArray[] = [
		new Int8Array(),
		new Uint8Array(),
		new Uint8ClampedArray(),
		new Int16Array(),
		new Uint16Array(),
		new Int32Array(),
		new Uint32Array(),
		new Float32Array(),
		new Float64Array(),
		new BigInt64Array(),
		new BigUint64Array(),
	];

	for (const item of typedArrays) {
		assert.ok(is.typedArray(item));

		assert.doesNotThrow(() => {
			isAssert.typedArray(item);
		});
	}

	assert.strictEqual(is.typedArray(new ArrayBuffer(1)), false);
	assert.strictEqual(is.typedArray([]), false);
	assert.strictEqual(is.typedArray({}), false);

	assert.throws(() => {
		isAssert.typedArray(new ArrayBuffer(1));
	});
	assert.throws(() => {
		isAssert.typedArray([]);
	});
	assert.throws(() => {
		isAssert.typedArray({});
	});
});

test('is.arrayLike', () => {
	(function () {
		assert.ok(is.arrayLike(arguments)); // eslint-disable-line prefer-rest-params
	})();

	assert.ok(is.arrayLike([]));
	assert.ok(is.arrayLike('unicorn'));

	assert.strictEqual(is.arrayLike({}), false);
	assert.strictEqual(is.arrayLike(() => {}), false);
	assert.strictEqual(is.arrayLike(new Map()), false);

	(function () {
		assert.doesNotThrow(function () {
			isAssert.arrayLike(arguments); // eslint-disable-line prefer-rest-params
		});
	})();

	assert.doesNotThrow(() => {
		isAssert.arrayLike([]);
	});
	assert.doesNotThrow(() => {
		isAssert.arrayLike('unicorn');
	});

	assert.throws(() => {
		isAssert.arrayLike({});
	});
	assert.throws(() => {
		isAssert.arrayLike(() => {});
	});
	assert.throws(() => {
		isAssert.arrayLike(new Map());
	});
});

test('is.tupleLike', () => {
	(function () {
		assert.strictEqual(is.tupleLike(arguments, []), false); // eslint-disable-line prefer-rest-params
	})();

	assert.ok(is.tupleLike([], []));
	assert.ok(is.tupleLike([1, '2', true, {}, [], undefined, null], [is.number, is.string, is.boolean, is.object, is.array, is.undefined, is.nullOrUndefined]));
	assert.strictEqual(is.tupleLike('unicorn', [is.string]), false);

	assert.strictEqual(is.tupleLike({}, []), false);
	assert.strictEqual(is.tupleLike(() => {}, [is.function]), false);
	assert.strictEqual(is.tupleLike(new Map(), [is.map]), false);

	(function () {
		assert.throws(function () {
			isAssert.tupleLike(arguments, []); // eslint-disable-line prefer-rest-params
		});
	})();

	assert.doesNotThrow(() => {
		isAssert.tupleLike([], []);
	});
	assert.throws(() => {
		isAssert.tupleLike('unicorn', [is.string]);
	});

	assert.throws(() => {
		isAssert.tupleLike({}, [is.object]);
	});
	assert.throws(() => {
		isAssert.tupleLike(() => {}, [is.function]);
	});
	assert.throws(() => {
		isAssert.tupleLike(new Map(), [is.map]);
	});

	{
		const tuple = [[false, 'unicorn'], 'string', true];

		if (is.tupleLike(tuple, [is.array, is.string, is.boolean])) {
			if (is.tupleLike(tuple[0], [is.boolean, is.string])) { // eslint-disable-line unicorn/no-lonely-if
				const value = tuple[0][1];
				expectTypeOf(value).toEqualTypeOf<string>();
			}
		}
	}

	{
		const tuple = [{isTest: true}, '1', true, null];

		if (is.tupleLike(tuple, [is.nonEmptyObject, is.string, is.boolean, is.null])) {
			const value = tuple[0];
			expectTypeOf(value).toEqualTypeOf<Record<string | number | symbol, unknown>>();
		}
	}

	{
		const tuple = [1, '1', true, null, undefined];

		if (is.tupleLike(tuple, [is.number, is.string, is.boolean, is.null, is.undefined])) {
			const numericValue = tuple[0];
			const stringValue = tuple[1];
			const booleanValue = tuple[2];
			const nullValue = tuple[3];
			const undefinedValue = tuple[4];
			expectTypeOf(numericValue).toEqualTypeOf<number>();
			expectTypeOf(stringValue).toEqualTypeOf<string>();
			expectTypeOf(booleanValue).toEqualTypeOf<boolean>();
			// eslint-disable-next-line @typescript-eslint/no-restricted-types
			expectTypeOf(nullValue).toEqualTypeOf<null>();
			expectTypeOf(undefinedValue).toEqualTypeOf<undefined>();
		}
	}
});

test('is.inRange', () => {
	const x = 3;

	assert.ok(is.inRange(x, [0, 5]));
	assert.ok(is.inRange(x, [5, 0]));
	assert.ok(is.inRange(x, [-5, 5]));
	assert.ok(is.inRange(x, [5, -5]));
	assert.strictEqual(is.inRange(x, [4, 8]), false);
	assert.ok(is.inRange(-7, [-5, -10]));
	assert.ok(is.inRange(-5, [-5, -10]));
	assert.ok(is.inRange(-10, [-5, -10]));

	assert.ok(is.inRange(x, 10));
	assert.ok(is.inRange(0, 0));
	assert.ok(is.inRange(-2, -3));
	assert.strictEqual(is.inRange(x, 2), false);
	assert.strictEqual(is.inRange(-3, -2), false);

	assert.throws(() => {
		// @ts-expect-error invalid argument
		is.inRange(0, []);
	});

	assert.throws(() => {
		// @ts-expect-error invalid argument
		is.inRange(0, [5]);
	});

	assert.throws(() => {
		// @ts-expect-error invalid argument
		is.inRange(0, [1, 2, 3]);
	});

	assert.throws(() => {
		is.inRange(5, [Number.NaN, 10]);
	}, TypeError);

	assert.throws(() => {
		is.inRange(5, [0, Number.NaN]);
	}, TypeError);

	assert.doesNotThrow(() => {
		isAssert.inRange(x, [0, 5]);
	});

	assert.doesNotThrow(() => {
		isAssert.inRange(x, [5, 0]);
	});

	assert.doesNotThrow(() => {
		isAssert.inRange(x, [-5, 5]);
	});

	assert.doesNotThrow(() => {
		isAssert.inRange(x, [5, -5]);
	});

	assert.throws(() => {
		isAssert.inRange(x, [4, 8]);
	});

	assert.doesNotThrow(() => {
		isAssert.inRange(-7, [-5, -10]);
	});

	assert.doesNotThrow(() => {
		isAssert.inRange(-5, [-5, -10]);
	});

	assert.doesNotThrow(() => {
		isAssert.inRange(-10, [-5, -10]);
	});

	assert.doesNotThrow(() => {
		isAssert.inRange(x, 10);
	});

	assert.doesNotThrow(() => {
		isAssert.inRange(0, 0);
	});

	assert.doesNotThrow(() => {
		isAssert.inRange(-2, -3);
	});

	assert.throws(() => {
		isAssert.inRange(x, 2);
	});

	assert.throws(() => {
		isAssert.inRange(-3, -2);
	});

	assert.throws(() => {
		// @ts-expect-error invalid argument
		isAssert.inRange(0, []);
	});

	assert.throws(() => {
		// @ts-expect-error invalid argument
		isAssert.inRange(0, [5]);
	});

	assert.throws(() => {
		// @ts-expect-error invalid argument
		isAssert.inRange(0, [1, 2, 3]);
	});
});

test('is.htmlElement supplemental', () => {
	assert.strictEqual(is.htmlElement({nodeType: 1, nodeName: 'div'}), false);
	assert.throws(() => {
		isAssert.htmlElement({nodeType: 1, nodeName: 'div'});
	});

	const tagNames = [
		'div',
		'input',
		'span',
		'img',
		'canvas',
		'script',
	] as const;

	for (const tagName of tagNames) {
		const element = document.createElement(tagName);
		assert.strictEqual(is(element), 'HTMLElement');
	}

	const nonHtmlElements = [
		document.createTextNode('data'),
		document.createProcessingInstruction('xml-stylesheet', 'href="mycss.css" type="text/css"'),
		document.createComment('This is a comment'),
		document,
		document.implementation.createDocumentType('svg:svg', '-//W3C//DTD SVG 1.1//EN', 'https://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'),
		document.createDocumentFragment(),
	] as const;

	for (const element of nonHtmlElements) {
		assert.throws(() => {
			isAssert.htmlElement(element);
		});
	}
});

test('is.evenInteger', () => {
	for (const element of [-6, 2, 4]) {
		assert.ok(is.evenInteger(element));
		assert.doesNotThrow(() => {
			isAssert.evenInteger(element);
		});
	}

	for (const element of [-3, 1, 5]) {
		assert.strictEqual(is.evenInteger(element), false);
		assert.throws(() => {
			isAssert.evenInteger(element);
		});
	}
});

test('is.oddInteger', () => {
	for (const element of [-5, 7, 13]) {
		assert.ok(is.oddInteger(element));
		assert.doesNotThrow(() => {
			isAssert.oddInteger(element);
		});
	}

	for (const element of [-8, 8, 10]) {
		assert.strictEqual(is.oddInteger(element), false);
		assert.throws(() => {
			isAssert.oddInteger(element);
		});
	}
});

test('is.nonEmptyArray', () => {
	assert.ok(is.nonEmptyArray([1, 2, 3]));
	assert.strictEqual(is.nonEmptyArray([]), false);
	assert.strictEqual(is.nonEmptyArray(new Array()), false); // eslint-disable-line @typescript-eslint/no-array-constructor

	assert.doesNotThrow(() => {
		isAssert.nonEmptyArray([1, 2, 3]);
	});
	assert.throws(() => {
		isAssert.nonEmptyArray([]);
	});
	assert.throws(() => {
		isAssert.nonEmptyArray(new Array()); // eslint-disable-line @typescript-eslint/no-array-constructor
	});

	{
		const strings = ['🦄', 'unicorn'] as string[] | undefined;
		const function_ = (value: string) => value;

		if (is.nonEmptyArray(strings)) {
			const value = strings[0];
			function_(value);
		}
	}

	{
		const mixed = ['🦄', 'unicorn', 1, 2];
		const function_ = (value: string | number) => value;

		if (is.nonEmptyArray(mixed)) {
			const value = mixed[0];
			function_(value);
		}
	}

	{
		const arrays = [['🦄'], ['unicorn']];
		const function_ = (value: string[]) => value;

		if (is.nonEmptyArray(arrays)) {
			const value = arrays[0];
			function_(value);
		}
	}

	{
		const strings = ['🦄', 'unicorn'] as string[] | undefined;
		const function_ = (value: string) => value;

		isAssert.nonEmptyArray(strings);

		const value = strings[0];
		function_(value);
	}

	{
		const mixed = ['🦄', 'unicorn', 1, 2];
		const function_ = (value: string | number) => value;

		isAssert.nonEmptyArray(mixed);

		const value = mixed[0];
		function_(value);
	}

	{
		const arrays = [['🦄'], ['unicorn']];
		const function_ = (value: string[]) => value;

		isAssert.nonEmptyArray(arrays);

		const value = arrays[0];
		function_(value);
	}
});

test('is.emptyString supplemental', () => {
	assert.strictEqual(is.emptyString('🦄'), false);
	assert.throws(() => {
		isAssert.emptyString('🦄');
	});
});

test('is.emptyStringOrWhitespace supplemental', () => {
	assert.ok(is.emptyStringOrWhitespace('  '));
	assert.strictEqual(is.emptyStringOrWhitespace('🦄'), false);
	assert.strictEqual(is.emptyStringOrWhitespace('unicorn'), false);

	assert.doesNotThrow(() => {
		isAssert.emptyStringOrWhitespace('  ');
	});
	assert.throws(() => {
		isAssert.emptyStringOrWhitespace('🦄');
	});
	assert.throws(() => {
		isAssert.emptyStringOrWhitespace('unicorn');
	});

	let value = 'test'; // eslint-disable-line prefer-const -- can't use `const` here because then it will be inferred as `never` in the `if` block
	if (is.emptyStringOrWhitespace(value)) {
		value.charAt(0); // Should be inferred as `'' | Whitespace` and not `never`
	} else {
		value.charAt(0); // Should be inferred as `string` and not `never`
	}
});

test('is.nonEmptyString', () => {
	assert.strictEqual(is.nonEmptyString(''), false);
	assert.strictEqual(is.nonEmptyString(String()), false);
	assert.ok(is.nonEmptyString('🦄'));

	assert.throws(() => {
		isAssert.nonEmptyString('');
	});
	assert.throws(() => {
		isAssert.nonEmptyString(String());
	});
	assert.doesNotThrow(() => {
		isAssert.nonEmptyString('🦄');
	});
});

test('is.nonEmptyStringAndNotWhitespace', () => {
	assert.strictEqual(is.nonEmptyStringAndNotWhitespace(' '), false);
	assert.ok(is.nonEmptyStringAndNotWhitespace('🦄'));

	for (const value of [null, undefined, 5, Number.NaN, {}, []]) {
		assert.strictEqual(is.nonEmptyStringAndNotWhitespace(value), false);

		assert.throws(() => {
			isAssert.nonEmptyStringAndNotWhitespace(value);
		});
	}

	assert.throws(() => {
		isAssert.nonEmptyStringAndNotWhitespace('');
	});

	assert.doesNotThrow(() => {
		isAssert.nonEmptyStringAndNotWhitespace('🦄');
	});
});

test('is.emptyObject', () => {
	assert.ok(is.emptyObject({}));
	assert.ok(is.emptyObject(new Object())); // eslint-disable-line no-object-constructor
	assert.strictEqual(is.emptyObject({unicorn: '🦄'}), false);
	assert.strictEqual(is.emptyObject(function () {}), false); // eslint-disable-line prefer-arrow-callback
	assert.strictEqual(is.emptyObject(() => {}), false);
	assert.strictEqual(is.emptyObject(class Foo {}), false); // eslint-disable-line @typescript-eslint/no-extraneous-class
	assert.strictEqual(is.emptyObject([]), false);
	assert.strictEqual(is.emptyObject(['unicorn']), false);

	assert.doesNotThrow(() => {
		isAssert.emptyObject({});
	});
	assert.doesNotThrow(() => {
		isAssert.emptyObject(new Object()); // eslint-disable-line no-object-constructor
	});
	assert.throws(() => {
		isAssert.emptyObject({unicorn: '🦄'});
	});
	assert.throws(() => {
		isAssert.emptyObject(function () {}); // eslint-disable-line prefer-arrow-callback
	});
});

test('is.nonEmptyObject', () => {
	const foo = {};
	is.nonEmptyObject(foo);

	assert.strictEqual(is.nonEmptyObject({}), false);
	assert.strictEqual(is.nonEmptyObject(new Object()), false); // eslint-disable-line no-object-constructor
	assert.ok(is.nonEmptyObject({unicorn: '🦄'}));

	assert.strictEqual(is.nonEmptyObject([]), false);
	assert.strictEqual(is.nonEmptyObject(['unicorn']), false);

	const functionWithProperty = function () {};
	(functionWithProperty as any).custom = 'value';
	assert.strictEqual(is.nonEmptyObject(functionWithProperty), false);

	assert.throws(() => {
		isAssert.nonEmptyObject({});
	});
	assert.throws(() => {
		isAssert.nonEmptyObject(new Object()); // eslint-disable-line no-object-constructor
	});
	assert.doesNotThrow(() => {
		isAssert.nonEmptyObject({unicorn: '🦄'});
	});
});

test('is.nonEmptySet', () => {
	const temporarySet = new Set();
	assert.strictEqual(is.nonEmptySet(temporarySet), false);
	assert.throws(() => {
		isAssert.nonEmptySet(temporarySet);
	});

	temporarySet.add(1);
	assert.ok(is.nonEmptySet(temporarySet));
	assert.doesNotThrow(() => {
		isAssert.nonEmptySet(temporarySet);
	});
});

test('is.nonEmptyMap', () => {
	const temporaryMap = new Map();
	assert.strictEqual(is.nonEmptyMap(temporaryMap), false);
	assert.throws(() => {
		isAssert.nonEmptyMap(temporaryMap);
	});

	temporaryMap.set('unicorn', '🦄');
	assert.ok(is.nonEmptyMap(temporaryMap));
	assert.doesNotThrow(() => {
		isAssert.nonEmptyMap(temporaryMap);
	});
});

test('is.propertyKey', () => {
	assert.ok(is.propertyKey('key'));
	assert.ok(is.propertyKey(42));
	assert.ok(is.propertyKey(Symbol('')));

	assert.strictEqual(is.propertyKey(null), false);
	assert.strictEqual(is.propertyKey(undefined), false);
	assert.strictEqual(is.propertyKey(true), false);
	assert.strictEqual(is.propertyKey({}), false);
	assert.strictEqual(is.propertyKey([]), false);
	assert.strictEqual(is.propertyKey(new Map()), false);
	assert.strictEqual(is.propertyKey(new Set()), false);

	// AssertPropertyKey should narrow to PropertyKey (string | number | symbol), not just number
	const symbolValue: unknown = Symbol('test');
	assertPropertyKey(symbolValue);
	expectTypeOf(symbolValue).toEqualTypeOf<PropertyKey>();
});

test('is.any', () => {
	assert.ok(is.any(is.string, {}, true, '🦄'));
	assert.ok(is.any(is.object, false, {}, 'unicorns'));
	assert.strictEqual(is.any(is.boolean, '🦄', [], 3), false);
	assert.strictEqual(is.any(is.integer, true, 'lol', {}), false);
	assert.ok(is.any([is.string, is.number], {}, true, '🦄'));
	assert.strictEqual(is.any([is.boolean, is.number], 'unicorns', [], new Map()), false);
	assert.strictEqual(typeof is.any([is.string, is.number]), 'function');

	assert.throws(() => {
		is.any(null as any, true);
	});

	assert.throws(() => {
		is.any([], 'value');
	});

	assert.throws(() => {
		is.any(is.string);
	});

	assert.doesNotThrow(() => {
		isAssert.any(is.string, {}, true, '🦄');
	});

	assert.doesNotThrow(() => {
		isAssert.any(is.object, false, {}, 'unicorns');
	});

	assert.throws(() => {
		isAssert.any([is.string, is.number]);
	});

	assert.throws(() => {
		isAssert.any(is.boolean, '🦄', [], 3);
	});

	assert.throws(() => {
		isAssert.any(is.integer, true, 'lol', {});
	});

	assert.throws(() => {
		isAssert.any(null as any, true);
	});

	assert.throws(() => {
		isAssert.any([], 'value');
	});

	assert.throws(() => {
		isAssert.any(is.string);
	});

	assert.throws(() => {
		isAssert.any(is.string, 1, 2, 3);
	}, {
		// Includes expected type and removes duplicates from received types:
		// eslint-disable-next-line prefer-regex-literals
		message: new RegExp('Expected values which are `string`. Received values of type `number`.', 'v'),
	});

	assert.throws(() => {
		isAssert.any(is.string, 1, [4]);
	}, {
		// Includes expected type and lists all received types:
		// eslint-disable-next-line prefer-regex-literals
		message: new RegExp('Expected values which are `string`. Received values of types `number` and `Array`.', 'v'),
	});

	assert.throws(() => {
		isAssert.any([is.string, is.nullOrUndefined], 1);
	}, {
		// Handles array as first argument:
		// eslint-disable-next-line prefer-regex-literals
		message: new RegExp('Expected values which are `string` or `null or undefined`. Received values of type `number`.', 'v'),
	});

	assert.throws(() => {
		isAssert.any([is.string, is.number, is.boolean], null, undefined, Number.NaN);
	}, {
		// Handles more than 2 expected and received types:
		// eslint-disable-next-line prefer-regex-literals
		message: new RegExp('Expected values which are `string`, `number`, or `boolean`. Received values of types `null`, `undefined`, and `NaN`.', 'v'),
	});

	assert.throws(() => {
		isAssert.any(() => false, 1);
	}, {
		// Default type assertion message
		// eslint-disable-next-line prefer-regex-literals
		message: new RegExp('Expected values which are `predicate returns truthy for any value`.', 'v'),
	});
});

test('is.all', () => {
	assert.ok(is.all(is.object, {}, new Set(), new Map()));
	assert.ok(is.all(is.boolean, true, false));
	assert.strictEqual(is.all(is.string, '🦄', []), false);
	assert.strictEqual(is.all(is.set, new Map(), {}), false);

	assert.ok(is.all(is.array, ['1'], ['2']));
	assert.ok(is.all([is.string, is.nonEmptyString], '🦄', 'unicorns'));
	assert.strictEqual(is.all([is.string, is.number], '🦄'), false);

	assert.throws(() => {
		is.all(null as any, true);
	});

	assert.throws(() => {
		is.all([], 'value');
	});

	assert.throws(() => {
		is.all(is.string);
	});

	assert.doesNotThrow(() => {
		isAssert.all(is.object, {}, new Set(), new Map());
	});

	assert.doesNotThrow(() => {
		isAssert.all(is.boolean, true, false);
	});

	assert.throws(() => {
		isAssert.all([is.string, is.number]);
	});

	assert.doesNotThrow(() => {
		isAssert.all([is.string, is.nonEmptyString], '🦄', 'unicorns');
	});

	assert.throws(() => {
		isAssert.all(is.string, '🦄', []);
	});

	assert.throws(() => {
		isAssert.all([is.string, is.number], '🦄');
	});

	assert.throws(() => {
		isAssert.all(is.set, new Map(), {});
	});

	assert.throws(() => {
		isAssert.all(null as any, true);
	});

	assert.throws(() => {
		isAssert.all([], 'value');
	});

	assert.throws(() => {
		isAssert.all(is.string);
	});

	assert.throws(() => {
		isAssert.all(is.string, 1, 2, 3);
	}, {
		// Includes expected type and removes duplicates from received types:
		// eslint-disable-next-line prefer-regex-literals
		message: new RegExp('Expected values which are `string`. Received values of type `number`.', 'v'),
	});

	assert.throws(() => {
		isAssert.all(is.string, 1, [4]);
	}, {
		// Includes expected type and lists all received types:
		// eslint-disable-next-line prefer-regex-literals
		message: new RegExp('Expected values which are `string`. Received values of types `number` and `Array`.', 'v'),
	});

	assert.throws(() => {
		isAssert.all(() => false, 1);
	}, {
		// Default type assertion message
		// eslint-disable-next-line prefer-regex-literals
		message: new RegExp('Expected values which are `predicate returns truthy for all values`.', 'v'),
	});
});

test('is.any as predicate factory', () => {
	// Returns a type guard function when called with only predicates
	const isStringOrNumber = is.any([is.string, is.number]);
	assert.strictEqual(typeof isStringOrNumber, 'function');
	assert.ok(isStringOrNumber('hello'));
	assert.ok(isStringOrNumber(123));
	assert.strictEqual(isStringOrNumber(true), false);
	assert.strictEqual(isStringOrNumber({}), false);

	// Type narrowing works correctly (compile-time check)
	const value: unknown = 'test';
	if (isStringOrNumber(value)) {
		// TypeScript should narrow to string | number
		const narrowed: string | number = value;
		assert.ok(typeof narrowed === 'string' || typeof narrowed === 'number');
	}

	// Works with is.optional
	assert.ok(is.optional(undefined, is.any([is.string, is.number])));
	assert.ok(is.optional('test', is.any([is.string, is.number])));
	assert.ok(is.optional(42, is.any([is.string, is.number])));
	assert.strictEqual(is.optional(true, is.any([is.string, is.number])), false);

	const predicateArray: Predicate[] = [is.string, is.number];
	const isStringOrNumberFromArray = is.any(predicateArray);
	assert.strictEqual(typeof isStringOrNumberFromArray, 'function');
	assert.ok(isStringOrNumberFromArray('hello'));
	assert.ok(isStringOrNumberFromArray(123));
	assert.strictEqual(isStringOrNumberFromArray(true), false);

	// Type narrowing with is.optional (compile-time check)
	const optionalValue: unknown = undefined;
	if (is.optional(optionalValue, is.any([is.string, is.number]))) {
		// TypeScript should narrow to string | number | undefined
		const narrowed: string | number | undefined = optionalValue;
		assert.ok(narrowed === undefined || typeof narrowed === 'string' || typeof narrowed === 'number');
	}

	// Works with more predicates
	const isStringOrNumberOrBoolean = is.any([is.string, is.number, is.boolean]);
	assert.ok(isStringOrNumberOrBoolean('hello'));
	assert.ok(isStringOrNumberOrBoolean(123));
	assert.ok(isStringOrNumberOrBoolean(true));
	assert.strictEqual(isStringOrNumberOrBoolean({}), false);

	assert.throws(() => {
		is.any([is.string, 123 as any]);
	});
});

test('is.all as predicate factory', () => {
	// Returns a type guard function when called with only predicates
	const isArrayAndNonEmpty = is.all([is.array, is.nonEmptyArray]);
	assert.strictEqual(typeof isArrayAndNonEmpty, 'function');
	assert.ok(isArrayAndNonEmpty(['hello']));
	assert.strictEqual(isArrayAndNonEmpty([]), false);
	assert.strictEqual(isArrayAndNonEmpty('hello'), false);

	// Type narrowing works correctly
	const value: unknown = ['test'];
	if (isArrayAndNonEmpty(value)) {
		// TypeScript should narrow to the intersection type
		assert.ok(Array.isArray(value));
		assert.ok(value.length > 0);
	}

	// Works with is.optional
	assert.ok(is.optional(undefined, is.all([is.object, is.plainObject])));
	assert.ok(is.optional({foo: 'bar'}, is.all([is.object, is.plainObject])));
	assert.strictEqual(is.optional([], is.all([is.object, is.plainObject])), false);

	assert.throws(() => {
		is.all([is.string, 123 as any]);
	});
});

test('is.formData supplemental', () => {
	const data = new window.FormData();
	assert.ok(is.formData(data));
	assert.strictEqual(is.formData({}), false);
	assert.strictEqual(is.formData(undefined), false);
	assert.strictEqual(is.formData(null), false);

	assert.doesNotThrow(() => {
		isAssert.formData(data);
	});
	assert.throws(() => {
		isAssert.formData({});
	});
	assert.throws(() => {
		isAssert.formData(undefined);
	});
	assert.throws(() => {
		isAssert.formData(null);
	});
});

test('is.urlSearchParams', () => {
	const searchParameters = new URLSearchParams();
	assert.ok(is.urlSearchParams(searchParameters));
	assert.strictEqual(is.urlSearchParams({}), false);
	assert.strictEqual(is.urlSearchParams(undefined), false);
	assert.strictEqual(is.urlSearchParams(null), false);

	assert.doesNotThrow(() => {
		isAssert.urlSearchParams(searchParameters);
	});
	assert.throws(() => {
		isAssert.urlSearchParams({});
	});
	assert.throws(() => {
		isAssert.urlSearchParams(undefined);
	});
	assert.throws(() => {
		isAssert.urlSearchParams(null);
	});
});

test('is.validDate', () => {
	assert.ok(is.validDate(new Date()));
	assert.strictEqual(is.validDate(new Date('x')), false);
	assert.doesNotThrow(() => {
		isAssert.validDate(new Date());
	});
	assert.throws(() => {
		isAssert.validDate(new Date('x'));
	});
});

test('is.validLength', () => {
	assert.ok(is.validLength(1));
	assert.ok(is.validLength(0));
	assert.strictEqual(is.validLength(-1), false);
	assert.strictEqual(is.validLength(0.1), false);
	assert.doesNotThrow(() => {
		isAssert.validLength(1);
	});
	assert.throws(() => {
		isAssert.validLength(-1);
	});
	assert.throws(() => {
		isAssert.validLength(0.1);
	});
});

test('is.whitespaceString', () => {
	assert.ok(is.whitespaceString(' '));
	assert.ok(is.whitespaceString('   '));
	assert.ok(is.whitespaceString(' 　 '));
	assert.ok(is.whitespaceString('\u3000'));
	assert.ok(is.whitespaceString('　'));
	assert.strictEqual(is.whitespaceString(''), false);
	assert.strictEqual(is.whitespaceString('-'), false);
	assert.strictEqual(is.whitespaceString(' hi '), false);

	assert.doesNotThrow(() => {
		isAssert.whitespaceString(' ');
	});
	assert.throws(() => {
		isAssert.whitespaceString('');
	});
	assert.throws(() => {
		isAssert.whitespaceString(' hi ');
	});
});

test('assert', () => {
	// Contrived test showing that TypeScript acknowledges the type assertion in `isAssert.number()`.
	// Real-world usage includes asserting user input, but here we use a random number/string generator.

	const getNumberOrStringRandomly = (): number | string => {
		const random = Math.random();

		if (random < 0.5) {
			return 'sometimes this function returns text';
		}

		return random;
	};

	const canUseOnlyNumber = (badlyTypedArgument: any): number => {
		// Narrow the type to number, or throw an error at runtime for non-numbers.
		isAssert.number(badlyTypedArgument);

		// Both the type and runtime value is number.
		return 1000 * badlyTypedArgument;
	};

	const badlyTypedVariable: any = getNumberOrStringRandomly();

	assert.ok(is.number(badlyTypedVariable) || is.string(badlyTypedVariable));

	// Using try/catch for test purposes only.
	try {
		const result = canUseOnlyNumber(badlyTypedVariable);

		// Got lucky, the input was a number yielding a good result.
		assert.ok(is.number(result));
	} catch {
		// Assertion was tripped.
		assert.ok(is.string(badlyTypedVariable));
	}
});

test('custom assertion message', () => {
	const message = 'Custom error message';

	assert.throws(() => {
		isAssert.array(undefined, undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.arrayBuffer(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.arrayLike(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.asyncFunction(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.asyncGenerator(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.asyncGeneratorFunction(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.asyncIterable(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.bigInt64Array(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.bigUint64Array(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.bigint(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.blob(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.boolean(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.boundFunction(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.buffer(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.class(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.dataView(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.date(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.directInstanceOf(undefined, Error, message);
	}, {message});

	assert.throws(() => {
		isAssert.emptyArray(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.emptyMap(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.emptyObject(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.emptySet(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.emptyString(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.emptyStringOrWhitespace(undefined, message);
	}, {message});

	assert.throws(() => {
		enum Enum {}
		isAssert.enumCase('invalid', Enum, message);
	}, {message});

	assert.throws(() => {
		isAssert.error(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.evenInteger(33, message);
	}, {message});

	assert.throws(() => {
		isAssert.falsy(true, message);
	}, {message});

	assert.throws(() => {
		isAssert.finiteNumber(Number.POSITIVE_INFINITY, message);
	}, {message});

	assert.throws(() => {
		isAssert.float32Array(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.float64Array(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.formData(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.function(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.generator(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.generatorFunction(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.htmlElement(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.inRange(5, [1, 2], message);
	}, {message});

	assert.throws(() => {
		isAssert.infinite(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.int16Array(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.int32Array(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.int8Array(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.integer(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.iterable(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.map(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.nan(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.nativePromise(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.negativeNumber(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.nodeStream(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.nonEmptyArray(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.nonEmptyMap(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.nonEmptyObject(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.nonEmptySet(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.nonEmptyString(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.nonEmptyStringAndNotWhitespace(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.nonNegativeNumber(-1, message);
	}, {message});

	assert.throws(() => {
		isAssert.null(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.nullOrUndefined(false, message);
	}, {message});

	assert.throws(() => {
		isAssert.number(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.numericString(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.object(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.observable(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.oddInteger(42, message);
	}, {message});

	assert.throws(() => {
		isAssert.plainObject(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.positiveInteger(0, message);
	}, {message});

	assert.throws(() => {
		isAssert.positiveNumber(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.primitive([], message);
	}, {message});

	assert.throws(() => {
		isAssert.promise(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.propertyKey(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.regExp(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.safeInteger(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.set(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.sharedArrayBuffer(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.string(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.symbol(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.truthy(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.tupleLike(undefined, [], message);
	}, {message});

	assert.throws(() => {
		isAssert.typedArray(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.uint16Array(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.uint32Array(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.uint8Array(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.uint8ClampedArray(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.undefined(false, message);
	}, {message});

	assert.throws(() => {
		isAssert.urlInstance(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.urlSearchParams(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.urlString(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.validDate(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.validLength(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.weakMap(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.weakRef(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.weakSet(undefined, message);
	}, {message});

	assert.throws(() => {
		isAssert.whitespaceString(undefined, message);
	}, {message});
});

test('is.optional', () => {
	assert.ok(is.optional(undefined, is.string));
	assert.ok(is.optional('🦄', is.string));
	assert.strictEqual(is.optional(123, is.string), false);
	assert.strictEqual(is.optional(null, is.string), false);
});

test('isAssert.optional', () => {
	assert.doesNotThrow(() => {
		isAssert.optional(undefined, isAssert.string);
	});

	assert.doesNotThrow(() => {
		isAssert.optional('🦄', isAssert.string);
	});

	assert.throws(() => {
		isAssert.optional(123, isAssert.string);
	});

	assert.throws(() => {
		isAssert.optional(null, isAssert.string);
	});
});
