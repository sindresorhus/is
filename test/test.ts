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
import ZenObservable from 'zen-observable';
import is, {
	assert,
	AssertionTypeDescription,
	type Primitive,
	type TypedArray,
	type TypeName,
} from '../source/index.js';

class PromiseSubclassFixture<T> extends Promise<T> {}
class ErrorSubclassFixture extends Error {}

const {window} = new JSDOM();
const {document} = window;
const createDomElement = (element: string) => document.createElement(element);

const structuredClone = globalThis.structuredClone ?? (x => x);

type Test = {
	assert: (...args: any[]) => void | never;
	fixtures: unknown[];
	typename?: TypeName;
	typeDescription?: AssertionTypeDescription | TypeName;
	is(value: unknown): boolean;
};

const invertAssertThrow = (description: string, fn: () => void | never, value: unknown): void | never => {
	const expectedAssertErrorMessage = `Expected value which is \`${description}\`, received value of type \`${is(value)}\`.`;

	try {
		fn();
	} catch (error: unknown) {
		if (error instanceof TypeError && error.message.includes(expectedAssertErrorMessage)) {
			return;
		}

		throw error;
	}

	throw new Error(`Function did not throw any error, expected: ${expectedAssertErrorMessage}`);
};

const types = new Map<string, Test>([
	['undefined', {
		is: is.undefined,
		assert: assert.undefined,
		fixtures: [
			undefined,
		],
		typename: 'undefined',
	}],
	['null', {
		is: is.null_,
		assert: assert.null_,
		fixtures: [
			null,
		],
		typename: 'null',
	}],
	['string', {
		is: is.string,
		assert: assert.string,
		fixtures: [
			'🦄',
			'hello world',
			'',
		],
		typename: 'string',
	}],
	['emptyString', {
		is: is.emptyString,
		assert: assert.emptyString,
		fixtures: [
			'',
			String(),
		],
		typename: 'string',
		typeDescription: AssertionTypeDescription.emptyString,
	}],
	['number', {
		is: is.number,
		assert: assert.number,
		fixtures: [
			6,
			1.4,
			0,
			-0,
			Number.POSITIVE_INFINITY,
			Number.NEGATIVE_INFINITY,
		],
		typename: 'number',
	}],
	['bigint', {
		is: is.bigint,
		assert: assert.bigint,
		fixtures: [
			// Disabled until TS supports it for an ESnnnn target.
			// 1n,
			// 0n,
			// -0n,
			BigInt('1234'),
		],
		typename: 'bigint',
	}],
	['boolean', {
		is: is.boolean,
		assert: assert.boolean,
		fixtures: [
			true, false,
		],
		typename: 'boolean',
	}],
	['symbol', {
		is: is.symbol,
		assert: assert.symbol,
		fixtures: [
			Symbol('🦄'),
		],
		typename: 'symbol',
	}],
	['numericString', {
		is: is.numericString,
		assert: assert.numericString,
		fixtures: [
			'5',
			'-3.2',
			'Infinity',
			'0x56',
		],
		typename: 'string',
		typeDescription: AssertionTypeDescription.numericString,
	}],
	['array', {
		is: is.array,
		assert: assert.array,
		fixtures: [
			[1, 2],
			Array.from({length: 2}),
		],
		typename: 'Array',
	}],
	['emptyArray', {
		is: is.emptyArray,
		assert: assert.emptyArray,
		fixtures: [
			[],
			new Array(), // eslint-disable-line @typescript-eslint/no-array-constructor
		],
		typename: 'Array',
		typeDescription: AssertionTypeDescription.emptyArray,
	}],
	['function', {
		is: is.function_,
		assert: assert.function_,
		fixtures: [
			function foo() {}, // eslint-disable-line func-names
			function () {},
			() => {},
			async function () {},
			function * (): unknown {},
			async function * (): unknown {},
		],
		typename: 'Function',
	}],
	['buffer', {
		is: is.buffer,
		assert: assert.buffer,
		fixtures: [
			Buffer.from('🦄'),
		],
		typename: 'Buffer',
	}],
	['blob', {
		is: is.blob,
		assert: assert.blob,
		fixtures: [
			new window.Blob(),
		],
		typename: 'Blob',
	}],
	['object', {
		is: is.object,
		assert: assert.object,
		fixtures: [
			{x: 1},
			Object.create({x: 1}),
		],
		typename: 'Object',
	}],
	['regExp', {
		is: is.regExp,
		assert: assert.regExp,
		fixtures: [
			/\w/,
			new RegExp('\\w'), // eslint-disable-line prefer-regex-literals
		],
		typename: 'RegExp',
	}],
	['date', {
		is: is.date,
		assert: assert.date,
		fixtures: [
			new Date(),
		],
		typename: 'Date',
	}],
	['error', {
		is: is.error,
		assert: assert.error,
		fixtures: [
			new Error('🦄'),
			new ErrorSubclassFixture(),
		],
		typename: 'Error',
	}],
	['nativePromise', {
		is: is.nativePromise,
		assert: assert.nativePromise,
		fixtures: [
			Promise.resolve(),
			PromiseSubclassFixture.resolve(),
		],
		typename: 'Promise',
		typeDescription: AssertionTypeDescription.nativePromise,
	}],
	['promise', {
		is: is.promise,
		assert: assert.promise,
		fixtures: [
			{then() {}, catch() {}}, // eslint-disable-line unicorn/no-thenable
		],
		typename: 'Object',
		typeDescription: 'Promise',
	}],
	['generator', {
		is: is.generator,
		assert: assert.generator,
		fixtures: [
			(function * () {
				yield 4;
			})(),
		],
		typename: 'Generator',
	}],
	['asyncGenerator', {
		is: is.asyncGenerator,
		assert: assert.asyncGenerator,
		fixtures: [
			(async function * () {
				yield 4;
			})(),
		],
		typename: 'AsyncGenerator',
	}],
	['generatorFunction', {
		is: is.generatorFunction,
		assert: assert.generatorFunction,
		fixtures: [
			function * () {
				yield 4;
			},
		],
		typename: 'Function',
		typeDescription: 'GeneratorFunction',
	}],
	['asyncGeneratorFunction', {
		is: is.asyncGeneratorFunction,
		assert: assert.asyncGeneratorFunction,
		fixtures: [
			async function * () {
				yield 4;
			},
		],
		typename: 'Function',
		typeDescription: 'AsyncGeneratorFunction',
	}],
	['asyncFunction', {
		is: is.asyncFunction,
		assert: assert.asyncFunction,
		fixtures: [
			async function () {},
			async () => {},
		],
		typename: 'Function',
		typeDescription: 'AsyncFunction',
	}],
	['boundFunction', {
		is: is.boundFunction,
		assert: assert.boundFunction,
		fixtures: [
			() => {},
			function () {}.bind(null), // eslint-disable-line no-extra-bind
		],
		typename: 'Function',
	}],
	['map', {
		is: is.map,
		assert: assert.map,
		fixtures: [
			new Map([['one', '1']]),
		],
		typename: 'Map',
	}],
	['emptyMap', {
		is: is.emptyMap,
		assert: assert.emptyMap,
		fixtures: [
			new Map(),
		],
		typename: 'Map',
		typeDescription: AssertionTypeDescription.emptyMap,
	}],
	['set', {
		is: is.set,
		assert: assert.set,
		fixtures: [
			new Set(['one']),
		],
		typename: 'Set',
	}],
	['emptySet', {
		is: is.emptySet,
		assert: assert.emptySet,
		fixtures: [
			new Set(),
		],
		typename: 'Set',
		typeDescription: AssertionTypeDescription.emptySet,
	}],
	['weakSet', {
		is: is.weakSet,
		assert: assert.weakSet,
		fixtures: [
			new WeakSet(),
		],
		typename: 'WeakSet',
	}],
	['weakRef', {
		is: is.weakRef,
		assert: assert.weakRef,
		fixtures: window.WeakRef ? [new window.WeakRef({})] : [],
		typename: 'WeakRef',
	}],
	['weakMap', {
		is: is.weakMap,
		assert: assert.weakMap,
		fixtures: [
			new WeakMap(),
		],
		typename: 'WeakMap',
	}],
	['int8Array', {
		is: is.int8Array,
		assert: assert.int8Array,
		fixtures: [
			new Int8Array(),
		],
		typename: 'Int8Array',
	}],
	['uint8Array', {
		is: is.uint8Array,
		assert: assert.uint8Array,
		fixtures: [
			new Uint8Array(),
		],
		typename: 'Uint8Array',
	}],
	['uint8ClampedArray', {
		is: is.uint8ClampedArray,
		assert: assert.uint8ClampedArray,
		fixtures: [
			new Uint8ClampedArray(),
		],
		typename: 'Uint8ClampedArray',
	}],
	['int16Array', {
		is: is.int16Array,
		assert: assert.int16Array,
		fixtures: [
			new Int16Array(),
		],
		typename: 'Int16Array',
	}],
	['uint16Array', {
		is: is.uint16Array,
		assert: assert.uint16Array,
		fixtures: [
			new Uint16Array(),
		],
		typename: 'Uint16Array',
	}],
	['int32Array', {
		is: is.int32Array,
		assert: assert.int32Array,
		fixtures: [
			new Int32Array(),
		],
		typename: 'Int32Array',
	}],
	['uint32Array', {
		is: is.uint32Array,
		assert: assert.uint32Array,
		fixtures: [
			new Uint32Array(),
		],
		typename: 'Uint32Array',
	}],
	['float32Array', {
		is: is.float32Array,
		assert: assert.float32Array,
		fixtures: [
			new Float32Array(),
		],
		typename: 'Float32Array',
	}],
	['float64Array', {
		is: is.float64Array,
		assert: assert.float64Array,
		fixtures: [
			new Float64Array(),
		],
		typename: 'Float64Array',
	}],
	['bigInt64Array', {
		is: is.bigInt64Array,
		assert: assert.bigInt64Array,
		fixtures: [
			new BigInt64Array(),
		],
		typename: 'BigInt64Array',
	}],
	['bigUint64Array', {
		is: is.bigUint64Array,
		assert: assert.bigUint64Array,
		fixtures: [
			new BigUint64Array(),
		],
		typename: 'BigUint64Array',
	}],
	['arrayBuffer', {
		is: is.arrayBuffer,
		assert: assert.arrayBuffer,
		fixtures: [
			new ArrayBuffer(10),
		],
		typename: 'ArrayBuffer',
	}],
	['dataView', {
		is: is.dataView,
		assert: assert.dataView,
		fixtures: [
			new DataView(new ArrayBuffer(10)),
		],
		typename: 'DataView',
	}],
	['nan', {
		is: is.nan,
		assert: assert.nan,
		fixtures: [
			NaN, // eslint-disable-line unicorn/prefer-number-properties
			Number.NaN,
		],
		typename: 'NaN',
		typeDescription: AssertionTypeDescription.nan,
	}],
	['nullOrUndefined', {
		is: is.nullOrUndefined,
		assert: assert.nullOrUndefined,
		fixtures: [
			null,
			undefined,
		],
		typeDescription: AssertionTypeDescription.nullOrUndefined,
	}],
	['plainObject', {
		is: is.plainObject,
		assert: assert.plainObject,
		fixtures: [
			{x: 1},
			Object.create(null),
			new Object(), // eslint-disable-line no-new-object
			structuredClone({x: 1}),
			structuredClone(Object.create(null)),
			structuredClone(new Object()), // eslint-disable-line no-new-object
		],
		typename: 'Object',
		typeDescription: AssertionTypeDescription.plainObject,
	}],
	['integer', {
		is: is.integer,
		assert: assert.integer,
		fixtures: [
			6,
		],
		typename: 'number',
		typeDescription: AssertionTypeDescription.integer,
	}],
	['safeInteger', {
		is: is.safeInteger,
		assert: assert.safeInteger,
		fixtures: [
			(2 ** 53) - 1,
			-(2 ** 53) + 1,
		],
		typename: 'number',
		typeDescription: AssertionTypeDescription.safeInteger,
	}],
	['domElement', {
		is: is.domElement,
		assert: assert.domElement,
		fixtures: [
			'div',
			'input',
			'span',
			'img',
			'canvas',
			'script',
		]
			.map(fixture => createDomElement(fixture)),
		typeDescription: AssertionTypeDescription.domElement,
	}],
	['non-domElements', {
		is: value => !is.domElement(value),
		assert(value: unknown) {
			invertAssertThrow(AssertionTypeDescription.domElement, () => {
				assert.domElement(value);
			}, value);
		},
		fixtures: [
			document.createTextNode('data'),
			document.createProcessingInstruction('xml-stylesheet', 'href="mycss.css" type="text/css"'),
			document.createComment('This is a comment'),
			document,
			document.implementation.createDocumentType('svg:svg', '-//W3C//DTD SVG 1.1//EN', 'https://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'),
			document.createDocumentFragment(),
		],
	}],
	['observable', {
		is: is.observable,
		assert: assert.observable,
		fixtures: [
			new Observable(),
			new Subject(),
			new ZenObservable(() => {}),
		],
		typename: 'Observable',
	}],
	['nodeStream', {
		is: is.nodeStream,
		assert: assert.nodeStream,
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
		typeDescription: AssertionTypeDescription.nodeStream,
	}],
	['infinite', {
		is: is.infinite,
		assert: assert.infinite,
		fixtures: [
			Number.POSITIVE_INFINITY,
			Number.NEGATIVE_INFINITY,
		],
		typename: 'number',
		typeDescription: AssertionTypeDescription.infinite,
	}],
]);

