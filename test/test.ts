/* eslint-disable @typescript-eslint/no-empty-function */
import {Buffer} from 'node:buffer';
import fs from 'node:fs';
import net from 'node:net';
import Stream from 'node:stream';
import {inspect} from 'node:util';
import test, {type ExecutionContext} from 'ava';
import {JSDOM} from 'jsdom';
import {Subject, Observable} from 'rxjs';
import {temporaryFile} from 'tempy';
import {expectTypeOf} from 'expect-type';
import ZenObservable from 'zen-observable';
import is, {
	assert,
	type AssertionTypeDescription,
	type Predicate,
	type Primitive,
	type TypedArray,
	type TypeName,
} from '../source/index.js';
import {keysOf} from '../source/utilities.js';

class PromiseSubclassFixture<T> extends Promise<T> {}
class ErrorSubclassFixture extends Error {}

const {window} = new JSDOM();
const {document} = window;

const structuredClone = globalThis.structuredClone ?? (x => x);

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
			BigInt('1234'),
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
			/\w/,
			new RegExp('\\w'), // eslint-disable-line prefer-regex-literals
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
const exclusivelyTyped = test.macro({
	exec(t: ExecutionContext, type: TypeNameWithFixture) {
		const {fixtures, typeDescription, typename} = types[type] as Test;
		const valueType = typeDescription ?? typename ?? 'unspecified';

		const testAssert: (value: unknown) => never | void = assert[type];
		const testIs: Predicate = is[type];

		for (const fixture of fixtures) {
			t.true(testIs(fixture), `Value: ${inspect(fixture)}`);
			t.notThrows(() => {
				testAssert(fixture);
			});

			if (typename) {
				t.is<TypeName, TypeName>(is(fixture), typename);
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

				t.false(testIs(fixture), `${key}.fixture[${i}]: ${inspect(fixture)} should not be ${type}`);
				t.throws(() => {
					testAssert(fixture);
				}, {
					message: `Expected value which is \`${valueType}\`, received value of type \`${is(fixture)}\`.`,
				});
			}
		}
	},
	title(_, type: TypeNameWithFixture) {
		return `is.${type}`;
	},
});

for (const type of keysOf(types)) {
	test(exclusivelyTyped, type);
}

test('is.positiveNumber', t => {
	t.true(is.positiveNumber(6));
	t.true(is.positiveNumber(1.4));
	t.true(is.positiveNumber(Number.POSITIVE_INFINITY));

	t.notThrows(() => {
		assert.positiveNumber(6);
	});
	t.notThrows(() => {
		assert.positiveNumber(1.4);
	});
	t.notThrows(() => {
		assert.positiveNumber(Number.POSITIVE_INFINITY);
	});

	t.false(is.positiveNumber(0));
	t.false(is.positiveNumber(-0));
	t.false(is.positiveNumber(-6));
	t.false(is.positiveNumber(-1.4));
	t.false(is.positiveNumber(Number.NEGATIVE_INFINITY));

	t.throws(() => {
		assert.positiveNumber(0);
	});
	t.throws(() => {
		assert.positiveNumber(-0);
	});
	t.throws(() => {
		assert.positiveNumber(-6);
	});
	t.throws(() => {
		assert.positiveNumber(-1.4);
	});
	t.throws(() => {
		assert.positiveNumber(Number.NEGATIVE_INFINITY);
	});
});

test('is.negativeNumber', t => {
	t.true(is.negativeNumber(-6));
	t.true(is.negativeNumber(-1.4));
	t.true(is.negativeNumber(Number.NEGATIVE_INFINITY));

	t.notThrows(() => {
		assert.negativeNumber(-6);
	});
	t.notThrows(() => {
		assert.negativeNumber(-1.4);
	});
	t.notThrows(() => {
		assert.negativeNumber(Number.NEGATIVE_INFINITY);
	});

	t.false(is.negativeNumber(0));
	t.false(is.negativeNumber(-0));
	t.false(is.negativeNumber(6));
	t.false(is.negativeNumber(1.4));
	t.false(is.negativeNumber(Number.POSITIVE_INFINITY));

	t.throws(() => {
		assert.negativeNumber(0);
	});
	t.throws(() => {
		assert.negativeNumber(-0);
	});
	t.throws(() => {
		assert.negativeNumber(6);
	});
	t.throws(() => {
		assert.negativeNumber(1.4);
	});
	t.throws(() => {
		assert.negativeNumber(Number.POSITIVE_INFINITY);
	});
});

test('is.numericString supplemental', t => {
	t.false(is.numericString(''));
	t.false(is.numericString(' '));
	t.false(is.numericString(' \t\t\n'));
	t.false(is.numericString(1));
	t.throws(() => {
		assert.numericString('');
	});
	t.throws(() => {
		assert.numericString(1);
	});
});

