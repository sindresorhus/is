import fs from 'fs';
import net from 'net';
import Stream from 'stream';
import util from 'util';
import {URL} from 'url';
import tempy from 'tempy';
import test, {ExecutionContext} from 'ava';
import {JSDOM} from 'jsdom';
import {Subject, Observable} from 'rxjs';
import ZenObservable from 'zen-observable';
import is, {TypeName} from '../source';

const isNode10orHigher = Number(process.versions.node.split('.')[0]) >= 10;

class PromiseSubclassFixture<T> extends Promise<T> {}
class ErrorSubclassFixture extends Error {}

const {window} = new JSDOM();
const {document} = window;
const createDomElement = (element: string) => document.createElement(element);

interface Test {
	fixtures: unknown[];

	// Cannot be TypeName because TypeName.GeneratorFunction does not match 'Generator'
	typename?: TypeName | 'Generator';
	is(value: unknown): boolean;
}

const types = new Map<string, Test>([
	['undefined', {
		is: is.undefined,
		fixtures: [
			undefined
		],
		typename: TypeName.undefined
	}],
	['null', {
		is: is.null_,
		fixtures: [
			null
		],
		typename: TypeName.null
	}],
	['string', {
		is: is.string,
		fixtures: [
			'🦄',
			'hello world',
			''
		],
		typename: TypeName.string
	}],
	['emptyString', {
		is: is.emptyString,
		fixtures: [
			'',
			String()
		],
		typename: TypeName.string
	}],
	['number', {
		is: is.number,
		fixtures: [
			6,
			1.4,
			0,
			-0,
			Infinity,
			-Infinity
		],
		typename: TypeName.number
	}],
	['boolean', {
		is: is.boolean,
		fixtures: [
			true, false
		],
		typename: TypeName.boolean
	}],
	['symbol', {
		is: is.symbol,
		fixtures: [
			Symbol('🦄')
		],
		typename: TypeName.symbol
	}],
	['numericString', {
		is: is.numericString,
		fixtures: [
			'5',
			'-3.2',
			'Infinity'
		],
		typename: TypeName.string
	}],
	['array', {
		is: is.array,
		fixtures: [
			[1, 2],
			new Array(2)
		],
		typename: TypeName.Array
	}],
	['emptyArray', {
		is: is.emptyArray,
		fixtures: [
			[],
			new Array() // eslint-disable-line @typescript-eslint/no-array-constructor
		],
		typename: TypeName.Array
	}],
	['function', {
		is: is.function_,
		fixtures: [
			function foo() {}, // eslint-disable-line func-names
			function () {},
			() => {},
			async function () {},
			function * (): unknown {}
		],
		typename: TypeName.Function
	}],
	['buffer', {
		is: is.buffer,
		fixtures: [
			Buffer.from('🦄')
		],
		typename: TypeName.Buffer
	}],
	['object', {
		is: is.object,
		fixtures: [
			{x: 1},
			Object.create({x: 1})
		],
		typename: TypeName.Object
	}],
	['regExp', {
		is: is.regExp,
		fixtures: [
			/\w/,
			new RegExp('\\w')
		],
		typename: TypeName.RegExp
	}],
	['date', {
		is: is.date,
		fixtures: [
			new Date()
		],
		typename: TypeName.Date
	}],
	['error', {
		is: is.error,
		fixtures: [
			new Error('🦄'),
			new ErrorSubclassFixture()
		],
		typename: TypeName.Error
	}],
	['nativePromise', {
		is: is.nativePromise,
		fixtures: [
			Promise.resolve(),
			PromiseSubclassFixture.resolve()
		],
		typename: TypeName.Promise
	}],
	['promise', {
		is: is.promise,
		fixtures: [
			{then() {}, catch() {}}
		],
		typename: TypeName.Object
	}],
	['generator', {
		is: is.generator,
		fixtures: [
			(function * () {
				yield 4;
			})()
		],
		typename: 'Generator'
	}],
	['generatorFunction', {
		is: is.generatorFunction,
		fixtures: [
			function * () {
				yield 4;
			}
		],
		typename: TypeName.Function
	}],
	['asyncFunction', {
		is: is.asyncFunction,
		fixtures: [
			async function () {},
			async () => {}
		],
		typename: TypeName.Function
	}],
	['boundFunction', {
		is: is.boundFunction,
		fixtures: [
			() => {},
			function () {}.bind(null) // eslint-disable-line no-extra-bind
		],
		typename: TypeName.Function
	}],
	['map', {
		is: is.map,
		fixtures: [
			new Map([['one', '1']])
		],
		typename: TypeName.Map
	}],
	['emptyMap', {
		is: is.emptyMap,
		fixtures: [
			new Map()
		],
		typename: TypeName.Map
	}],
	['set', {
		is: is.set,
		fixtures: [
			new Set(['one'])
		],
		typename: TypeName.Set
	}],
	['emptySet', {
		is: is.emptySet,
		fixtures: [
			new Set()
		],
		typename: TypeName.Set
	}],
	['weakSet', {
		is: is.weakSet,
		fixtures: [
			new WeakSet()
		],
		typename: TypeName.WeakSet
	}],
	['weakMap', {
		is: is.weakMap,
		fixtures: [
			new WeakMap()
		],
		typename: TypeName.WeakMap
	}],
	['int8Array', {
		is: is.int8Array,
		fixtures: [
			new Int8Array()
		],
		typename: TypeName.Int8Array
	}],
	['uint8Array', {
		is: is.uint8Array,
		fixtures: [
			new Uint8Array()
		],
		typename: TypeName.Uint8Array
	}],
	['uint8ClampedArray', {
		is: is.uint8ClampedArray,
		fixtures: [
			new Uint8ClampedArray()
		],
		typename: TypeName.Uint8ClampedArray
	}],
	['int16Array', {
		is: is.int16Array,
		fixtures: [
			new Int16Array()
		],
		typename: TypeName.Int16Array
	}],
	['uint16Array', {
		is: is.uint16Array,
		fixtures: [
			new Uint16Array()
		],
		typename: TypeName.Uint16Array
	}],
	['int32Array', {
		is: is.int32Array,
		fixtures: [
			new Int32Array()
		],
		typename: TypeName.Int32Array
	}],
	['uint32Array', {
		is: is.uint32Array,
		fixtures: [
			new Uint32Array()
		],
		typename: TypeName.Uint32Array
	}],
	['float32Array', {
		is: is.float32Array,
		fixtures: [
			new Float32Array()
		],
		typename: TypeName.Float32Array
	}],
	['float64Array', {
		is: is.float64Array,
		fixtures: [
			new Float64Array()
		],
		typename: TypeName.Float64Array
	}],
	['arrayBuffer', {
		is: is.arrayBuffer,
		fixtures: [
			new ArrayBuffer(10)
		],
		typename: TypeName.ArrayBuffer
	}],
	['dataView', {
		is: is.dataView,
		fixtures: [
			new DataView(new ArrayBuffer(10))
		],
		typename: TypeName.DataView
	}],
	['nan', {
		is: is.nan,
		fixtures: [
			NaN,
			Number.NaN
		],
		typename: TypeName.number
	}],
	['nullOrUndefined', {
		is: is.nullOrUndefined,
		fixtures: [
			null,
			undefined
		]
	}],
	['plainObject', {
		is: is.plainObject,
		fixtures: [
			{x: 1},
			Object.create(null),
			new Object() // eslint-disable-line no-new-object
		],
		typename: TypeName.Object
	}],
	['integer', {
		is: is.integer,
		fixtures: [
			6
		],
		typename: TypeName.number
	}],
	['safeInteger', {
		is: is.safeInteger,
		fixtures: [
			(2 ** 53) - 1,
			-(2 ** 53) + 1
		],
		typename: TypeName.number
	}],
	['domElement', {
		is: is.domElement,
		fixtures: [
			'div',
			'input',
			'span',
			'img',
			'canvas',
			'script'
		].map(createDomElement)
	}],
	['non-domElements', {
		is: value => !is.domElement(value),
		fixtures: [
			document.createTextNode('data'),
			document.createProcessingInstruction('xml-stylesheet', 'href="mycss.css" type="text/css"'),
			document.createComment('This is a comment'),
			document,
			document.implementation.createDocumentType('svg:svg', '-//W3C//DTD SVG 1.1//EN', 'https://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'),
			document.createDocumentFragment()
		]
	}],
	['observable', {
		is: is.observable,
		fixtures: [
			new Observable(),
			new Subject(),
			new ZenObservable(() => {})
		],
		typename: TypeName.Observable
	}],
	['nodeStream', {
		is: is.nodeStream,
		fixtures: [
			fs.createReadStream('readme.md'),
			fs.createWriteStream(tempy.file()),
			new net.Socket(),
			new Stream.Duplex(),
			new Stream.PassThrough(),
			new Stream.Readable(),
			new Stream.Transform(),
			new Stream.Stream(),
			new Stream.Writable()
		],
		typename: TypeName.Object
	}],
	['infinite', {
		is: is.infinite,
		fixtures: [
			Infinity,
			-Infinity
		],
		typename: TypeName.number
	}]
]);