// This ensures a certain method matches only the types it's supposed to and none of the other methods' types
const testType = (t: ExecutionContext, type: string, exclude?: string[]) => {
	const testData = types.get(type);

	if (testData === undefined) {
		t.fail(`is.${type} not defined`);

		return;
	}

	const {is: testIs, assert: testAssert, typename, typeDescription} = testData;

	for (const [key, {fixtures}] of types) {
		// TODO: Automatically exclude value types in other tests that we have in the current one.
		// Could reduce the use of `exclude`.
		if (exclude?.includes(key)) {
			continue;
		}

		const isTypeUnderTest = key === type;
		const assertIs = isTypeUnderTest ? t.true : t.false;

		for (const fixture of fixtures) {
			assertIs(testIs(fixture), `Value: ${inspect(fixture)}`);
			const valueType = typeDescription ?? typename;

			if (isTypeUnderTest) {
				t.notThrows(() => {
					testAssert(fixture);
				});
			} else {
				t.throws(() => {
					testAssert(fixture);
				}, {
					message: `Expected value which is \`${valueType as string}\`, received value of type \`${is(fixture)}\`.`,
				});
			}

			if (isTypeUnderTest && typename) {
				t.is<TypeName>(is(fixture), typename);
			}
		}
	}
};

test('is.undefined', t => {
	testType(t, 'undefined', ['nullOrUndefined']);
});