test('is.array supplemental', t => {
	t.true(is.array([1, 2, 3], is.number));
	t.false(is.array([1, '2', 3], is.number));

	t.notThrows(() => {
		assert.array([1, 2], assert.number);
	});

	t.throws(() => {
		assert.array([1, '2'], assert.number);
	});

	t.notThrows(() => {
		const x: unknown[] = [1, 2, 3];
		assert.array(x, assert.number);
		x[0]?.toFixed(0);
	});

	t.notThrows(() => {
		const x: unknown[] = [1, 2, 3];
		if (is.array<number>(x, is.number)) {
			x[0]?.toFixed(0);
		}
	});

	t.throws(() => {
		assert.array([1, '2'], assert.number, 'Expected numbers');
	}, {message: /Expected numbers/});
});

test('is.boundFunction supplemental', t => {
	t.false(is.boundFunction(function () {})); // eslint-disable-line prefer-arrow-callback

	t.throws(() => {
		assert.boundFunction(function () {}); // eslint-disable-line prefer-arrow-callback
	});
});

test('is.asyncFunction supplemental', t => {
	const fixture = async () => {};
	if (is.asyncFunction(fixture)) {
		t.true(is.function(fixture().then));

		t.notThrows(() => {
			assert.function(fixture().then);
		});
	}
});

test('is.asyncGenerator supplemental', t => {
	const fixture = (async function * () {
		yield 4;
	})();
	if (is.asyncGenerator(fixture)) {
		t.true(is.function(fixture.next));
	}
});

test('is.asyncGeneratorFunction supplemental', t => {
	const fixture = async function * () {
		yield 4;
	};

	if (is.asyncGeneratorFunction(fixture)) {
		t.true(is.function(fixture().next));
	}
});

test('is.enumCase', t => {
	enum NonNumericalEnum {
		Key1 = 'key1',
		Key2 = 'key2',
	}

	t.true(is.enumCase('key1', NonNumericalEnum));
	t.notThrows(() => {
		assert.enumCase('key1', NonNumericalEnum);
	});

	t.false(is.enumCase('invalid', NonNumericalEnum));
	t.throws(() => {
		assert.enumCase('invalid', NonNumericalEnum);
	});
});

test('is.directInstanceOf', t => {
	const error = new Error('fixture');
	const errorSubclass = new ErrorSubclassFixture();

	t.true(is.directInstanceOf(error, Error));
	t.true(is.directInstanceOf(errorSubclass, ErrorSubclassFixture));
	t.notThrows(() => {
		assert.directInstanceOf(error, Error);
	});
	t.notThrows(() => {
		assert.directInstanceOf(errorSubclass, ErrorSubclassFixture);
	});

	t.false(is.directInstanceOf(error, ErrorSubclassFixture));
	t.false(is.directInstanceOf(errorSubclass, Error));
	t.throws(() => {
		assert.directInstanceOf(error, ErrorSubclassFixture);
	});
	t.throws(() => {
		assert.directInstanceOf(errorSubclass, Error);
	});

	t.false(is.directInstanceOf(undefined, Error));
	t.false(is.directInstanceOf(null, Error));
});

test('is.urlInstance', t => {
	const url = new URL('https://example.com');
	t.true(is.urlInstance(url));
	t.false(is.urlInstance({}));
	t.false(is.urlInstance(undefined));
	t.false(is.urlInstance(null));

	t.notThrows(() => {
		assert.urlInstance(url);
	});
	t.throws(() => {
		assert.urlInstance({});
	});
	t.throws(() => {
		assert.urlInstance(undefined);
	});
	t.throws(() => {
		assert.urlInstance(null);
	});
});

test('is.urlString', t => {
	const url = 'https://example.com';
	t.true(is.urlString(url));
	t.false(is.urlString(new URL(url)));
	t.false(is.urlString({}));
	t.false(is.urlString(undefined));
	t.false(is.urlString(null));

	t.notThrows(() => {
		assert.urlString(url);
	});
	t.throws(() => {
		assert.urlString(new URL(url));
	});
	t.throws(() => {
		assert.urlString({});
	});
	t.throws(() => {
		assert.urlString(undefined);
	});
	t.throws(() => {
		assert.urlString(null);
	});
});

