import fs from 'fs';
import net from 'net';
import Stream from 'stream';
import util from 'util';
import tempy from 'tempy';
import test, {TestContext, Context} from 'ava';
import {JSDOM} from 'jsdom';
import {Subject, Observable} from 'rxjs';
import ZenObservable from 'zen-observable';
import m from '..';

const isNode8orHigher = Number(process.versions.node.split('.')[0]) >= 8;
const isNode10orHigher = Number(process.versions.node.split('.')[0]) >= 10;

class PromiseSubclassFixture<T> extends Promise<T> {}
class ErrorSubclassFixture extends Error {}

const {window} = new JSDOM();
const {document} = window;
const createDomElement = (el: string) => document.createElement(el);

interface Test {
	is(value: any): boolean;
	fixtures: any[];
}

const types = new Map<string, Test>([
	['undefined', {
		is: m.undefined,
		fixtures: [
			undefined
		]
	}],
	['null', {
		is: m.null_,
		fixtures: [
			null
		]
	}],
	['string', {
		is: m.string,
		fixtures: [
			'🦄',
			'hello world',
			''
		]
	}],
	['number', {
		is: m.number,
		fixtures: [
			6,
			1.4,
			0,
			-0,
			Infinity,
			-Infinity
		]
	}],
	['boolean', {
		is: m.boolean,
		fixtures: [
			true, false
		]
	}],
	['symbol', {
		is: m.symbol,
		fixtures: [
			Symbol('🦄')
		]
	}],
	['array', {
		is: m.array,
		fixtures: [
			[1, 2],
			new Array(2) // tslint:disable-line:prefer-array-literal
		]
	}],
	['function', {
		is: m.function_,
		fixtures: [
			// tslint:disable:no-unused no-empty no-unused-variable only-arrow-functions no-function-expression
			function foo() {},
			function () {},
			() => {},
			async function () {},
			function * (): any {}
			// tslint:enable:no-unused no-empty no-unused-variable only-arrow-functions no-function-expression
		]
	}],
	['buffer', {
		is: m.buffer,
		fixtures: [
			Buffer.from('🦄')
		]
	}],
	['object', {
		is: m.object,
		fixtures: [
			{x: 1},
			Object.create({x: 1})
		]
	}],
	['regExp', {
		is: m.regExp,
		fixtures: [
			/\w/,
			new RegExp('\\w')
		]
	}],
	['date', {
		is: m.date,
		fixtures: [
			new Date()
		]
	}],
	['error', {
		is: m.error,
		fixtures: [
			new Error('🦄'),
			new ErrorSubclassFixture()
		]
	}],
	['nativePromise', {
		is: m.nativePromise,
		fixtures: [
			Promise.resolve(),
			PromiseSubclassFixture.resolve()
		]
	}],
	['promise', {
		is: m.promise,
		fixtures: [
			{then() {}, catch() {}} // tslint:disable-line:no-empty
		]
	}],
	['generator', {
		is: m.generator,
		fixtures: [
			(function * () {
				yield 4;
			})()
		]
	}],
	['generatorFunction', {
		is: m.generatorFunction,
		fixtures: [
			function * () {
				yield 4;
			}
		]
	}],
	['asyncFunction', {
		is: m.asyncFunction,
		fixtures: [
			async function () {}, // tslint:disable-line:no-empty only-arrow-functions no-function-expression
			async () => {} // tslint:disable-line:no-empty
		]
	}],
	['boundFunction', {
		is: m.boundFunction,
		fixtures: [
			() => {}, // tslint:disable-line:no-empty
			function () {}.bind(null), // tslint:disable-line:no-empty only-arrow-functions
		]
	}],
	['map', {
		is: m.map,
		fixtures: [
			new Map()
		]
	}],
	['set', {
		is: m.set,
		fixtures: [
			new Set()
		]
	}],
	['weakSet', {
		is: m.weakSet,
		fixtures: [
			new WeakSet()
		]
	}],
	['weakMap', {
		is: m.weakMap,
		fixtures: [
			new WeakMap()
		]
	}],
	['int8Array', {
		is: m.int8Array,
		fixtures: [
			new Int8Array(0)
		]
	}],
	['uint8Array', {
		is: m.uint8Array,
		fixtures: [
			new Uint8Array(0)
		]
	}],
	['uint8ClampedArray', {
		is: m.uint8ClampedArray,
		fixtures: [
			new Uint8ClampedArray(0)
		]
	}],
	['int16Array', {
		is: m.int16Array,
		fixtures: [
			new Int16Array(0)
		]
	}],
	['uint16Array', {
		is: m.uint16Array,
		fixtures: [
			new Uint16Array(0)
		]
	}],
	['int32Array', {
		is: m.int32Array,
		fixtures: [
			new Int32Array(0)
		]
	}],
	['uint32Array', {
		is: m.uint32Array,
		fixtures: [
			new Uint32Array(0)
		]
	}],
	['float32Array', {
		is: m.float32Array,
		fixtures: [
			new Float32Array(0)
		]
	}],
	['float64Array', {
		is: m.float64Array,
		fixtures: [
			new Float64Array(0)
		]
	}],
	['arrayBuffer', {
		is: m.arrayBuffer,
		fixtures: [
			new ArrayBuffer(10)
		]
	}],
	['dataView', {
		is: m.dataView,
		fixtures: [
			new DataView(new ArrayBuffer(10))
		]
	}],
	['nan', {
		is: m.nan,
		fixtures: [
			NaN,
			Number.NaN
		]
	}],
	['nullOrUndefined', {
		is: m.nullOrUndefined,
		fixtures: [
			null,
			undefined
		]
	}],
	['plainObject', {
		is: m.plainObject,
		fixtures: [
			{x: 1},
			Object.create(null),
			new Object()
		]
	}],
	['integer', {
		is: m.integer,
		fixtures: [
			6
		]
	}],
	['safeInteger', {
		is: m.safeInteger,
		fixtures: [
			Math.pow(2, 53) - 1,
			-Math.pow(2, 53) + 1
		]
	}],
	['domElement', {
		is: m.domElement,
		fixtures: [
			'div',
			'input',
			'span',
			'img',
			'canvas',
			'script'
		].map(createDomElement) }
	],
	['non-domElements', {
		is: value => !m.domElement(value),
		fixtures: [
			document.createTextNode('data'),
			document.createProcessingInstruction('xml-stylesheet', 'href="mycss.css" type="text/css"'),
			document.createComment('This is a comment'),
			document,
			document.implementation.createDocumentType('svg:svg', '-//W3C//DTD SVG 1.1//EN', 'https://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'),
			document.createDocumentFragment()
		]
	}],
	['nodeStream', {
		is: m.nodeStream,
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
		]
	}],
	['observable', {
		is: m.observable,
		fixtures: [
			new Observable(),
			new Subject(),
			new ZenObservable(() => {})	// tslint:disable-line:no-empty
		]
	}],
	['infinite', {
		is: m.infinite,
		fixtures: [
			Infinity,
			-Infinity
		]
	}]
]);