test('is.null', t => {
	testType(t, 'null', ['nullOrUndefined']);
});

test('is.string', t => {
	testType(t, 'string', ['emptyString', 'numericString']);
});

test('is.number', t => {
	testType(t, 'number', ['integer', 'safeInteger', 'infinite']);
});

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

test('is.bigint', t => {
	testType(t, 'bigint');
});

test('is.boolean', t => {
	testType(t, 'boolean');
});

test('is.symbol', t => {
	testType(t, 'symbol');
});

test('is.numericString', t => {
	testType(t, 'numericString');
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

test('is.array', t => {
	testType(t, 'array', ['emptyArray']);

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
		x[0].toFixed(0);
	});

	t.notThrows(() => {
		const x: unknown[] = [1, 2, 3];
		if (is.array<number>(x, is.number)) {
			x[0].toFixed(0);
		}
	});
});

test('is.function', t => {
	testType(t, 'function', ['generatorFunction', 'asyncGeneratorFunction', 'asyncFunction', 'boundFunction']);
});

test('is.boundFunction', t => {
	t.false(is.boundFunction(function () {})); // eslint-disable-line prefer-arrow-callback

	t.throws(() => {
		assert.boundFunction(function () {}); // eslint-disable-line prefer-arrow-callback
	});
});

test('is.buffer', t => {
	testType(t, 'buffer');
});