test('is.truthy', t => {
	t.true(is.truthy('unicorn'));
	t.true(is.truthy('🦄'));
	t.true(is.truthy(new Set()));
	t.true(is.truthy(Symbol('🦄')));
	t.true(is.truthy(true));
	t.true(is.truthy(1));
	t.true(is.truthy(1n));
	t.true(is.truthy(BigInt(1)));

	t.notThrows(() => {
		assert.truthy('unicorn');
	});

	t.notThrows(() => {
		assert.truthy('🦄');
	});

	t.notThrows(() => {
		assert.truthy(new Set());
	});

	t.notThrows(() => {
		assert.truthy(Symbol('🦄'));
	});

	t.notThrows(() => {
		assert.truthy(true);
	});

	t.notThrows(() => {
		assert.truthy(1);
	});

	t.notThrows(() => {
		assert.truthy(1n);
	});

	t.notThrows(() => {
		assert.truthy(BigInt(1));
	});

	// Checks that `assert.truthy` narrow downs boolean type to `true`.
	{
		const booleans = [true, false];
		const function_ = (value: true) => value;
		assert.truthy(booleans[0]);
		function_(booleans[0]);
	}

	// Checks that `assert.truthy` excludes zero value from number type.
	{
		const bits: Array<0 | 1> = [1, 0, -0];
		const function_ = (value: 1) => value;
		assert.truthy(bits[0]);
		function_(bits[0]);
	}

	// Checks that `assert.truthy` excludes zero value from bigint type.
	{
		const bits: Array<0n | 1n> = [1n, 0n, -0n];
		const function_ = (value: 1n) => value;
		assert.truthy(bits[0]);
		function_(bits[0]);
	}

	// Checks that `assert.truthy` excludes empty string from string type.
	{
		const strings: Array<'nonEmpty' | ''> = ['nonEmpty', ''];
		const function_ = (value: 'nonEmpty') => value;
		assert.truthy(strings[0]);
		function_(strings[0]);
	}

	// Checks that `assert.truthy` excludes undefined from mixed type.
	{
		const maybeUndefineds = ['🦄', undefined];
		const function_ = (value: string) => value;
		assert.truthy(maybeUndefineds[0]);
		function_(maybeUndefineds[0]);
	}

	// Checks that `assert.truthy` excludes null from mixed type.
	{
		const maybeNulls = ['🦄', null];
		const function_ = (value: string) => value;
		assert.truthy(maybeNulls[0]);
		function_(maybeNulls[0]);
	}
});

test('is.falsy', t => {
	t.true(is.falsy(false));
	t.true(is.falsy(0));
	t.true(is.falsy(''));
	t.true(is.falsy(null));
	t.true(is.falsy(undefined));
	t.true(is.falsy(Number.NaN));
	t.true(is.falsy(0n));
	t.true(is.falsy(BigInt(0)));

	t.notThrows(() => {
		assert.falsy(false);
	});

	t.notThrows(() => {
		assert.falsy(0);
	});

	t.notThrows(() => {
		assert.falsy('');
	});

	t.notThrows(() => {
		assert.falsy(null);
	});

	t.notThrows(() => {
		assert.falsy(undefined);
	});

	t.notThrows(() => {
		assert.falsy(Number.NaN);
	});

	t.notThrows(() => {
		assert.falsy(0n);
	});

	t.notThrows(() => {
		assert.falsy(BigInt(0));
	});

	// Checks that `assert.falsy` narrow downs boolean type to `false`.
	{
		const booleans = [false, true];
		const function_ = (value?: false) => value;
		assert.falsy(booleans[0]);
		function_(booleans[0]);
	}

	// Checks that `assert.falsy` narrow downs number type to `0`.
	{
		const bits = [0, -0, 1];
		const function_ = (value?: 0) => value;
		assert.falsy(bits[0]);
		function_(bits[0]);
		assert.falsy(bits[1]);
		function_(bits[1]);
	}

	// Checks that `assert.falsy` narrow downs bigint type to `0n`.
	{
		const bits = [0n, -0n, 1n];
		const function_ = (value?: 0n) => value;
		assert.falsy(bits[0]);
		function_(bits[0]);
		assert.falsy(bits[1]);
		function_(bits[1]);
	}

	// Checks that `assert.falsy` narrow downs string type to empty string.
	{
		const strings = ['', 'nonEmpty'];
		const function_ = (value?: '') => value;
		assert.falsy(strings[0]);
		function_(strings[0]);
	}

	// Checks that `assert.falsy` can narrow down mixed type to undefined.
	{
		const maybeUndefineds = [undefined, Symbol('🦄')];
		const function_ = (value: undefined) => value;
		assert.falsy(maybeUndefineds[0]);
		function_(maybeUndefineds[0]);
	}

	// Checks that `assert.falsy` can narrow down mixed type to null.
	{
		const maybeNulls = [null, Symbol('🦄')];
		// eslint-disable-next-line @typescript-eslint/ban-types
		const function_ = (value?: null) => value;
		assert.falsy(maybeNulls[0]);
		function_(maybeNulls[0]);
	}
});

test('is.primitive', t => {
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
		t.true(is.primitive(element));
		t.notThrows(() => {
			assert.primitive(element);
		});
	}
});

test('is.integer supplemental', t => {
	t.false(is.integer(1.4));
	t.throws(() => {
		assert.integer(1.4);
	});
});

test('is.safeInteger supplemental', t => {
	t.false(is.safeInteger(2 ** 53));
	t.false(is.safeInteger(-(2 ** 53)));
	t.throws(() => {
		assert.safeInteger(2 ** 53);
	});
	t.throws(() => {
		assert.safeInteger(-(2 ** 53));
	});
});