// This ensures a certain method matches only the types it's supposed to and none of the other methods' types
const testType = (t: ExecutionContext, type: string, exclude?: string[]) => {
	const testData = types.get(type);

	if (testData === undefined) {
		t.fail(`is.${type} not defined`);

		return;
	}

	const {is: testIs, typename} = testData;

	for (const [key, {fixtures}] of types) {
		// TODO: Automatically exclude value types in other tests that we have in the current one.
		// Could reduce the use of `exclude`.
		if (exclude && exclude.indexOf(key) !== -1) {
			continue;
		}

		const isTypeUnderTest = key === type;
		const assert = isTypeUnderTest ? t.true.bind(t) : t.false.bind(t);

		for (const fixture of fixtures) {
			assert(testIs(fixture), `Value: ${util.inspect(fixture)}`);

			if (isTypeUnderTest && typename) {
				t.is(is(fixture), typename);
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
	testType(t, 'number', ['nan', 'integer', 'safeInteger', 'infinite']);
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
	t.false(is.numericString(1));
});

test('is.array', t => {
	testType(t, 'array', ['emptyArray']);
});

test('is.function', t => {
	testType(t, 'function', ['generatorFunction', 'asyncFunction', 'boundFunction']);
});

test('is.boundFunction', t => {
	t.false(is.boundFunction(function () {})); // eslint-disable-line prefer-arrow-callback
});

test('is.buffer', t => {
	testType(t, 'buffer');
});

test('is.object', t => {
	const testData = types.get('object');

	if (testData === undefined) {
		t.fail('is.object not defined');

		return;
	}

	for (const el of testData.fixtures) {
		t.true(is.object(el));
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
});

test('is.generator', t => {
	testType(t, 'generator');
});

test('is.generatorFunction', t => {
	testType(t, 'generatorFunction', ['function']);
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

test('is.arrayBuffer', t => {
	testType(t, 'arrayBuffer');
});

test('is.dataView', t => {
	testType(t, 'dataView');
});

test('is.directInstanceOf', t => {
	const error = new Error();
	const errorSubclass = new ErrorSubclassFixture();

	t.true(is.directInstanceOf(error, Error));
	t.true(is.directInstanceOf(errorSubclass, ErrorSubclassFixture));

	t.false(is.directInstanceOf(error, ErrorSubclassFixture));
	t.false(is.directInstanceOf(errorSubclass, Error));
});

test('is.urlInstance', t => {
	const url = new URL('https://example.com');
	t.true(is.urlInstance(url));
	t.false(is.urlInstance({}));
	t.false(is.urlInstance(undefined));
	t.false(is.urlInstance(null));
});

test('is.urlString', t => {
	const url = 'https://example.com';
	t.true(is.urlString(url));
	t.false(is.urlString(new URL(url)));
	t.false(is.urlString({}));
	t.false(is.urlString(undefined));
	t.false(is.urlString(null));
});

test('is.truthy', t => {
	t.true(is.truthy('unicorn'));
	t.true(is.truthy('🦄'));
	t.true(is.truthy(new Set()));
	t.true(is.truthy(Symbol('🦄')));
	t.true(is.truthy(true));
});

test('is.falsy', t => {
	t.true(is.falsy(false));
	t.true(is.falsy(0));
	t.true(is.falsy(''));
	t.true(is.falsy(null));
	t.true(is.falsy(undefined));
	t.true(is.falsy(NaN));
});

test('is.nan', t => {
	testType(t, 'nan');
});

test('is.nullOrUndefined', t => {
	testType(t, 'nullOrUndefined', ['undefined', 'null']);
});

test('is.primitive', t => {
	const primitives = [
		undefined,
		null,
		'🦄',
		6,
		Infinity,
		-Infinity,
		true,
		false,
		Symbol('🦄')
	];

	for (const el of primitives) {
		t.true(is.primitive(el));
	}
});

test('is.integer', t => {
	testType(t, 'integer', ['number', 'safeInteger']);
	t.false(is.integer(1.4));
});

test('is.safeInteger', t => {
	testType(t, 'safeInteger', ['number', 'integer']);
	t.false(is.safeInteger(2 ** 53));
	t.false(is.safeInteger(-(2 ** 53)));
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
	t.false(is.iterable(NaN));
	t.false(is.iterable(Infinity));
	t.false(is.iterable({}));
});

if (isNode10orHigher) {
	test('is.asyncIterable', t => {
		t.true(is.asyncIterable({
			[Symbol.asyncIterator]: () => {}
		}));

		t.false(is.asyncIterable(null));
		t.false(is.asyncIterable(undefined));
		t.false(is.asyncIterable(0));
		t.false(is.asyncIterable(NaN));
		t.false(is.asyncIterable(Infinity));
		t.false(is.asyncIterable({}));
	});
}

test('is.class', t => {
	class Foo {} // eslint-disable-line @typescript-eslint/no-extraneous-class

	const classDeclarations = [
		Foo,
		class Bar extends Foo {}
	];

	for (const classDeclaration of classDeclarations) {
		t.true(is.class_(classDeclaration));
	}
});

test('is.typedArray', t => {
	const typedArrays = [
		new Int8Array(),
		new Uint8Array(),
		new Uint8ClampedArray(),
		new Uint16Array(),
		new Int32Array(),
		new Uint32Array(),
		new Float32Array(),
		new Float64Array()
	];

	for (const item of typedArrays) {
		t.true(is.typedArray(item));
	}

	t.false(is.typedArray(new ArrayBuffer(1)));
	t.false(is.typedArray([]));
	t.false(is.typedArray({}));
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
});

test('is.domElement', t => {
	testType(t, 'domElement');
	t.false(is.domElement({nodeType: 1, nodeName: 'div'}));

	t.is(is(createDomElement('div')), 'HTMLDivElement');
	t.is(is(createDomElement('input')), 'HTMLInputElement');
	t.is(is(createDomElement('span')), 'HTMLSpanElement');
	t.is(is(createDomElement('img')), 'HTMLImageElement');
	t.is(is(createDomElement('canvas')), 'HTMLCanvasElement');
	t.is(is(createDomElement('script')), 'HTMLScriptElement');
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
	for (const el of [-6, 2, 4]) {
		t.true(is.evenInteger(el));
	}

	for (const el of [-3, 1, 5]) {
		t.false(is.evenInteger(el));
	}
});

test('is.oddInteger', t => {
	for (const el of [-5, 7, 13]) {
		t.true(is.oddInteger(el));
	}

	for (const el of [-8, 8, 10]) {
		t.false(is.oddInteger(el));
	}
});

test('is.emptyArray', t => {
	testType(t, 'emptyArray');
});

test('is.nonEmptyArray', t => {
	t.true(is.nonEmptyArray([1, 2, 3]));
	t.false(is.nonEmptyArray([]));
	t.false(is.nonEmptyArray(new Array())); // eslint-disable-line @typescript-eslint/no-array-constructor
});

test('is.emptyString', t => {
	testType(t, 'emptyString', ['string']);
	t.false(is.emptyString('🦄'));
});

test('is.nonEmptyString', t => {
	t.false(is.nonEmptyString(''));
	t.false(is.nonEmptyString(String()));
	t.true(is.nonEmptyString('🦄'));
});

test('is.emptyStringOrWhitespace', t => {
	testType(t, 'emptyString', ['string']);
	t.true(is.emptyStringOrWhitespace('  '));
	t.false(is.emptyStringOrWhitespace('🦄'));
	t.false(is.emptyStringOrWhitespace('unicorn'));
});

test('is.emptyObject', t => {
	t.true(is.emptyObject({}));
	t.true(is.emptyObject(new Object())); // eslint-disable-line no-new-object
	t.false(is.emptyObject({unicorn: '🦄'}));
});

test('is.nonEmptyObject', t => {
	const foo = {};
	is.nonEmptyObject(foo);

	t.false(is.nonEmptyObject({}));
	t.false(is.nonEmptyObject(new Object())); // eslint-disable-line no-new-object
	t.true(is.nonEmptyObject({unicorn: '🦄'}));
});

test('is.emptySet', t => {
	testType(t, 'emptySet');
});

test('is.nonEmptySet', t => {
	const tempSet = new Set();
	t.false(is.nonEmptySet(tempSet));

	tempSet.add(1);
	t.true(is.nonEmptySet(tempSet));
});

test('is.emptyMap', t => {
	testType(t, 'emptyMap');
});

test('is.nonEmptyMap', t => {
	const tempMap = new Map();
	t.false(is.nonEmptyMap(tempMap));

	tempMap.set('unicorn', '🦄');
	t.true(is.nonEmptyMap(tempMap));
});

test('is.any', t => {
	t.true(is.any(is.string, {}, true, '🦄'));
	t.true(is.any(is.object, false, {}, 'unicorns'));
	t.false(is.any(is.boolean, '🦄', [], 3));
	t.false(is.any(is.integer, true, 'lol', {}));

	t.throws(() => {
		is.any(null as any, true);
	});

	t.throws(() => {
		is.any(is.string);
	});
});

test('is.all', t => {
	t.true(is.all(is.object, {}, new Set(), new Map()));
	t.true(is.all(is.boolean, true, false));
	t.false(is.all(is.string, '🦄', []));
	t.false(is.all(is.set, new Map(), {}));

	t.throws(() => {
		is.all(null as any, true);
	});

	t.throws(() => {
		is.all(is.string);
	});
});