test('is.blob', t => {
	testType(t, 'blob');
});

test('is.object', t => {
	const testData = types.get('object');

	if (testData === undefined) {
		t.fail('is.object not defined');

		return;
	}

	for (const element of testData.fixtures) {
		t.true(is.object(element));
		t.notThrows(() => {
			assert.object(element);
		});
	}
});

test('is.regExp', t => {
	testType(t, 'regExp');
});

test('is.date', t => {
	testType(t, 'date');
});

test('is.error', t => {
	testType(t, 'error');
});

test('is.nativePromise', t => {
	testType(t, 'nativePromise');
});

test('is.promise', t => {
	testType(t, 'promise', ['nativePromise']);
});

test('is.asyncFunction', t => {
	testType(t, 'asyncFunction', ['function']);

	const fixture = async () => {};
	if (is.asyncFunction(fixture)) {
		t.true(is.function_(fixture().then));

		t.notThrows(() => {
			assert.function_(fixture().then);
		});
	}
});

test('is.generator', t => {
	testType(t, 'generator');
});

test('is.asyncGenerator', t => {
	testType(t, 'asyncGenerator');

	const fixture = (async function * () {
		yield 4;
	})();
	if (is.asyncGenerator(fixture)) {
		t.true(is.function_(fixture.next));
	}
});