test('is.iterable', t => {
	t.true(is.iterable(''));
	t.true(is.iterable([]));
	t.true(is.iterable(new Map()));
	t.false(is.iterable(null));
	t.false(is.iterable(undefined));
	t.false(is.iterable(0));
	t.false(is.iterable(Number.NaN));
	t.false(is.iterable(Number.POSITIVE_INFINITY));
	t.false(is.iterable({}));

	t.notThrows(() => {
		assert.iterable('');
	});
	t.notThrows(() => {
		assert.iterable([]);
	});
	t.notThrows(() => {
		assert.iterable(new Map());
	});
	t.throws(() => {
		assert.iterable(null);
	});
	t.throws(() => {
		assert.iterable(undefined);
	});
	t.throws(() => {
		assert.iterable(0);
	});
	t.throws(() => {
		assert.iterable(Number.NaN);
	});
	t.throws(() => {
		assert.iterable(Number.POSITIVE_INFINITY);
	});
	t.throws(() => {
		assert.iterable({});
	});
});

test('is.asyncIterable', t => {
	t.true(is.asyncIterable({
		[Symbol.asyncIterator]() {},
	}));

	t.false(is.asyncIterable(null));
	t.false(is.asyncIterable(undefined));
	t.false(is.asyncIterable(0));
	t.false(is.asyncIterable(Number.NaN));
	t.false(is.asyncIterable(Number.POSITIVE_INFINITY));
	t.false(is.asyncIterable({}));

	t.notThrows(() => {
		assert.asyncIterable({
			[Symbol.asyncIterator]() {},
		});
	});

	t.throws(() => {
		assert.asyncIterable(null);
	});
	t.throws(() => {
		assert.asyncIterable(undefined);
	});
	t.throws(() => {
		assert.asyncIterable(0);
	});
	t.throws(() => {
		assert.asyncIterable(Number.NaN);
	});
	t.throws(() => {
		assert.asyncIterable(Number.POSITIVE_INFINITY);
	});
	t.throws(() => {
		assert.asyncIterable({});
	});
});

test('is.class', t => {
	class Foo {} // eslint-disable-line @typescript-eslint/no-extraneous-class

	const classDeclarations = [
		Foo,
		class Bar extends Foo {},
	];

	for (const classDeclaration of classDeclarations) {
		t.true(is.class(classDeclaration));

		t.notThrows(() => {
			assert.class(classDeclaration);
		});
	}
});

test('is.typedArray', t => {
	const typedArrays: TypedArray[] = [
		new Int8Array(),
		new Uint8Array(),
		new Uint8ClampedArray(),
		new Uint16Array(),
		new Int32Array(),
		new Uint32Array(),
		new Float32Array(),
		new Float64Array(),
		new BigInt64Array(),
		new BigUint64Array(),
	];

	for (const item of typedArrays) {
		t.true(is.typedArray(item));

		t.notThrows(() => {
			assert.typedArray(item);
		});
	}

	t.false(is.typedArray(new ArrayBuffer(1)));
	t.false(is.typedArray([]));
	t.false(is.typedArray({}));

	t.throws(() => {
		assert.typedArray(new ArrayBuffer(1));
	});
	t.throws(() => {
		assert.typedArray([]);
	});
	t.throws(() => {
		assert.typedArray({});
	});
});

test('is.arrayLike', t => {
	(function () {
		t.true(is.arrayLike(arguments)); // eslint-disable-line prefer-rest-params
	})();

	t.true(is.arrayLike([]));
	t.true(is.arrayLike('unicorn'));

	t.false(is.arrayLike({}));
	t.false(is.arrayLike(() => {}));
	t.false(is.arrayLike(new Map()));

	(function () {
		t.notThrows(function () {
			assert.arrayLike(arguments); // eslint-disable-line prefer-rest-params
		});
	})();

	t.notThrows(() => {
		assert.arrayLike([]);
	});
	t.notThrows(() => {
		assert.arrayLike('unicorn');
	});

	t.throws(() => {
		assert.arrayLike({});
	});
	t.throws(() => {
		assert.arrayLike(() => {});
	});
	t.throws(() => {
		assert.arrayLike(new Map());
	});
});

