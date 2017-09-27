import util from 'util';
import test from 'ava';
import m from '.';

const isNode8orHigher = Number(process.versions.node.split('.')[0]) >= 8;

const PromiseSubclassFixture = class extends Promise {};
const ErrorSubclassFixture = class extends Error {};

const types = new Map([
	['undefined', undefined],
	['null', null],
	['string', [
		'🦄',
		'hello world',
		''
	]],
	['number', [
		6,
		1.4,
		0,
		-0,
		Infinity,
		-Infinity
	]],
	['boolean', [
		true,
		false
	]],
	['symbol', Symbol('🦄')],
	['array', [
		[1, 2],
		new Array(2)
	]],
	['function', [
		function foo() {}, // eslint-disable-line func-names
		function () {},
		() => {},
		async function () {},
		function * () {}
	]],
	['buffer', Buffer.from('🦄')],
	['object', [
		{x: 1},
		Object.create({x: 1})
	]],
	['regExp', [
		/\w/,
		new RegExp('\\w')
	]],
	['date', new Date()],
	['error', [
		new Error('🦄'),
		new ErrorSubclassFixture()
	]],
	['nativePromise', [
		Promise.resolve(),
		PromiseSubclassFixture.resolve()
	]],
	['promise', {then() {}, catch() {}}],
	['map', new Map()],
	['set', new Set()],
	['weakMap', new WeakMap()],
	['int8Array', new Int8Array()],
	['uint8Array', new Uint8Array()],
	['uint8ClampedArray', new Uint8ClampedArray()],
	['uint16Array', new Uint16Array()],
	['int32Array', new Int32Array()],
	['uint32Array', new Uint32Array()],
	['float32Array', new Float32Array()],
	['float64Array', new Float64Array()],
	['arrayBuffer', new ArrayBuffer(10)],
	['nan', [
		NaN,
		Number.NaN
	]],
	['nullOrUndefined', [
		null,
		undefined
	]],
	['plainObject', [
		{x: 1},
		Object.create(null),
		new Object() // eslint-disable-line no-new-object
	]],
	['integer', 6]
]);

// This ensure a certain method matches only the types
// it's supposed to and none of the other methods' types
const testType = (t, type, exclude) => {
	for (const [key, value] of types) {
		// TODO: Automatically exclude value types in other tests that we have in the current one.
		// Could reduce the use of `exclude`.
		if (exclude && exclude.indexOf(key) !== -1) {
			continue;
		}

		const assert = key === type ? t.true.bind(t) : t.false.bind(t);
		const is = m[type];
		const fixtures = Array.isArray(value) ? value : [value];

		for (const fixture of fixtures) {
			assert(is(fixture), `Value: ${util.inspect(fixture)}`);
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
	testType(t, 'string');
});

test('is.number', t => {
	testType(t, 'number', ['nan', 'integer']);
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
	testType(t, 'function');
});

test('is.buffer', t => {
	testType(t, 'buffer');
});

test('is.object', t => {
	for (const el of types.get('object')) {
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
}

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
	testType(t, 'arrayBuffer');
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
	testType(t, 'integer', ['number']);
	t.false(m.integer(1.4));
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

test('is.class', t => {
	class Foo {}
	const classDeclarations = [
		Foo,
		class Bar extends Foo {}
	];

	for (const x of classDeclarations) {
		t.true(m.class(x));
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

	for (const el of typedArrays) {
		t.true(m.typedArray(el));
	}

	t.false(m.typedArray(new ArrayBuffer(1)));
	t.false(m.typedArray([]));
	t.false(m.typedArray({}));
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
		m.inRange(0)
	});

	t.throws(() => {
		m.inRange(0, [5])
	});
});