test('is.generatorFunction', t => {
	testType(t, 'generatorFunction', ['function']);
});

test('is.asyncGeneratorFunction', t => {
	testType(t, 'asyncGeneratorFunction', ['function']);

	const fixture = async function * () {
		yield 4;
	};

	if (is.asyncGeneratorFunction(fixture)) {
		t.true(is.function_(fixture().next));
	}
});

test('is.map', t => {
	testType(t, 'map', ['emptyMap']);
});

test('is.set', t => {
	testType(t, 'set', ['emptySet']);
});

test('is.weakMap', t => {
	testType(t, 'weakMap');
});

test('is.weakSet', t => {
	testType(t, 'weakSet');
});

test('is.weakRef', t => {
	testType(t, 'weakRef');
});

test('is.int8Array', t => {
	testType(t, 'int8Array');
});

test('is.uint8Array', t => {
	testType(t, 'uint8Array', ['buffer']);
});

test('is.uint8ClampedArray', t => {
	testType(t, 'uint8ClampedArray');
});

test('is.int16Array', t => {
	testType(t, 'int16Array');
});

test('is.uint16Array', t => {
	testType(t, 'uint16Array');
});

test('is.int32Array', t => {
	testType(t, 'int32Array');
});

test('is.uint32Array', t => {
	testType(t, 'uint32Array');
});

test('is.float32Array', t => {
	testType(t, 'float32Array');
});

test('is.float64Array', t => {
	testType(t, 'float64Array');
});

test('is.bigInt64Array', t => {
	testType(t, 'bigInt64Array');
});

test('is.bigUint64Array', t => {
	testType(t, 'bigUint64Array');
});

test('is.arrayBuffer', t => {
	testType(t, 'arrayBuffer');
});

test('is.dataView', t => {
	testType(t, 'dataView');
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
	// Disabled until TS supports it for an ESnnnn target.
	// t.true(is.truthy(1n));
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
		const function_ = (value: false) => value;
		assert.falsy(booleans[0]);
		function_(booleans[0]);
	}

	// Checks that `assert.falsy` narrow downs number type to `0`.
	{
		const bits = [0, -0, 1];
		const function_ = (value: 0) => value;
		assert.falsy(bits[0]);
		function_(bits[0]);
		assert.falsy(bits[1]);
		function_(bits[1]);
	}

	// Checks that `assert.falsy` narrow downs bigint type to `0n`.
	{
		const bits = [0n, -0n, 1n];
		const function_ = (value: 0n) => value;
		assert.falsy(bits[0]);
		function_(bits[0]);
		assert.falsy(bits[1]);
		function_(bits[1]);
	}

	// Checks that `assert.falsy` narrow downs string type to empty string.
	{
		const strings = ['', 'nonEmpty'];
		const function_ = (value: '') => value;
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
		const function_ = (value: null) => value;
		assert.falsy(maybeNulls[0]);
		function_(maybeNulls[0]);
	}
});

test('is.nan', t => {
	testType(t, 'nan');
});

test('is.nullOrUndefined', t => {
	testType(t, 'nullOrUndefined', ['undefined', 'null']);
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
		// Disabled until TS supports it for an ESnnnn target.
		// 6n
	];

	for (const element of primitives) {
		t.true(is.primitive(element));
		t.notThrows(() => {
			assert.primitive(element);
		});
	}
});