test('is.tupleLike', t => {
	(function () {
		t.false(is.tupleLike(arguments, [])); // eslint-disable-line prefer-rest-params
	})();

	t.true(is.tupleLike([], []));
	t.true(is.tupleLike([1, '2', true, {}, [], undefined, null], [is.number, is.string, is.boolean, is.object, is.array, is.undefined, is.nullOrUndefined]));
	t.false(is.tupleLike('unicorn', [is.string]));

	t.false(is.tupleLike({}, []));
	t.false(is.tupleLike(() => {}, [is.function]));
	t.false(is.tupleLike(new Map(), [is.map]));

	(function () {
		t.throws(function () {
			assert.tupleLike(arguments, []); // eslint-disable-line prefer-rest-params
		});
	})();

	t.notThrows(() => {
		assert.tupleLike([], []);
	});
	t.throws(() => {
		assert.tupleLike('unicorn', [is.string]);
	});

	t.throws(() => {
		assert.tupleLike({}, [is.object]);
	});
	t.throws(() => {
		assert.tupleLike(() => {}, [is.function]);
	});
	t.throws(() => {
		assert.tupleLike(new Map(), [is.map]);
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

		if (is.tupleLike(tuple, [is.number, is.string, is.boolean, is.undefined, is.null])) {
			const numericValue = tuple[0];
			const stringValue = tuple[1];
			const booleanValue = tuple[2];
			const undefinedValue = tuple[3];
			const nullValue = tuple[4];
			expectTypeOf(numericValue).toEqualTypeOf<number>();
			expectTypeOf(stringValue).toEqualTypeOf<string>();
			expectTypeOf(booleanValue).toEqualTypeOf<boolean>();
			expectTypeOf(undefinedValue).toEqualTypeOf<undefined>();
			// eslint-disable-next-line @typescript-eslint/ban-types
			expectTypeOf(nullValue).toEqualTypeOf<null>();
		}
	}
});

test('is.inRange', t => {
	const x = 3;

	t.true(is.inRange(x, [0, 5]));
	t.true(is.inRange(x, [5, 0]));
	t.true(is.inRange(x, [-5, 5]));
	t.true(is.inRange(x, [5, -5]));
	t.false(is.inRange(x, [4, 8]));
	t.true(is.inRange(-7, [-5, -10]));
	t.true(is.inRange(-5, [-5, -10]));
	t.true(is.inRange(-10, [-5, -10]));

	t.true(is.inRange(x, 10));
	t.true(is.inRange(0, 0));
	t.true(is.inRange(-2, -3));
	t.false(is.inRange(x, 2));
	t.false(is.inRange(-3, -2));

	t.throws(() => {
		// @ts-expect-error invalid argument
		is.inRange(0, []);
	});

	t.throws(() => {
		// @ts-expect-error invalid argument
		is.inRange(0, [5]);
	});

	t.throws(() => {
		// @ts-expect-error invalid argument
		is.inRange(0, [1, 2, 3]);
	});

	t.notThrows(() => {
		assert.inRange(x, [0, 5]);
	});

	t.notThrows(() => {
		assert.inRange(x, [5, 0]);
	});

	t.notThrows(() => {
		assert.inRange(x, [-5, 5]);
	});

	t.notThrows(() => {
		assert.inRange(x, [5, -5]);
	});

	t.throws(() => {
		assert.inRange(x, [4, 8]);
	});

	t.notThrows(() => {
		assert.inRange(-7, [-5, -10]);
	});

	t.notThrows(() => {
		assert.inRange(-5, [-5, -10]);
	});

	t.notThrows(() => {
		assert.inRange(-10, [-5, -10]);
	});

	t.notThrows(() => {
		assert.inRange(x, 10);
	});

	t.notThrows(() => {
		assert.inRange(0, 0);
	});

	t.notThrows(() => {
		assert.inRange(-2, -3);
	});

	t.throws(() => {
		assert.inRange(x, 2);
	});

	t.throws(() => {
		assert.inRange(-3, -2);
	});

	t.throws(() => {
		// @ts-expect-error invalid argument
		assert.inRange(0, []);
	});

	t.throws(() => {
		// @ts-expect-error invalid argument
		assert.inRange(0, [5]);
	});

	t.throws(() => {
		// @ts-expect-error invalid argument
		assert.inRange(0, [1, 2, 3]);
	});
});

test('is.htmlElement supplemental', t => {
	t.false(is.htmlElement({nodeType: 1, nodeName: 'div'}));
	t.throws(() => {
		assert.htmlElement({nodeType: 1, nodeName: 'div'});
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
		t.is(is(element), 'HTMLElement');
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
		t.throws(() => {
			assert.htmlElement(element);
		});
	}
});

test('is.evenInteger', t => {
	for (const element of [-6, 2, 4]) {
		t.true(is.evenInteger(element));
		t.notThrows(() => {
			assert.evenInteger(element);
		});
	}

	for (const element of [-3, 1, 5]) {
		t.false(is.evenInteger(element));
		t.throws(() => {
			assert.evenInteger(element);
		});
	}
});

test('is.oddInteger', t => {
	for (const element of [-5, 7, 13]) {
		t.true(is.oddInteger(element));
		t.notThrows(() => {
			assert.oddInteger(element);
		});
	}

	for (const element of [-8, 8, 10]) {
		t.false(is.oddInteger(element));
		t.throws(() => {
			assert.oddInteger(element);
		});
	}
});

test('is.nonEmptyArray', t => {
	t.true(is.nonEmptyArray([1, 2, 3]));
	t.false(is.nonEmptyArray([]));
	t.false(is.nonEmptyArray(new Array())); // eslint-disable-line @typescript-eslint/no-array-constructor

	t.notThrows(() => {
		assert.nonEmptyArray([1, 2, 3]);
	});
	t.throws(() => {
		assert.nonEmptyArray([]);
	});
	t.throws(() => {
		assert.nonEmptyArray(new Array()); // eslint-disable-line @typescript-eslint/no-array-constructor
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

		assert.nonEmptyArray(strings);

		const value = strings[0];
		function_(value);
	}

	{
		const mixed = ['🦄', 'unicorn', 1, 2];
		const function_ = (value: string | number) => value;

		assert.nonEmptyArray(mixed);

		const value = mixed[0];
		function_(value);
	}

	{
		const arrays = [['🦄'], ['unicorn']];
		const function_ = (value: string[]) => value;

		assert.nonEmptyArray(arrays);

		const value = arrays[0];
		function_(value);
	}
});

test('is.emptyString supplemental', t => {
	t.false(is.emptyString('🦄'));
	t.throws(() => {
		assert.emptyString('🦄');
	});
});

test('is.emptyStringOrWhitespace supplemental', t => {
	t.true(is.emptyStringOrWhitespace('  '));
	t.false(is.emptyStringOrWhitespace('🦄'));
	t.false(is.emptyStringOrWhitespace('unicorn'));

	t.notThrows(() => {
		assert.emptyStringOrWhitespace('  ');
	});
	t.throws(() => {
		assert.emptyStringOrWhitespace('🦄');
	});
	t.throws(() => {
		assert.emptyStringOrWhitespace('unicorn');
	});

	let value = 'test'; // eslint-disable-line prefer-const -- can't use `const` here because then it will be inferred as `never` in the `if` block
	if (is.emptyStringOrWhitespace(value)) {
		value.charAt(0); // Should be inferred as `'' | Whitespace` and not `never`
	} else {
		value.charAt(0); // Should be inferred as `string` and not `never`
	}
});

test('is.nonEmptyString', t => {
	t.false(is.nonEmptyString(''));
	t.false(is.nonEmptyString(String()));
	t.true(is.nonEmptyString('🦄'));

	t.throws(() => {
		assert.nonEmptyString('');
	});
	t.throws(() => {
		assert.nonEmptyString(String());
	});
	t.notThrows(() => {
		assert.nonEmptyString('🦄');
	});
});

test('is.nonEmptyStringAndNotWhitespace', t => {
	t.false(is.nonEmptyStringAndNotWhitespace(' '));
	t.true(is.nonEmptyStringAndNotWhitespace('🦄'));

	for (const value of [null, undefined, 5, Number.NaN, {}, []]) {
		t.false(is.nonEmptyStringAndNotWhitespace(value));

		t.throws(() => {
			assert.nonEmptyStringAndNotWhitespace(value);
		});
	}

	t.throws(() => {
		assert.nonEmptyStringAndNotWhitespace('');
	});

	t.notThrows(() => {
		assert.nonEmptyStringAndNotWhitespace('🦄');
	});
});

test('is.emptyObject', t => {
	t.true(is.emptyObject({}));
	t.true(is.emptyObject(new Object())); // eslint-disable-line no-object-constructor
	t.false(is.emptyObject({unicorn: '🦄'}));

	t.notThrows(() => {
		assert.emptyObject({});
	});
	t.notThrows(() => {
		assert.emptyObject(new Object()); // eslint-disable-line no-object-constructor
	});
	t.throws(() => {
		assert.emptyObject({unicorn: '🦄'});
	});
});

test('is.nonEmptyObject', t => {
	const foo = {};
	is.nonEmptyObject(foo);

	t.false(is.nonEmptyObject({}));
	t.false(is.nonEmptyObject(new Object())); // eslint-disable-line no-object-constructor
	t.true(is.nonEmptyObject({unicorn: '🦄'}));

	t.throws(() => {
		assert.nonEmptyObject({});
	});
	t.throws(() => {
		assert.nonEmptyObject(new Object()); // eslint-disable-line no-object-constructor
	});
	t.notThrows(() => {
		assert.nonEmptyObject({unicorn: '🦄'});
	});
});

test('is.nonEmptySet', t => {
	const temporarySet = new Set();
	t.false(is.nonEmptySet(temporarySet));
	t.throws(() => {
		assert.nonEmptySet(temporarySet);
	});

	temporarySet.add(1);
	t.true(is.nonEmptySet(temporarySet));
	t.notThrows(() => {
		assert.nonEmptySet(temporarySet);
	});
});

test('is.nonEmptyMap', t => {
	const temporaryMap = new Map();
	t.false(is.nonEmptyMap(temporaryMap));
	t.throws(() => {
		assert.nonEmptyMap(temporaryMap);
	});

	temporaryMap.set('unicorn', '🦄');
	t.true(is.nonEmptyMap(temporaryMap));
	t.notThrows(() => {
		assert.nonEmptyMap(temporaryMap);
	});
});

test('is.propertyKey', t => {
	t.true(is.propertyKey('key'));
	t.true(is.propertyKey(42));
	t.true(is.propertyKey(Symbol('')));

	t.false(is.propertyKey(null));
	t.false(is.propertyKey(undefined));
	t.false(is.propertyKey(true));
	t.false(is.propertyKey({}));
	t.false(is.propertyKey([]));
	t.false(is.propertyKey(new Map()));
	t.false(is.propertyKey(new Set()));
});

test('is.any', t => {
	t.true(is.any(is.string, {}, true, '🦄'));
	t.true(is.any(is.object, false, {}, 'unicorns'));
	t.false(is.any(is.boolean, '🦄', [], 3));
	t.false(is.any(is.integer, true, 'lol', {}));
	t.true(is.any([is.string, is.number], {}, true, '🦄'));
	t.false(is.any([is.boolean, is.number], 'unicorns', [], new Map()));

	t.throws(() => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		is.any(null as any, true);
	});

	t.throws(() => {
		is.any(is.string);
	});

	t.notThrows(() => {
		assert.any(is.string, {}, true, '🦄');
	});

	t.notThrows(() => {
		assert.any(is.object, false, {}, 'unicorns');
	});

	t.throws(() => {
		assert.any(is.boolean, '🦄', [], 3);
	});

	t.throws(() => {
		assert.any(is.integer, true, 'lol', {});
	});

	t.throws(() => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		assert.any(null as any, true);
	});

	t.throws(() => {
		assert.any(is.string);
	});

	t.throws(() => {
		assert.any(is.string, 1, 2, 3);
	}, {
		// Includes expected type and removes duplicates from received types:
		message: /Expected values which are `string`. Received values of type `number`./,
	});

	t.throws(() => {
		assert.any(is.string, 1, [4]);
	}, {
		// Includes expected type and lists all received types:
		message: /Expected values which are `string`. Received values of types `number` and `Array`./,
	});

	t.throws(() => {
		assert.any([is.string, is.nullOrUndefined], 1);
	}, {
		// Handles array as first argument:
		message: /Expected values which are `string` or `null or undefined`. Received values of type `number`./,
	});

	t.throws(() => {
		assert.any([is.string, is.number, is.boolean], null, undefined, Number.NaN);
	}, {
		// Handles more than 2 expected and received types:
		message: /Expected values which are `string`, `number`, or `boolean`. Received values of types `null`, `undefined`, and `NaN`./,
	});

	t.throws(() => {
		assert.any(() => false, 1);
	}, {
		// Default type assertion message
		message: /Expected values which are `predicate returns truthy for any value`./,
	});
});

test('is.all', t => {
	t.true(is.all(is.object, {}, new Set(), new Map()));
	t.true(is.all(is.boolean, true, false));
	t.false(is.all(is.string, '🦄', []));
	t.false(is.all(is.set, new Map(), {}));

	t.true(is.all(is.array, ['1'], ['2']));

	t.throws(() => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		is.all(null as any, true);
	});

	t.throws(() => {
		is.all(is.string);
	});

	t.notThrows(() => {
		assert.all(is.object, {}, new Set(), new Map());
	});

	t.notThrows(() => {
		assert.all(is.boolean, true, false);
	});

	t.throws(() => {
		assert.all(is.string, '🦄', []);
	});

	t.throws(() => {
		assert.all(is.set, new Map(), {});
	});

	t.throws(() => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		assert.all(null as any, true);
	});

	t.throws(() => {
		assert.all(is.string);
	});

	t.throws(() => {
		assert.all(is.string, 1, 2, 3);
	}, {
		// Includes expected type and removes duplicates from received types:
		message: /Expected values which are `string`. Received values of type `number`./,
	});

	t.throws(() => {
		assert.all(is.string, 1, [4]);
	}, {
		// Includes expected type and lists all received types:
		message: /Expected values which are `string`. Received values of types `number` and `Array`./,
	});

	t.throws(() => {
		assert.all(() => false, 1);
	}, {
		// Default type assertion message
		message: /Expected values which are `predicate returns truthy for all values`./,
	});
});