// This ensures a certain method matches only the types it's supposed to and none of the other methods' types
const testType = (t: TestContext & Context<any>, type: string, exclude?: string[]) => {
	const testData = types.get(type);

	if (testData === undefined) {
		t.fail(`is.${type} not defined`);

		return;
	}

	const {is} = testData;

	for (const [key, {fixtures}] of types) {
		// TODO: Automatically exclude value types in other tests that we have in the current one.
		// Could reduce the use of `exclude`.
		if (exclude && exclude.indexOf(key) !== -1) {
			continue;
		}

		const assert = key === type ? t.true.bind(t) : t.false.bind(t);

		for (const fixture of fixtures) {
			assert(is(fixture), `Value: ${util.inspect(fixture)}`);
		}
	}
};

test('is', t => {
	t.is(m(null), 'null');
	t.is(m(undefined), 'undefined');

	// TODO: Expand this to all the supported types. Maybe reuse `testType()` somehow.
});

test('is.undefined', t => {
	testType(t, 'undefined', ['nullOrUndefined']);
});

test('is.null', t => {
	testType(t, 'null', ['nullOrUndefined']);
});

test('is.string', t => {
	testType(t, 'string');
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

test('is.array', t => {
	testType(t, 'array');
});

test('is.function', t => {
	testType(t, 'function', ['generatorFunction', 'asyncFunction', 'boundFunction']);
});

test('is.boundFunction', t => {
	t.false(m.boundFunction(function () {})); // tslint:disable-line:no-empty only-arrow-functions
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
		t.true(m.object(el));
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

if (isNode8orHigher) {
	test('is.nativePromise', t => {
		testType(t, 'nativePromise');
	});

	test('is.promise', t => {
		testType(t, 'promise', ['nativePromise']);
	});

	/*test('is.asyncFunction', t => {
		testType(t, 'asyncFunction', ['function']);
	});*/
}

test('is.generator', t => {
	testType(t, 'generator');
});

test('is.generatorFunction', t => {
	testType(t, 'generatorFunction', ['function']);
});

test('is.map', t => {
	testType(t, 'map');
});

test('is.set', t => {
	testType(t, 'set');
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

	t.true(m.directInstanceOf(error, Error));
	t.true(m.directInstanceOf(errorSubclass, ErrorSubclassFixture));

	t.false(m.directInstanceOf(error, ErrorSubclassFixture));
	t.false(m.directInstanceOf(errorSubclass, Error));
});

test('is.truthy', t => {
	t.true(m.truthy('unicorn'));
	t.true(m.truthy('🦄'));
	t.true(m.truthy(new Set()));
	t.true(m.truthy(Symbol('🦄')));
	t.true(m.truthy(true));
});

test('is.falsy', t => {
	t.true(m.falsy(false));
	t.true(m.falsy(0));
	t.true(m.falsy(''));
	t.true(m.falsy(null));
	t.true(m.falsy(undefined));
	t.true(m.falsy(NaN));
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
		t.true(m.primitive(el));
	}
});

test('is.integer', t => {
	testType(t, 'integer', ['number', 'safeInteger']);
	t.false(m.integer(1.4));
});

test('is.safeInteger', t => {
	testType(t, 'safeInteger', ['number', 'integer']);
	t.false(m.safeInteger(Math.pow(2, 53)));
	t.false(m.safeInteger(-Math.pow(2, 53)));
});

test('is.plainObject', t => {
	testType(t, 'plainObject', ['object', 'promise']);
});

test('is.iterable', t => {
	t.true(m.iterable(''));
	t.true(m.iterable([]));
	t.true(m.iterable(new Map()));
	t.false(m.iterable(null));
	t.false(m.iterable(undefined));
	t.false(m.iterable(0));
	t.false(m.iterable(NaN));
	t.false(m.iterable(Infinity));
	t.false(m.iterable({}));
});

if (isNode10orHigher) {
	test('is.asyncIterable', t => {
		t.true(m.asyncIterable({
			[Symbol.asyncIterator]: () => {} // tslint:disable-line:no-empty
		}));

		t.false(m.asyncIterable(null));
		t.false(m.asyncIterable(undefined));
		t.false(m.asyncIterable(0));
		t.false(m.asyncIterable(NaN));
		t.false(m.asyncIterable(Infinity));
		t.false(m.asyncIterable({}));
	});
}

test('is.class', t => {
	class Foo {} // tslint:disable-line
	const classDeclarations = [
		Foo,
		class Bar extends Foo {} // tslint:disable-line
	];

	for (const x of classDeclarations) {
		t.true(m.class_(x));
	}
});

test('is.typedArray', t => {
	// Typescript currently does not support empty constructors for these
	// See https://github.com/Microsoft/TypeScript/issues/19680
	const typedArrays = [
		new Int8Array(0),
		new Uint8Array(0),
		new Uint8ClampedArray(0),
		new Uint16Array(0),
		new Int32Array(0),
		new Uint32Array(0),
		new Float32Array(0),
		new Float64Array(0)
	];

	for (const el of typedArrays) {
		t.true(m.typedArray(el));
	}

	t.false(m.typedArray(new ArrayBuffer(1)));
	t.false(m.typedArray([]));
	t.false(m.typedArray({}));
});

test('is.arrayLike', t => {
	(function () { // tslint:disable-line:only-arrow-functions
		t.true(m.arrayLike(arguments));
	})();
	t.true(m.arrayLike([]));
	t.true(m.arrayLike('unicorn'));

	t.false(m.arrayLike({}));
	t.false(m.arrayLike(() => {})); // tslint:disable-line:no-empty
	t.false(m.arrayLike(new Map()));
});

test('is.inRange', t => {
	const x = 3;

	t.true(m.inRange(x, [0, 5]));
	t.true(m.inRange(x, [5, 0]));
	t.true(m.inRange(x, [-5, 5]));
	t.true(m.inRange(x, [5, -5]));
	t.false(m.inRange(x, [4, 8]));
	t.true(m.inRange(-7, [-5, -10]));
	t.true(m.inRange(-5, [-5, -10]));
	t.true(m.inRange(-10, [-5, -10]));

	t.true(m.inRange(x, 10));
	t.true(m.inRange(0, 0));
	t.true(m.inRange(-2, -3));
	t.false(m.inRange(x, 2));
	t.false(m.inRange(-3, -2));

	t.throws(() => {
		m.inRange(0, []);
	});

	t.throws(() => {
		m.inRange(0, [5]);
	});

	t.throws(() => {
		m.inRange(0, [1, 2, 3]);
	});
});

test('is.domElement', t => {
	testType(t, 'domElement');
	t.false(m.domElement({nodeType: 1, nodeName: 'div'}));
});

test('is.nodeStream', t => {
	testType(t, 'nodeStream');
});

test('is.infinite', t => {
	testType(t, 'infinite', ['number']);
});

test('is.even', t => {
	for (const el of [-6, 2, 4]) {
		t.true(m.even(el));
	}

	for (const el of [-3, 1, 5]) {
		t.false(m.even(el));
	}
});

test('is.odd', t => {
	for (const el of [-5, 7, 13]) {
		t.true(m.odd(el));
	}

	for (const el of [-8, 8, 10]) {
		t.false(m.odd(el));
	}
});

test('is.empty', t => {
	t.true(m.empty(null));
	t.true(m.empty(undefined));

	t.true(m.empty(false));
	t.false(m.empty(true));

	t.true(m.empty(''));
	t.false(m.empty('🦄'));

	t.true(m.empty([]));
	t.false(m.empty(['🦄']));

	t.true(m.empty({}));
	t.false(m.empty({unicorn: '🦄'}));

	const tempMap = new Map();
	t.true(m.empty(tempMap));

	tempMap.set('unicorn', '🦄');
	t.false(m.empty(tempMap));

	const tempSet = new Set();
	t.true(m.empty(tempSet));

	tempSet.add(1);
	t.false(m.empty(tempSet));
});

test('is.emptyOrWhitespace', t => {
	t.true(m.emptyOrWhitespace(''));
	t.true(m.emptyOrWhitespace('  '));
	t.false(m.emptyOrWhitespace('🦄'));
	t.false(m.emptyOrWhitespace('unicorn'));
});

test('is.any', t => {
	t.true(m.any(m.string, {}, true, '🦄'));
	t.true(m.any(m.object, false, {}, 'unicorns'));
	t.false(m.any(m.boolean, '🦄', [], 3));
	t.false(m.any(m.integer, true, 'lol', {}));

	t.throws(() => {
		m.any(null, true);
	});

	t.throws(() => {
		m.any(m.string);
	});
});

test('is.all', t => {
	t.true(m.all(m.object, {}, new Set(), new Map()));
	t.true(m.all(m.boolean, true, false));
	t.false(m.all(m.string, '🦄', []));
	t.false(m.all(m.set, new Map(), {}));

	t.throws(() => {
		m.all(null, true);
	});

	t.throws(() => {
		m.all(m.string);
	});
});