test('is.integer', t => {
	testType(t, 'integer', ['number', 'safeInteger']);
	t.false(is.integer(1.4));
	t.throws(() => {
		assert.integer(1.4);
	});
});

test('is.safeInteger', t => {
	testType(t, 'safeInteger', ['number', 'integer']);
	t.false(is.safeInteger(2 ** 53));
	t.false(is.safeInteger(-(2 ** 53)));
	t.throws(() => {
		assert.safeInteger(2 ** 53);
	});
	t.throws(() => {
		assert.safeInteger(-(2 ** 53));
	});
});

test('is.plainObject', t => {
	testType(t, 'plainObject', ['object', 'promise']);
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
		t.true(is.class_(classDeclaration));

		t.notThrows(() => {
			assert.class_(classDeclaration);
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
		is.inRange(0, []);
	});

	t.throws(() => {
		is.inRange(0, [5]);
	});

	t.throws(() => {
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
		assert.inRange(0, []);
	});

	t.throws(() => {
		assert.inRange(0, [5]);
	});

	t.throws(() => {
		assert.inRange(0, [1, 2, 3]);
	});
});

test('is.domElement', t => {
	testType(t, 'domElement');
	t.false(is.domElement({nodeType: 1, nodeName: 'div'}));
	t.throws(() => {
		assert.domElement({nodeType: 1, nodeName: 'div'});
	});

	const tagNames = [
		'div',
		'input',
		'span',
		'img',
		'canvas',
		'script',
	];

	for (const tagName of tagNames) {
		const domElement = createDomElement(tagName);
		t.is(is(domElement), 'HTMLElement');
	}
});

test('is.observable', t => {
	testType(t, 'observable');
});

test('is.nodeStream', t => {
	testType(t, 'nodeStream');
});

test('is.infinite', t => {
	testType(t, 'infinite', ['number']);
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

test('is.emptyArray', t => {
	testType(t, 'emptyArray');
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
		const strings = ['🦄', 'unicorn'];
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
		const strings = ['🦄', 'unicorn'];
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

test('is.emptyString', t => {
	testType(t, 'emptyString', ['string']);
	t.false(is.emptyString('🦄'));
	t.throws(() => {
		assert.emptyString('🦄');
	});
});

test('is.emptyStringOrWhitespace', t => {
	testType(t, 'emptyString', ['string']);
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
	t.true(is.emptyObject(new Object())); // eslint-disable-line no-new-object
	t.false(is.emptyObject({unicorn: '🦄'}));

	t.notThrows(() => {
		assert.emptyObject({});
	});
	t.notThrows(() => {
		assert.emptyObject(new Object()); // eslint-disable-line no-new-object
	});
	t.throws(() => {
		assert.emptyObject({unicorn: '🦄'});
	});
});

test('is.nonEmptyObject', t => {
	const foo = {};
	is.nonEmptyObject(foo);

	t.false(is.nonEmptyObject({}));
	t.false(is.nonEmptyObject(new Object())); // eslint-disable-line no-new-object
	t.true(is.nonEmptyObject({unicorn: '🦄'}));

	t.throws(() => {
		assert.nonEmptyObject({});
	});
	t.throws(() => {
		assert.nonEmptyObject(new Object()); // eslint-disable-line no-new-object
	});
	t.notThrows(() => {
		assert.nonEmptyObject({unicorn: '🦄'});
	});
});

test('is.emptySet', t => {
	testType(t, 'emptySet');
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

test('is.emptyMap', t => {
	testType(t, 'emptyMap');
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
		// Removes duplicates:
		message: /received values of types `number`./,
	});

	t.throws(() => {
		assert.any(is.string, 1, [4]);
	}, {
		// Lists all types:
		message: /received values of types `number`, `Array`./,
	});

	t.throws(() => {
		assert.any([is.string, is.nullOrUndefined], 1);
	}, {
		// Handles array as first argument:
		message: /received values of types `number`./,
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
		// Removes duplicates:
		message: /received values of types `number`./,
	});

	t.throws(() => {
		assert.all(is.string, 1, [4]);
	}, {
		// Lists all types:
		message: /received values of types `number`, `Array`./,
	});
});

test('is.formData', t => {
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