test('is.formData supplemental', t => {
	const data = new window.FormData();
	t.true(is.formData(data));
	t.false(is.formData({}));
	t.false(is.formData(undefined));
	t.false(is.formData(null));

	t.notThrows(() => {
		assert.formData(data);
	});
	t.throws(() => {
		assert.formData({});
	});
	t.throws(() => {
		assert.formData(undefined);
	});
	t.throws(() => {
		assert.formData(null);
	});
});

test('is.urlSearchParams', t => {
	const searchParameters = new URLSearchParams();
	t.true(is.urlSearchParams(searchParameters));
	t.false(is.urlSearchParams({}));
	t.false(is.urlSearchParams(undefined));
	t.false(is.urlSearchParams(null));

	t.notThrows(() => {
		assert.urlSearchParams(searchParameters);
	});
	t.throws(() => {
		assert.urlSearchParams({});
	});
	t.throws(() => {
		assert.urlSearchParams(undefined);
	});
	t.throws(() => {
		assert.urlSearchParams(null);
	});
});

test('is.validDate', t => {
	t.true(is.validDate(new Date()));
	t.false(is.validDate(new Date('x')));
	t.notThrows(() => {
		assert.validDate(new Date());
	});
	t.throws(() => {
		assert.validDate(new Date('x'));
	});
});

test('is.validLength', t => {
	t.true(is.validLength(1));
	t.true(is.validLength(0));
	t.false(is.validLength(-1));
	t.false(is.validLength(0.1));
	t.notThrows(() => {
		assert.validLength(1);
	});
	t.throws(() => {
		assert.validLength(-1);
	});
});

test('is.whitespaceString', t => {
	t.true(is.whitespaceString(' '));
	t.true(is.whitespaceString('   '));
	t.true(is.whitespaceString(' 　 '));
	t.true(is.whitespaceString('\u3000'));
	t.true(is.whitespaceString('　'));
	t.false(is.whitespaceString(''));
	t.false(is.whitespaceString('-'));
	t.false(is.whitespaceString(' hi '));
});

test('assert', t => {
	// Contrived test showing that TypeScript acknowledges the type assertion in `assert.number()`.
	// Real--world usage includes asserting user input, but here we use a random number/string generator.
	t.plan(2);

	const getNumberOrStringRandomly = (): number | string => {
		const random = Math.random();

		if (random < 0.5) {
			return 'sometimes this function returns text';
		}

		return random;
	};

	const canUseOnlyNumber = (badlyTypedArgument: any): number => {
		// Narrow the type to number, or throw an error at runtime for non-numbers.
		assert.number(badlyTypedArgument);

		// Both the type and runtime value is number.
		return 1000 * badlyTypedArgument;
	};

	const badlyTypedVariable: any = getNumberOrStringRandomly();

	t.true(is.number(badlyTypedVariable) || is.string(badlyTypedVariable));

	// Using try/catch for test purposes only.
	try {
		const result = canUseOnlyNumber(badlyTypedVariable);

		// Got lucky, the input was a number yielding a good result.
		t.true(is.number(result));
	} catch {
		// Assertion was tripped.
		t.true(is.string(badlyTypedVariable));
	}
});

test('custom assertion message', t => {
	const message = 'Custom error message';

	t.throws(() => {
		assert.array(undefined, undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.arrayBuffer(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.arrayLike(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.asyncFunction(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.asyncGenerator(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.asyncGeneratorFunction(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.asyncIterable(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.bigInt64Array(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.bigUint64Array(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.bigint(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.blob(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.boolean(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.boundFunction(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.buffer(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.class(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.dataView(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.date(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.directInstanceOf(undefined, Error, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.emptyArray(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.emptyMap(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.emptyObject(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.emptySet(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.emptyString(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.emptyStringOrWhitespace(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		enum Enum {}
		assert.enumCase('invalid', Enum, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.error(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.evenInteger(33, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.falsy(true, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.float32Array(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.float64Array(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.formData(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.function(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.generator(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.generatorFunction(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.htmlElement(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.inRange(5, [1, 2], message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.infinite(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.int16Array(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.int32Array(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.int8Array(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.integer(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.iterable(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.map(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.nan(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.nativePromise(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.negativeNumber(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.nodeStream(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.nonEmptyArray(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.nonEmptyMap(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.nonEmptyObject(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.nonEmptySet(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.nonEmptyString(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.nonEmptyStringAndNotWhitespace(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.null(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.nullOrUndefined(false, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.number(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.numericString(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.object(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.observable(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.oddInteger(42, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.plainObject(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.positiveNumber(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.primitive([], message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.promise(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.propertyKey(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.regExp(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.safeInteger(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.set(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.sharedArrayBuffer(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.string(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.symbol(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.truthy(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.tupleLike(undefined, [], message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.typedArray(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.uint16Array(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.uint32Array(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.uint8Array(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.uint8ClampedArray(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.undefined(false, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.urlInstance(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.urlSearchParams(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.urlString(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.validDate(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.validLength(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.weakMap(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.weakRef(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.weakSet(undefined, message);
	}, {instanceOf: TypeError, message});

	t.throws(() => {
		assert.whitespaceString(undefined, message);
	}, {instanceOf: TypeError, message});
});
