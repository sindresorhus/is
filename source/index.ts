import type {Buffer} from 'node:buffer';
import type {
	ArrayLike,
	Class,
	Falsy,
	NodeStream,
	NonEmptyString,
	ObservableLike,
	Predicate,
	Primitive,
	TypedArray,
	WeakRef,
} from './types.js';

const typedArrayTypeNames = [
	'Int8Array',
	'Uint8Array',
	'Uint8ClampedArray',
	'Int16Array',
	'Uint16Array',
	'Int32Array',
	'Uint32Array',
	'Float32Array',
	'Float64Array',
	'BigInt64Array',
	'BigUint64Array',
] as const;

type TypedArrayTypeName = typeof typedArrayTypeNames[number];

function isTypedArrayName(name: unknown): name is TypedArrayTypeName {
	return typedArrayTypeNames.includes(name as TypedArrayTypeName);
}

const objectTypeNames = [
	'Function',
	'Generator',
	'AsyncGenerator',
	'GeneratorFunction',
	'AsyncGeneratorFunction',
	'AsyncFunction',
	'Observable',
	'Array',
	'Buffer',
	'Blob',
	'Object',
	'RegExp',
	'Date',
	'Error',
	'Map',
	'Set',
	'WeakMap',
	'WeakSet',
	'WeakRef',
	'ArrayBuffer',
	'SharedArrayBuffer',
	'DataView',
	'Promise',
	'URL',
	'FormData',
	'URLSearchParams',
	'HTMLElement',
	'NaN',
	...typedArrayTypeNames,
] as const;

type ObjectTypeName = typeof objectTypeNames[number];

function isObjectTypeName(name: unknown): name is ObjectTypeName {
	return objectTypeNames.includes(name as ObjectTypeName);
}

const primitiveTypeNames = [
	'null',
	'undefined',
	'string',
	'number',
	'bigint',
	'boolean',
	'symbol',
] as const;

type PrimitiveTypeName = typeof primitiveTypeNames[number];

function isPrimitiveTypeName(name: unknown): name is PrimitiveTypeName {
	return primitiveTypeNames.includes(name as PrimitiveTypeName);
}

export type TypeName = ObjectTypeName | PrimitiveTypeName;

const assertionTypeDescriptions = [
	'positive number',
	'negative number',
	'Class',
	'string with a number',
	'null or undefined',
	'Iterable',
	'AsyncIterable',
	'native Promise',
	'EnumCase',
	'string with a URL',
	'truthy',
	'falsy',
	'primitive',
	'integer',
	'plain object',
	'TypedArray',
	'array-like',
	'tuple-like',
	'Node.js Stream',
	'infinite number',
	'empty array',
	'non-empty array',
	'empty string',
	'empty string or whitespace',
	'non-empty string',
	'non-empty string and not whitespace',
	'empty object',
	'non-empty object',
	'empty set',
	'non-empty set',
	'empty map',
	'non-empty map',
	'PropertyKey',
	'even integer',
	'odd integer',
	'T',
	'in range',
	'predicate returns truthy for any value',
	'predicate returns truthy for all values',
	'valid Date',
	'valid length',
	'whitespace string',
	...objectTypeNames,
	...primitiveTypeNames,
] as const;

export type AssertionTypeDescription = typeof assertionTypeDescriptions[number];

const getObjectType = (value: unknown): ObjectTypeName | undefined => {
	const objectTypeName = Object.prototype.toString.call(value).slice(8, -1);

	if (/HTML\w+Element/.test(objectTypeName) && isHtmlElement(value)) {
		return 'HTMLElement';
	}

	if (isObjectTypeName(objectTypeName)) {
		return objectTypeName;
	}

	return undefined;
};

function detect(value: unknown): TypeName {
	if (value === null) {
		return 'null';
	}

	switch (typeof value) {
		case 'undefined': {
			return 'undefined';
		}

		case 'string': {
			return 'string';
		}

		case 'number': {
			return Number.isNaN(value) ? 'NaN' : 'number';
		}

		case 'boolean': {
			return 'boolean';
		}

		case 'function': {
			return 'Function';
		}

		case 'bigint': {
			return 'bigint';
		}

		case 'symbol': {
			return 'symbol';
		}

		default:
	}

	if (isObservable(value)) {
		return 'Observable';
	}

	if (isArray(value)) {
		return 'Array';
	}

	if (isBuffer(value)) {
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
}

function hasPromiseApi<T = unknown>(value: unknown): value is Promise<T> {
	return isFunction((value as Promise<T>)?.then) && isFunction((value as Promise<T>)?.catch);
}

const is = Object.assign(
	detect,
	{
		all: isAll,
		any: isAny,
		array: isArray,
		arrayBuffer: isArrayBuffer,
		arrayLike: isArrayLike,
		asyncFunction: isAsyncFunction,
		asyncGenerator: isAsyncGenerator,
		asyncGeneratorFunction: isAsyncGeneratorFunction,
		asyncIterable: isAsyncIterable,
		bigint: isBigint,
		bigInt64Array: isBigInt64Array,
		bigUint64Array: isBigUint64Array,
		blob: isBlob,
		boolean: isBoolean,
		boundFunction: isBoundFunction,
		buffer: isBuffer,
		class: isClass,
		/** @deprecated Renamed to `class`. */
		class_: isClass,
		dataView: isDataView,
		date: isDate,
		detect,
		directInstanceOf: isDirectInstanceOf,
		/** @deprecated Renamed to `htmlElement` */
		domElement: isHtmlElement,
		emptyArray: isEmptyArray,
		emptyMap: isEmptyMap,
		emptyObject: isEmptyObject,
		emptySet: isEmptySet,
		emptyString: isEmptyString,
		emptyStringOrWhitespace: isEmptyStringOrWhitespace,
		enumCase: isEnumCase,
		error: isError,
		evenInteger: isEvenInteger,
		falsy: isFalsy,
		float32Array: isFloat32Array,
		float64Array: isFloat64Array,
		formData: isFormData,
		function: isFunction,
		/** @deprecated Renamed to `function`. */
		function_: isFunction,
		generator: isGenerator,
		generatorFunction: isGeneratorFunction,
		htmlElement: isHtmlElement,
		infinite: isInfinite,
		inRange: isInRange,
		int16Array: isInt16Array,
		int32Array: isInt32Array,
		int8Array: isInt8Array,
		integer: isInteger,
		iterable: isIterable,
		map: isMap,
		nan: isNan,
		nativePromise: isNativePromise,
		negativeNumber: isNegativeNumber,
		nodeStream: isNodeStream,
		nonEmptyArray: isNonEmptyArray,
		nonEmptyMap: isNonEmptyMap,
		nonEmptyObject: isNonEmptyObject,
		nonEmptySet: isNonEmptySet,
		nonEmptyString: isNonEmptyString,
		nonEmptyStringAndNotWhitespace: isNonEmptyStringAndNotWhitespace,
		null: isNull,
		/** @deprecated Renamed to `null`. */
		null_: isNull,
		nullOrUndefined: isNullOrUndefined,
		number: isNumber,
		numericString: isNumericString,
		object: isObject,
		observable: isObservable,
		oddInteger: isOddInteger,
		plainObject: isPlainObject,
		positiveNumber: isPositiveNumber,
		primitive: isPrimitive,
		promise: isPromise,
		propertyKey: isPropertyKey,
		regExp: isRegExp,
		safeInteger: isSafeInteger,
		set: isSet,
		sharedArrayBuffer: isSharedArrayBuffer,
		string: isString,
		symbol: isSymbol,
		truthy: isTruthy,
		tupleLike: isTupleLike,
		typedArray: isTypedArray,
		uint16Array: isUint16Array,
		uint32Array: isUint32Array,
		uint8Array: isUint8Array,
		uint8ClampedArray: isUint8ClampedArray,
		undefined: isUndefined,
		urlInstance: isUrlInstance,
		urlSearchParams: isUrlSearchParams,
		urlString: isUrlString,
		validDate: isValidDate,
		validLength: isValidLength,
		weakMap: isWeakMap,
		weakRef: isWeakRef,
		weakSet: isWeakSet,
		whitespaceString: isWhitespaceString,
	},
);

function isAbsoluteMod2(remainder: 0 | 1) {
	return (value: unknown): value is number => isInteger(value) && Math.abs(value % 2) === remainder;
}

export function isAll(predicate: Predicate, ...values: unknown[]): boolean {
	return predicateOnArray(Array.prototype.every, predicate, values);
}

export function isAny(predicate: Predicate | Predicate[], ...values: unknown[]): boolean {
	const predicates = isArray(predicate) ? predicate : [predicate];
	return predicates.some(singlePredicate =>
		predicateOnArray(Array.prototype.some, singlePredicate, values),
	);
}

export function isArray<T = unknown>(value: unknown, assertion?: (value: T) => value is T): value is T[] {
	if (!Array.isArray(value)) {
		return false;
	}

	if (!isFunction(assertion)) {
		return true;
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	return value.every(element => assertion(element));
}

export function isArrayBuffer(value: unknown): value is ArrayBuffer {
	return getObjectType(value) === 'ArrayBuffer';
}

export function isArrayLike<T = unknown>(value: unknown): value is ArrayLike<T> {
	return !isNullOrUndefined(value) && !isFunction(value) && isValidLength((value as ArrayLike<T>).length);
}

export function isAsyncFunction<T = unknown>(value: unknown): value is ((...args: any[]) => Promise<T>) {
	return getObjectType(value) === 'AsyncFunction';
}

export function isAsyncGenerator(value: unknown): value is AsyncGenerator {
	return isAsyncIterable(value) && isFunction((value as AsyncGenerator).next) && isFunction((value as AsyncGenerator).throw);
}

export function isAsyncGeneratorFunction(value: unknown): value is ((...args: any[]) => Promise<unknown>) {
	return getObjectType(value) === 'AsyncGeneratorFunction';
}

export function isAsyncIterable<T = unknown>(value: unknown): value is AsyncIterable<T> {
	return isFunction((value as AsyncIterable<T>)?.[Symbol.asyncIterator]);
}

export function isBigint(value: unknown): value is bigint {
	return typeof value === 'bigint';
}

export function isBigInt64Array(value: unknown): value is BigInt64Array {
	return getObjectType(value) === 'BigInt64Array';
}

export function isBigUint64Array(value: unknown): value is BigUint64Array {
	return getObjectType(value) === 'BigUint64Array';
}

export function isBlob(value: unknown): value is Blob {
	return getObjectType(value) === 'Blob';
}

export function isBoolean(value: unknown): value is boolean {
	return value === true || value === false;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isBoundFunction(value: unknown): value is Function {
	return isFunction(value) && !Object.prototype.hasOwnProperty.call(value, 'prototype');
}

export function isBuffer(value: unknown): value is Buffer {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
	return (value as any)?.constructor?.isBuffer?.(value) ?? false;
}

export function isClass(value: unknown): value is Class {
	return isFunction(value) && value.toString().startsWith('class ');
}

export function isDataView(value: unknown): value is DataView {
	return getObjectType(value) === 'DataView';
}

export function isDate(value: unknown): value is Date {
	return getObjectType(value) === 'Date';
}

export function isDirectInstanceOf<T>(instance: unknown, class_: Class<T>): instance is T {
	if (instance === undefined || instance === null) {
		return false;
	}

	return Object.getPrototypeOf(instance) === class_.prototype;
}

export function isEmptyArray(value: unknown): value is never[] {
	return isArray(value) && value.length === 0;
}

export function isEmptyMap(value: unknown): value is Map<never, never> {
	return isMap(value) && value.size === 0;
}

export function isEmptyObject<Key extends keyof any = string>(value: unknown): value is Record<Key, never> {
	return isObject(value) && !isMap(value) && !isSet(value) && Object.keys(value).length === 0;
}

export function isEmptySet(value: unknown): value is Set<never> {
	return isSet(value) && value.size === 0;
}

export function isEmptyString(value: unknown): value is '' {
	return isString(value) && value.length === 0;
}

export function isEmptyStringOrWhitespace(value: unknown): value is string {
	return isEmptyString(value) || isWhitespaceString(value);
}

export function isEnumCase<T = unknown>(value: unknown, targetEnum: T): boolean {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	return Object.values(targetEnum as any).includes(value as string);
}

export function isError(value: unknown): value is Error {
	return getObjectType(value) === 'Error';
}

export function isEvenInteger(value: unknown): value is number {
	return isAbsoluteMod2(0)(value);
}

// Example: `is.falsy = (value: unknown): value is (not true | 0 | '' | undefined | null) => Boolean(value);`
export function isFalsy(value: unknown): value is Falsy {
	return !value;
}

export function isFloat32Array(value: unknown): value is Float32Array {
	return getObjectType(value) === 'Float32Array';
}

export function isFloat64Array(value: unknown): value is Float64Array {
	return getObjectType(value) === 'Float64Array';
}

export function isFormData(value: unknown): value is FormData {
	return getObjectType(value) === 'FormData';
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isFunction(value: unknown): value is Function {
	return typeof value === 'function';
}

export function isGenerator(value: unknown): value is Generator {
	return isIterable(value) && isFunction((value as Generator)?.next) && isFunction((value as Generator)?.throw);
}

export function isGeneratorFunction(value: unknown): value is GeneratorFunction {
	return getObjectType(value) === 'GeneratorFunction';
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const NODE_TYPE_ELEMENT = 1;

// eslint-disable-next-line @typescript-eslint/naming-convention
const DOM_PROPERTIES_TO_CHECK: Array<(keyof HTMLElement)> = [
	'innerHTML',
	'ownerDocument',
	'style',
	'attributes',
	'nodeValue',
];

export function isHtmlElement(value: unknown): value is HTMLElement {
	return isObject(value)
		&& (value as HTMLElement).nodeType === NODE_TYPE_ELEMENT
		&& isString((value as HTMLElement).nodeName)
		&& !isPlainObject(value)
		&& DOM_PROPERTIES_TO_CHECK.every(property => property in value);
}

export function isInfinite(value: unknown): value is number {
	return value === Number.POSITIVE_INFINITY || value === Number.NEGATIVE_INFINITY;
}

export function isInRange(value: number, range: number | [number, number]): value is number {
	if (isNumber(range)) {
		return value >= Math.min(0, range) && value <= Math.max(range, 0);
	}

	if (isArray(range) && range.length === 2) {
		return value >= Math.min(...range) && value <= Math.max(...range);
	}

	throw new TypeError(`Invalid range: ${JSON.stringify(range)}`);
}

export function isInt16Array(value: unknown): value is Int16Array {
	return getObjectType(value) === 'Int16Array';
}

export function isInt32Array(value: unknown): value is Int32Array {
	return getObjectType(value) === 'Int32Array';
}

export function isInt8Array(value: unknown): value is Int8Array {
	return getObjectType(value) === 'Int8Array';
}

export function isInteger(value: unknown): value is number {
	return Number.isInteger(value);
}

export function isIterable<T = unknown>(value: unknown): value is Iterable<T> {
	return isFunction((value as Iterable<T>)?.[Symbol.iterator]);
}

export function isMap<Key = unknown, Value = unknown>(value: unknown): value is Map<Key, Value> {
	return getObjectType(value) === 'Map';
}

export function isNan(value: unknown) {
	return Number.isNaN(value);
}

export function isNativePromise<T = unknown>(value: unknown): value is Promise<T> {
	return getObjectType(value) === 'Promise';
}

export function isNegativeNumber(value: unknown): value is number {
	return isNumber(value) && value < 0;
}

export function isNodeStream(value: unknown): value is NodeStream {
	return isObject(value) && isFunction((value as NodeStream).pipe) && !isObservable(value);
}

export function isNonEmptyArray<T = unknown, Item = unknown>(value: T | Item[]): value is [Item, ...Item[]] {
	return isArray(value) && value.length > 0;
}

export function isNonEmptyMap<Key = unknown, Value = unknown>(value: unknown): value is Map<Key, Value> {
	return isMap(value) && value.size > 0;
}

// TODO: Use `not` operator here to remove `Map` and `Set` from type guard:
// - https://github.com/Microsoft/TypeScript/pull/29317
export function isNonEmptyObject<Key extends keyof any = string, Value = unknown>(value: unknown): value is Record<Key, Value> {
	return isObject(value) && !isMap(value) && !isSet(value) && Object.keys(value).length > 0;
}

export function isNonEmptySet<T = unknown>(value: unknown): value is Set<T> {
	return isSet(value) && value.size > 0;
}

// TODO: Use `not ''` when the `not` operator is available.
export function isNonEmptyString(value: unknown): value is NonEmptyString {
	return isString(value) && value.length > 0;
}

// TODO: Use `not ''` when the `not` operator is available.
export function isNonEmptyStringAndNotWhitespace(value: unknown): value is NonEmptyString {
	return isString(value) && !isEmptyStringOrWhitespace(value);
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isNull(value: unknown): value is null {
	return value === null;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isNullOrUndefined(value: unknown): value is null | undefined {
	return isNull(value) || isUndefined(value);
}

export function isNumber(value: unknown): value is number {
	return typeof value === 'number' && !Number.isNaN(value);
}

export function isNumericString(value: unknown): value is `${number}` {
	return isString(value) && !isEmptyStringOrWhitespace(value) && !Number.isNaN(Number(value));
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isObject(value: unknown): value is object {
	return !isNull(value) && (typeof value === 'object' || isFunction(value));
}

export function isObservable(value: unknown): value is ObservableLike {
	if (!value) {
		return false;
	}

	// eslint-disable-next-line no-use-extend-native/no-use-extend-native, @typescript-eslint/no-unsafe-call
	if (value === (value as any)[Symbol.observable]?.()) {
		return true;
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	if (value === (value as any)['@@observable']?.()) {
		return true;
	}

	return false;
}

export function isOddInteger(value: unknown): value is number {
	return isAbsoluteMod2(1)(value);
}

export function isPlainObject<Value = unknown>(value: unknown): value is Record<PropertyKey, Value> {
	// From: https://github.com/sindresorhus/is-plain-obj/blob/main/index.js
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const prototype = Object.getPrototypeOf(value);

	return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in value) && !(Symbol.iterator in value);
}

export function isPositiveNumber(value: unknown): value is number {
	return isNumber(value) && value > 0;
}

export function isPrimitive(value: unknown): value is Primitive {
	return isNull(value) || isPrimitiveTypeName(typeof value);
}

export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
	return isNativePromise(value) || hasPromiseApi(value);
}

// `PropertyKey` is any value that can be used as an object key (string, number, or symbol)
export function isPropertyKey(value: unknown): value is PropertyKey {
	return isAny([isString, isNumber, isSymbol], value);
}

export function isRegExp(value: unknown): value is RegExp {
	return getObjectType(value) === 'RegExp';
}

export function isSafeInteger(value: unknown): value is number {
	return Number.isSafeInteger(value);
}

export function isSet<T = unknown>(value: unknown): value is Set<T> {
	return getObjectType(value) === 'Set';
}

export function isSharedArrayBuffer(value: unknown): value is SharedArrayBuffer {
	return getObjectType(value) === 'SharedArrayBuffer';
}

export function isString(value: unknown): value is string {
	return typeof value === 'string';
}

export function isSymbol(value: unknown): value is symbol {
	return typeof value === 'symbol';
}

// Example: `is.truthy = (value: unknown): value is (not false | not 0 | not '' | not undefined | not null) => Boolean(value);`
// eslint-disable-next-line unicorn/prefer-native-coercion-functions
export function isTruthy<T>(value: T | Falsy): value is T {
	return Boolean(value);
}

type TypeGuard<T> = (value: unknown) => value is T;

// eslint-disable-next-line @typescript-eslint/ban-types
type ResolveTypesOfTypeGuardsTuple<TypeGuardsOfT, ResultOfT extends unknown[] = [] > =
	TypeGuardsOfT extends [TypeGuard<infer U>, ...infer TOthers]
		? ResolveTypesOfTypeGuardsTuple<TOthers, [...ResultOfT, U]>
		: TypeGuardsOfT extends undefined[]
			? ResultOfT
			: never;

export function isTupleLike<T extends Array<TypeGuard<unknown>>>(value: unknown, guards: [...T]): value is ResolveTypesOfTypeGuardsTuple<T> {
	if (isArray(guards) && isArray(value) && guards.length === value.length) {
		return guards.every((guard, index) => guard(value[index]));
	}

	return false;
}

export function isTypedArray(value: unknown): value is TypedArray {
	return isTypedArrayName(getObjectType(value));
}

export function isUint16Array(value: unknown): value is Uint16Array {
	return getObjectType(value) === 'Uint16Array';
}

export function isUint32Array(value: unknown): value is Uint32Array {
	return getObjectType(value) === 'Uint32Array';
}

export function isUint8Array(value: unknown): value is Uint8Array {
	return getObjectType(value) === 'Uint8Array';
}

export function isUint8ClampedArray(value: unknown): value is Uint8ClampedArray {
	return getObjectType(value) === 'Uint8ClampedArray';
}

export function isUndefined(value: unknown): value is undefined {
	return value === undefined;
}

export function isUrlInstance(value: unknown): value is URL {
	return getObjectType(value) === 'URL';
}

// eslint-disable-next-line unicorn/prevent-abbreviations
export function isUrlSearchParams(value: unknown): value is URLSearchParams {
	return getObjectType(value) === 'URLSearchParams';
}

export function isUrlString(value: unknown): value is string {
	if (!isString(value)) {
		return false;
	}

	try {
		new URL(value); // eslint-disable-line no-new
		return true;
	} catch {
		return false;
	}
}

export function isValidDate(value: unknown): value is Date {
	return isDate(value) && !isNan(Number(value));
}

export function isValidLength(value: unknown): value is number {
	return isSafeInteger(value) && value >= 0;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isWeakMap<Key extends object = object, Value = unknown>(value: unknown): value is WeakMap<Key, Value> {
	return getObjectType(value) === 'WeakMap';
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isWeakRef(value: unknown): value is WeakRef<object> {
	return getObjectType(value) === 'WeakRef';
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isWeakSet(value: unknown): value is WeakSet<object> {
	return getObjectType(value) === 'WeakSet';
}

export function isWhitespaceString(value: unknown): value is string {
	return isString(value) && /^\s+$/.test(value);
}

type ArrayMethod = (fn: (value: unknown, index: number, array: unknown[]) => boolean, thisArg?: unknown) => boolean;

function predicateOnArray(method: ArrayMethod, predicate: Predicate, values: unknown[]) {
	if (!isFunction(predicate)) {
		throw new TypeError(`Invalid predicate: ${JSON.stringify(predicate)}`);
	}

	if (values.length === 0) {
		throw new TypeError('Invalid number of values');
	}

	return method.call(values, predicate);
}

function typeErrorMessage(description: AssertionTypeDescription, value: unknown): string {
	return `Expected value which is \`${description}\`, received value of type \`${is(value)}\`.`;
}

function unique<T>(values: T[]): T[] {
	// eslint-disable-next-line unicorn/prefer-spread
	return Array.from(new Set(values));
}

const andFormatter = new Intl.ListFormat('en', {style: 'long', type: 'conjunction'});
const orFormatter = new Intl.ListFormat('en', {style: 'long', type: 'disjunction'});

function typeErrorMessageMultipleValues(expectedType: AssertionTypeDescription | AssertionTypeDescription[], values: unknown[]): string {
	const uniqueExpectedTypes = unique((isArray(expectedType) ? expectedType : [expectedType]).map(value => `\`${value}\``));
	const uniqueValueTypes = unique(values.map(value => `\`${is(value)}\``));
	return `Expected values which are ${orFormatter.format(uniqueExpectedTypes)}. Received values of type${uniqueValueTypes.length > 1 ? 's' : ''} ${andFormatter.format(uniqueValueTypes)}.`;
}

// Type assertions have to be declared with an explicit type.
type Assert = {
	// Unknowns.
	undefined: (value: unknown) => asserts value is undefined;
	string: (value: unknown) => asserts value is string;
	number: (value: unknown) => asserts value is number;
	positiveNumber: (value: unknown) => asserts value is number;
	negativeNumber: (value: unknown) => asserts value is number;
	bigint: (value: unknown) => asserts value is bigint;
	// eslint-disable-next-line @typescript-eslint/ban-types
	function: (value: unknown) => asserts value is Function;
	/** @deprecated Renamed to `function`. */
	// eslint-disable-next-line @typescript-eslint/ban-types
	function_: (value: unknown) => asserts value is Function;
	// eslint-disable-next-line @typescript-eslint/ban-types
	null: (value: unknown) => asserts value is null;
	/** @deprecated Renamed to `null`. */
	// eslint-disable-next-line @typescript-eslint/ban-types
	null_: (value: unknown) => asserts value is null;
	class: (value: unknown) => asserts value is Class;
	/** @deprecated Renamed to `class`. */
	class_: (value: unknown) => asserts value is Class;
	boolean: (value: unknown) => asserts value is boolean;
	symbol: (value: unknown) => asserts value is symbol;
	numericString: (value: unknown) => asserts value is `${number}`;
	array: <T = unknown>(value: unknown, assertion?: (element: unknown) => asserts element is T) => asserts value is T[];
	buffer: (value: unknown) => asserts value is Buffer;
	blob: (value: unknown) => asserts value is Blob;
	// eslint-disable-next-line @typescript-eslint/ban-types
	nullOrUndefined: (value: unknown) => asserts value is null | undefined;
	object: <Key extends keyof any = string, Value = unknown>(value: unknown) => asserts value is Record<Key, Value>;
	iterable: <T = unknown>(value: unknown) => asserts value is Iterable<T>;
	asyncIterable: <T = unknown>(value: unknown) => asserts value is AsyncIterable<T>;
	generator: (value: unknown) => asserts value is Generator;
	asyncGenerator: (value: unknown) => asserts value is AsyncGenerator;
	nativePromise: <T = unknown>(value: unknown) => asserts value is Promise<T>;
	promise: <T = unknown>(value: unknown) => asserts value is Promise<T>;
	generatorFunction: (value: unknown) => asserts value is GeneratorFunction;
	asyncGeneratorFunction: (value: unknown) => asserts value is AsyncGeneratorFunction;
	// eslint-disable-next-line @typescript-eslint/ban-types
	asyncFunction: (value: unknown) => asserts value is Function;
	// eslint-disable-next-line @typescript-eslint/ban-types
	boundFunction: (value: unknown) => asserts value is Function;
	regExp: (value: unknown) => asserts value is RegExp;
	date: (value: unknown) => asserts value is Date;
	error: (value: unknown) => asserts value is Error;
	map: <Key = unknown, Value = unknown>(value: unknown) => asserts value is Map<Key, Value>;
	set: <T = unknown>(value: unknown) => asserts value is Set<T>;
	// eslint-disable-next-line @typescript-eslint/ban-types
	weakMap: <Key extends object = object, Value = unknown>(value: unknown) => asserts value is WeakMap<Key, Value>;
	// eslint-disable-next-line @typescript-eslint/ban-types
	weakSet: <T extends object = object>(value: unknown) => asserts value is WeakSet<T>;
	// eslint-disable-next-line @typescript-eslint/ban-types
	weakRef: <T extends object = object>(value: unknown) => asserts value is WeakRef<T>;
	int8Array: (value: unknown) => asserts value is Int8Array;
	uint8Array: (value: unknown) => asserts value is Uint8Array;
	uint8ClampedArray: (value: unknown) => asserts value is Uint8ClampedArray;
	int16Array: (value: unknown) => asserts value is Int16Array;
	uint16Array: (value: unknown) => asserts value is Uint16Array;
	int32Array: (value: unknown) => asserts value is Int32Array;
	uint32Array: (value: unknown) => asserts value is Uint32Array;
	float32Array: (value: unknown) => asserts value is Float32Array;
	float64Array: (value: unknown) => asserts value is Float64Array;
	bigInt64Array: (value: unknown) => asserts value is BigInt64Array;
	bigUint64Array: (value: unknown) => asserts value is BigUint64Array;
	arrayBuffer: (value: unknown) => asserts value is ArrayBuffer;
	sharedArrayBuffer: (value: unknown) => asserts value is SharedArrayBuffer;
	dataView: (value: unknown) => asserts value is DataView;
	enumCase: <T = unknown>(value: unknown, targetEnum: T) => asserts value is T[keyof T];
	urlInstance: (value: unknown) => asserts value is URL;
	urlString: (value: unknown) => asserts value is string;
	truthy: <T>(value: T | Falsy) => asserts value is T;
	falsy: (value: unknown) => asserts value is Falsy;
	nan: (value: unknown) => asserts value is number;
	primitive: (value: unknown) => asserts value is Primitive;
	integer: (value: unknown) => asserts value is number;
	safeInteger: (value: unknown) => asserts value is number;
	plainObject: <Value = unknown>(value: unknown) => asserts value is Record<PropertyKey, Value>;
	typedArray: (value: unknown) => asserts value is TypedArray;
	arrayLike: <T = unknown>(value: unknown) => asserts value is ArrayLike<T>;
	tupleLike: <T extends Array<TypeGuard<unknown>>>(value: unknown, guards: [...T]) => asserts value is ResolveTypesOfTypeGuardsTuple<T>;
	/** @deprecated Renamed to `htmlElement` */
	domElement: (value: unknown) => asserts value is HTMLElement;
	htmlElement: (value: unknown) => asserts value is HTMLElement;
	observable: (value: unknown) => asserts value is ObservableLike;
	nodeStream: (value: unknown) => asserts value is NodeStream;
	infinite: (value: unknown) => asserts value is number;
	emptyArray: (value: unknown) => asserts value is never[];
	nonEmptyArray: <T = unknown, Item = unknown>(value: T | Item[]) => asserts value is [Item, ...Item[]];
	emptyString: (value: unknown) => asserts value is '';
	emptyStringOrWhitespace: (value: unknown) => asserts value is string;
	nonEmptyString: (value: unknown) => asserts value is string;
	nonEmptyStringAndNotWhitespace: (value: unknown) => asserts value is string;
	emptyObject: <Key extends keyof any = string>(value: unknown) => asserts value is Record<Key, never>;
	nonEmptyObject: <Key extends keyof any = string, Value = unknown>(value: unknown) => asserts value is Record<Key, Value>;
	emptySet: (value: unknown) => asserts value is Set<never>;
	nonEmptySet: <T = unknown>(value: unknown) => asserts value is Set<T>;
	emptyMap: (value: unknown) => asserts value is Map<never, never>;
	nonEmptyMap: <Key = unknown, Value = unknown>(value: unknown) => asserts value is Map<Key, Value>;
	propertyKey: (value: unknown) => asserts value is PropertyKey;
	formData: (value: unknown) => asserts value is FormData;
	urlSearchParams: (value: unknown) => asserts value is URLSearchParams;
	validDate: (value: unknown) => asserts value is Date;
	validLength: (value: unknown) => asserts value is number;
	whitespaceString: (value: unknown) => asserts value is string;

	// Numbers.
	evenInteger: (value: number) => asserts value is number;
	oddInteger: (value: number) => asserts value is number;

	// Two arguments.
	directInstanceOf: <T>(instance: unknown, class_: Class<T>) => asserts instance is T;
	inRange: (value: number, range: number | [number, number]) => asserts value is number;

	// Variadic functions.
	any: (predicate: Predicate | Predicate[], ...values: unknown[]) => void | never;
	all: (predicate: Predicate, ...values: unknown[]) => void | never;
};

export const assert: Assert = {
	all: assertAll,
	any: assertAny,
	array: assertArray,
	arrayBuffer: assertArrayBuffer,
	arrayLike: assertArrayLike,
	asyncFunction: assertAsyncFunction,
	asyncGenerator: assertAsyncGenerator,
	asyncGeneratorFunction: assertAsyncGeneratorFunction,
	asyncIterable: assertAsyncIterable,
	bigint: assertBigint,
	bigInt64Array: assertBigInt64Array,
	bigUint64Array: assertBigUint64Array,
	blob: assertBlob,
	boolean: assertBoolean,
	boundFunction: assertBoundFunction,
	buffer: assertBuffer,
	class: assertClass,
	class_: assertClass,
	dataView: assertDataView,
	date: assertDate,
	directInstanceOf: assertDirectInstanceOf,
	domElement: assertHtmlElement,
	emptyArray: assertEmptyArray,
	emptyMap: assertEmptyMap,
	emptyObject: assertEmptyObject,
	emptySet: assertEmptySet,
	emptyString: assertEmptyString,
	emptyStringOrWhitespace: assertEmptyStringOrWhitespace,
	enumCase: assertEnumCase,
	error: assertError,
	evenInteger: assertEvenInteger,
	falsy: assertFalsy,
	float32Array: assertFloat32Array,
	float64Array: assertFloat64Array,
	formData: assertFormData,
	function: assertFunction,
	function_: assertFunction,
	generator: assertGenerator,
	generatorFunction: assertGeneratorFunction,
	htmlElement: assertHtmlElement,
	infinite: assertInfinite,
	inRange: assertInRange,
	int16Array: assertInt16Array,
	int32Array: assertInt32Array,
	int8Array: assertInt8Array,
	integer: assertInteger,
	iterable: assertIterable,
	map: assertMap,
	nan: assertNan,
	nativePromise: assertNativePromise,
	negativeNumber: assertNegativeNumber,
	nodeStream: assertNodeStream,
	nonEmptyArray: assertNonEmptyArray,
	nonEmptyMap: assertNonEmptyMap,
	nonEmptyObject: assertNonEmptyObject,
	nonEmptySet: assertNonEmptySet,
	nonEmptyString: assertNonEmptyString,
	nonEmptyStringAndNotWhitespace: assertNonEmptyStringAndNotWhitespace,
	null: assertNull,
	null_: assertNull,
	nullOrUndefined: assertNullOrUndefined,
	number: assertNumber,
	numericString: assertNumericString,
	object: assertObject,
	observable: assertObservable,
	oddInteger: assertOddInteger,
	plainObject: assertPlainObject,
	positiveNumber: assertPositiveNumber,
	primitive: assertPrimitive,
	promise: assertPromise,
	propertyKey: assertPropertyKey,
	regExp: assertRegExp,
	safeInteger: assertSafeInteger,
	set: assertSet,
	sharedArrayBuffer: assertSharedArrayBuffer,
	string: assertString,
	symbol: assertSymbol,
	truthy: assertTruthy,
	tupleLike: assertTupleLike,
	typedArray: assertTypedArray,
	uint16Array: assertUint16Array,
	uint32Array: assertUint32Array,
	uint8Array: assertUint8Array,
	uint8ClampedArray: assertUint8ClampedArray,
	undefined: assertUndefined,
	urlInstance: assertUrlInstance,
	urlSearchParams: assertUrlSearchParams,
	urlString: assertUrlString,
	validDate: assertValidDate,
	validLength: assertValidLength,
	weakMap: assertWeakMap,
	weakRef: assertWeakRef,
	weakSet: assertWeakSet,
	whitespaceString: assertWhitespaceString,
};

const methodTypeMap = {
	isArray: 'Array',
	isArrayBuffer: 'ArrayBuffer',
	isArrayLike: 'array-like',
	isAsyncFunction: 'AsyncFunction',
	isAsyncGenerator: 'AsyncGenerator',
	isAsyncGeneratorFunction: 'AsyncGeneratorFunction',
	isAsyncIterable: 'AsyncIterable',
	isBigint: 'bigint',
	isBigInt64Array: 'BigInt64Array',
	isBigUint64Array: 'BigUint64Array',
	isBlob: 'Blob',
	isBoolean: 'boolean',
	isBoundFunction: 'Function',
	isBuffer: 'Buffer',
	isClass: 'Class',
	isDataView: 'DataView',
	isDate: 'Date',
	isDirectInstanceOf: 'T',
	/** @deprecated */
	isDomElement: 'HTMLElement',
	isEmptyArray: 'empty array',
	isEmptyMap: 'empty map',
	isEmptyObject: 'empty object',
	isEmptySet: 'empty set',
	isEmptyString: 'empty string',
	isEmptyStringOrWhitespace: 'empty string or whitespace',
	isEnumCase: 'EnumCase',
	isError: 'Error',
	isEvenInteger: 'even integer',
	isFalsy: 'falsy',
	isFloat32Array: 'Float32Array',
	isFloat64Array: 'Float64Array',
	isFormData: 'FormData',
	isFunction: 'Function',
	isGenerator: 'Generator',
	isGeneratorFunction: 'GeneratorFunction',
	isHtmlElement: 'HTMLElement',
	isInfinite: 'infinite number',
	isInRange: 'in range',
	isInt16Array: 'Int16Array',
	isInt32Array: 'Int32Array',
	isInt8Array: 'Int8Array',
	isInteger: 'integer',
	isIterable: 'Iterable',
	isMap: 'Map',
	isNan: 'NaN',
	isNativePromise: 'native Promise',
	isNegativeNumber: 'negative number',
	isNodeStream: 'Node.js Stream',
	isNonEmptyArray: 'non-empty array',
	isNonEmptyMap: 'non-empty map',
	isNonEmptyObject: 'non-empty object',
	isNonEmptySet: 'non-empty set',
	isNonEmptyString: 'non-empty string',
	isNonEmptyStringAndNotWhitespace: 'non-empty string and not whitespace',
	isNull: 'null',
	isNullOrUndefined: 'null or undefined',
	isNumber: 'number',
	isNumericString: 'string with a number',
	isObject: 'Object',
	isObservable: 'Observable',
	isOddInteger: 'odd integer',
	isPlainObject: 'plain object',
	isPositiveNumber: 'positive number',
	isPrimitive: 'primitive',
	isPromise: 'Promise',
	isPropertyKey: 'PropertyKey',
	isRegExp: 'RegExp',
	isSafeInteger: 'integer',
	isSet: 'Set',
	isSharedArrayBuffer: 'SharedArrayBuffer',
	isString: 'string',
	isSymbol: 'symbol',
	isTruthy: 'truthy',
	isTupleLike: 'tuple-like',
	isTypedArray: 'TypedArray',
	isUint16Array: 'Uint16Array',
	isUint32Array: 'Uint32Array',
	isUint8Array: 'Uint8Array',
	isUint8ClampedArray: 'Uint8ClampedArray',
	isUndefined: 'undefined',
	isUrlInstance: 'URL',
	isUrlSearchParams: 'URLSearchParams',
	isUrlString: 'string with a URL',
	isValidDate: 'valid Date',
	isValidLength: 'valid length',
	isWeakMap: 'WeakMap',
	isWeakRef: 'WeakRef',
	isWeakSet: 'WeakSet',
	isWhitespaceString: 'whitespace string',
} as const;

function keysOf<T extends Record<PropertyKey, unknown>>(value: T): Array<keyof T> {
	return Object.keys(value) as Array<keyof T>;
}

type IsMethodName = keyof typeof methodTypeMap;
const isMethodNames: IsMethodName[] = keysOf(methodTypeMap);

function isIsMethodName(value: unknown): value is IsMethodName {
	return isMethodNames.includes(value as IsMethodName);
}

export function assertAll(predicate: Predicate, ...values: unknown[]): void | never {
	if (!isAll(predicate, ...values)) {
		const expectedType = isIsMethodName(predicate.name) ? methodTypeMap[predicate.name] : 'predicate returns truthy for all values';
		throw new TypeError(typeErrorMessageMultipleValues(expectedType, values));
	}
}

export function assertAny(predicate: Predicate | Predicate[], ...values: unknown[]): void | never {
	if (!isAny(predicate, ...values)) {
		const predicates = isArray(predicate) ? predicate : [predicate];
		const expectedTypes = predicates.map(predicate => isIsMethodName(predicate.name) ? methodTypeMap[predicate.name] : 'predicate returns truthy for any value');
		throw new TypeError(typeErrorMessageMultipleValues(expectedTypes, values));
	}
}

export function assertArray<T = unknown>(value: unknown, assertion?: (element: unknown) => asserts element is T): asserts value is T[] {
	if (!isArray(value)) {
		throw new TypeError(typeErrorMessage('Array', value));
	}

	if (assertion) {
		// eslint-disable-next-line unicorn/no-array-for-each, unicorn/no-array-callback-reference
		value.forEach(assertion);
	}
}

export function assertArrayBuffer(value: unknown): asserts value is ArrayBuffer {
	if (!isArrayBuffer(value)) {
		throw new TypeError(typeErrorMessage('ArrayBuffer', value));
	}
}

export function assertArrayLike<T = unknown>(value: unknown): asserts value is ArrayLike<T> {
	if (!isArrayLike(value)) {
		throw new TypeError(typeErrorMessage('array-like', value));
	}
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function assertAsyncFunction(value: unknown): asserts value is Function {
	if (!isAsyncFunction(value)) {
		throw new TypeError(typeErrorMessage('AsyncFunction', value));
	}
}

export function assertAsyncGenerator(value: unknown): asserts value is AsyncGenerator {
	if (!isAsyncGenerator(value)) {
		throw new TypeError(typeErrorMessage('AsyncGenerator', value));
	}
}

export function assertAsyncGeneratorFunction(value: unknown): asserts value is AsyncGeneratorFunction {
	if (!isAsyncGeneratorFunction(value)) {
		throw new TypeError(typeErrorMessage('AsyncGeneratorFunction', value));
	}
}

export function assertAsyncIterable<T = unknown>(value: unknown): asserts value is AsyncIterable<T> {
	if (!isAsyncIterable(value)) {
		throw new TypeError(typeErrorMessage('AsyncIterable', value));
	}
}

export function assertBigint(value: unknown): asserts value is bigint {
	if (!isBigint(value)) {
		throw new TypeError(typeErrorMessage('bigint', value));
	}
}

export function assertBigInt64Array(value: unknown): asserts value is BigInt64Array {
	if (!isBigInt64Array(value)) {
		throw new TypeError(typeErrorMessage('BigInt64Array', value));
	}
}

export function assertBigUint64Array(value: unknown): asserts value is BigUint64Array {
	if (!isBigUint64Array(value)) {
		throw new TypeError(typeErrorMessage('BigUint64Array', value));
	}
}

export function assertBlob(value: unknown): asserts value is Blob {
	if (!isBlob(value)) {
		throw new TypeError(typeErrorMessage('Blob', value));
	}
}

export function assertBoolean(value: unknown): asserts value is boolean {
	if (!isBoolean(value)) {
		throw new TypeError(typeErrorMessage('boolean', value));
	}
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function assertBoundFunction(value: unknown): asserts value is Function {
	if (!isBoundFunction(value)) {
		throw new TypeError(typeErrorMessage('Function', value));
	}
}

export function assertBuffer(value: unknown): asserts value is Buffer {
	if (!isBuffer(value)) {
		throw new TypeError(typeErrorMessage('Buffer', value));
	}
}

export function assertClass(value: unknown): asserts value is Class {
	if (!isClass(value)) {
		throw new TypeError(typeErrorMessage('Class', value));
	}
}

export function assertDataView(value: unknown): asserts value is DataView {
	if (!isDataView(value)) {
		throw new TypeError(typeErrorMessage('DataView', value));
	}
}

export function assertDate(value: unknown): asserts value is Date {
	if (!isDate(value)) {
		throw new TypeError(typeErrorMessage('Date', value));
	}
}

export function assertDirectInstanceOf<T>(instance: unknown, class_: Class<T>): asserts instance is T {
	if (!isDirectInstanceOf(instance, class_)) {
		throw new TypeError(typeErrorMessage('T', instance));
	}
}

export function assertEmptyArray(value: unknown): asserts value is never[] {
	if (!isEmptyArray(value)) {
		throw new TypeError(typeErrorMessage('empty array', value));
	}
}

export function assertEmptyMap(value: unknown): asserts value is Map<never, never> {
	if (!isEmptyMap(value)) {
		throw new TypeError(typeErrorMessage('empty map', value));
	}
}

export function assertEmptyObject<Key extends keyof any = string>(value: unknown): asserts value is Record<Key, never> {
	if (!isEmptyObject(value)) {
		throw new TypeError(typeErrorMessage('empty object', value));
	}
}

export function assertEmptySet(value: unknown): asserts value is Set<never> {
	if (!isEmptySet(value)) {
		throw new TypeError(typeErrorMessage('empty set', value));
	}
}

export function assertEmptyString(value: unknown): asserts value is '' {
	if (!isEmptyString(value)) {
		throw new TypeError(typeErrorMessage('empty string', value));
	}
}

export function assertEmptyStringOrWhitespace(value: unknown): asserts value is string {
	if (!isEmptyStringOrWhitespace(value)) {
		throw new TypeError(typeErrorMessage('empty string or whitespace', value));
	}
}

export function assertEnumCase<T = unknown>(value: unknown, targetEnum: T): asserts value is T[keyof T] {
	if (!isEnumCase(value, targetEnum)) {
		throw new TypeError(typeErrorMessage('EnumCase', value));
	}
}

export function assertError(value: unknown): asserts value is Error {
	if (!isError(value)) {
		throw new TypeError(typeErrorMessage('Error', value));
	}
}

export function assertEvenInteger(value: number): asserts value is number {
	if (!isEvenInteger(value)) {
		throw new TypeError(typeErrorMessage('even integer', value));
	}
}

export function assertFalsy(value: unknown): asserts value is Falsy {
	if (!isFalsy(value)) {
		throw new TypeError(typeErrorMessage('falsy', value));
	}
}

export function assertFloat32Array(value: unknown): asserts value is Float32Array {
	if (!isFloat32Array(value)) {
		throw new TypeError(typeErrorMessage('Float32Array', value));
	}
}

export function assertFloat64Array(value: unknown): asserts value is Float64Array {
	if (!isFloat64Array(value)) {
		throw new TypeError(typeErrorMessage('Float64Array', value));
	}
}

export function assertFormData(value: unknown): asserts value is FormData {
	if (!isFormData(value)) {
		throw new TypeError(typeErrorMessage('FormData', value));
	}
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function assertFunction(value: unknown): asserts value is Function {
	if (!isFunction(value)) {
		throw new TypeError(typeErrorMessage('Function', value));
	}
}

export function assertGenerator(value: unknown): asserts value is Generator {
	if (!isGenerator(value)) {
		throw new TypeError(typeErrorMessage('Generator', value));
	}
}

export function assertGeneratorFunction(value: unknown): asserts value is GeneratorFunction {
	if (!isGeneratorFunction(value)) {
		throw new TypeError(typeErrorMessage('GeneratorFunction', value));
	}
}

export function assertHtmlElement(value: unknown): asserts value is HTMLElement {
	if (!isHtmlElement(value)) {
		throw new TypeError(typeErrorMessage('HTMLElement', value));
	}
}

export function assertInfinite(value: unknown): asserts value is number {
	if (!isInfinite(value)) {
		throw new TypeError(typeErrorMessage('infinite number', value));
	}
}

export function assertInRange(value: number, range: number | [number, number]): asserts value is number {
	if (!isInRange(value, range)) {
		throw new TypeError(typeErrorMessage('in range', value));
	}
}

export function assertInt16Array(value: unknown): asserts value is Int16Array {
	if (!isInt16Array(value)) {
		throw new TypeError(typeErrorMessage('Int16Array', value));
	}
}

export function assertInt32Array(value: unknown): asserts value is Int32Array {
	if (!isInt32Array(value)) {
		throw new TypeError(typeErrorMessage('Int32Array', value));
	}
}

export function assertInt8Array(value: unknown): asserts value is Int8Array {
	if (!isInt8Array(value)) {
		throw new TypeError(typeErrorMessage('Int8Array', value));
	}
}

export function assertInteger(value: unknown): asserts value is number {
	if (!isInteger(value)) {
		throw new TypeError(typeErrorMessage('integer', value));
	}
}

export function assertIterable<T = unknown>(value: unknown): asserts value is Iterable<T> {
	if (!isIterable(value)) {
		throw new TypeError(typeErrorMessage('Iterable', value));
	}
}

export function assertMap<Key = unknown, Value = unknown>(value: unknown): asserts value is Map<Key, Value> {
	if (!isMap(value)) {
		throw new TypeError(typeErrorMessage('Map', value));
	}
}

export function assertNan(value: unknown): asserts value is number {
	if (!isNan(value)) {
		throw new TypeError(typeErrorMessage('NaN', value));
	}
}

export function assertNativePromise<T = unknown>(value: unknown): asserts value is Promise<T> {
	if (!isNativePromise(value)) {
		throw new TypeError(typeErrorMessage('native Promise', value));
	}
}

export function assertNegativeNumber(value: unknown): asserts value is number {
	if (!isNegativeNumber(value)) {
		throw new TypeError(typeErrorMessage('negative number', value));
	}
}

export function assertNodeStream(value: unknown): asserts value is NodeStream {
	if (!isNodeStream(value)) {
		throw new TypeError(typeErrorMessage('Node.js Stream', value));
	}
}

export function assertNonEmptyArray<T = unknown, Item = unknown>(value: T | Item[]): asserts value is [Item, ...Item[]] {
	if (!isNonEmptyArray(value)) {
		throw new TypeError(typeErrorMessage('non-empty array', value));
	}
}

export function assertNonEmptyMap<Key = unknown, Value = unknown>(value: unknown): asserts value is Map<Key, Value> {
	if (!isNonEmptyMap(value)) {
		throw new TypeError(typeErrorMessage('non-empty map', value));
	}
}

export function assertNonEmptyObject<Key extends keyof any = string, Value = unknown>(value: unknown): asserts value is Record<Key, Value> {
	if (!isNonEmptyObject(value)) {
		throw new TypeError(typeErrorMessage('non-empty object', value));
	}
}

export function assertNonEmptySet<T = unknown>(value: unknown): asserts value is Set<T> {
	if (!isNonEmptySet(value)) {
		throw new TypeError(typeErrorMessage('non-empty set', value));
	}
}

export function assertNonEmptyString(value: unknown): asserts value is string {
	if (!isNonEmptyString(value)) {
		throw new TypeError(typeErrorMessage('non-empty string', value));
	}
}

export function assertNonEmptyStringAndNotWhitespace(value: unknown): asserts value is string {
	if (!isNonEmptyStringAndNotWhitespace(value)) {
		throw new TypeError(typeErrorMessage('non-empty string and not whitespace', value));
	}
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function assertNull(value: unknown): asserts value is null {
	if (!isNull(value)) {
		throw new TypeError(typeErrorMessage('null', value));
	}
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function assertNullOrUndefined(value: unknown): asserts value is null | undefined {
	if (!isNullOrUndefined(value)) {
		throw new TypeError(typeErrorMessage('null or undefined', value));
	}
}

export function assertNumber(value: unknown): asserts value is number {
	if (!isNumber(value)) {
		throw new TypeError(typeErrorMessage('number', value));
	}
}

export function assertNumericString(value: unknown): asserts value is `${number}` {
	if (!isNumericString(value)) {
		throw new TypeError(typeErrorMessage('string with a number', value));
	}
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function assertObject(value: unknown): asserts value is object {
	if (!isObject(value)) {
		throw new TypeError(typeErrorMessage('Object', value));
	}
}

export function assertObservable(value: unknown): asserts value is ObservableLike {
	if (!isObservable(value)) {
		throw new TypeError(typeErrorMessage('Observable', value));
	}
}

export function assertOddInteger(value: number): asserts value is number {
	if (!isOddInteger(value)) {
		throw new TypeError(typeErrorMessage('odd integer', value));
	}
}

export function assertPlainObject<Value = unknown>(value: unknown): asserts value is Record<PropertyKey, Value> {
	if (!isPlainObject(value)) {
		throw new TypeError(typeErrorMessage('plain object', value));
	}
}

export function assertPositiveNumber(value: unknown): asserts value is number {
	if (!isPositiveNumber(value)) {
		throw new TypeError(typeErrorMessage('positive number', value));
	}
}

export function assertPrimitive(value: unknown): asserts value is Primitive {
	if (!isPrimitive(value)) {
		throw new TypeError(typeErrorMessage('primitive', value));
	}
}

export function assertPromise<T = unknown>(value: unknown): asserts value is Promise<T> {
	if (!isPromise(value)) {
		throw new TypeError(typeErrorMessage('Promise', value));
	}
}

export function assertPropertyKey(value: unknown): asserts value is number {
	if (!isPropertyKey(value)) {
		throw new TypeError(typeErrorMessage('PropertyKey', value));
	}
}

export function assertRegExp(value: unknown): asserts value is RegExp {
	if (!isRegExp(value)) {
		throw new TypeError(typeErrorMessage('RegExp', value));
	}
}

export function assertSafeInteger(value: unknown): asserts value is number {
	if (!isSafeInteger(value)) {
		throw new TypeError(typeErrorMessage('integer', value));
	}
}

export function assertSet<T = unknown>(value: unknown): asserts value is Set<T> {
	if (!isSet(value)) {
		throw new TypeError(typeErrorMessage('Set', value));
	}
}

export function assertSharedArrayBuffer(value: unknown): asserts value is SharedArrayBuffer {
	if (!isSharedArrayBuffer(value)) {
		throw new TypeError(typeErrorMessage('SharedArrayBuffer', value));
	}
}

export function assertString(value: unknown): asserts value is string {
	if (!isString(value)) {
		throw new TypeError(typeErrorMessage('string', value));
	}
}

export function assertSymbol(value: unknown): asserts value is symbol {
	if (!isSymbol(value)) {
		throw new TypeError(typeErrorMessage('symbol', value));
	}
}

export function assertTruthy<T>(value: T | Falsy): asserts value is T {
	if (!isTruthy(value)) {
		throw new TypeError(typeErrorMessage('truthy', value));
	}
}

export function assertTupleLike<T extends Array<TypeGuard<unknown>>>(value: unknown, guards: [...T]): asserts value is ResolveTypesOfTypeGuardsTuple<T> {
	if (!isTupleLike(value, guards)) {
		throw new TypeError(typeErrorMessage('tuple-like', value));
	}
}

export function assertTypedArray(value: unknown): asserts value is TypedArray {
	if (!isTypedArray(value)) {
		throw new TypeError(typeErrorMessage('TypedArray', value));
	}
}

export function assertUint16Array(value: unknown): asserts value is Uint16Array {
	if (!isUint16Array(value)) {
		throw new TypeError(typeErrorMessage('Uint16Array', value));
	}
}

export function assertUint32Array(value: unknown): asserts value is Uint32Array {
	if (!isUint32Array(value)) {
		throw new TypeError(typeErrorMessage('Uint32Array', value));
	}
}

export function assertUint8Array(value: unknown): asserts value is Uint8Array {
	if (!isUint8Array(value)) {
		throw new TypeError(typeErrorMessage('Uint8Array', value));
	}
}

export function assertUint8ClampedArray(value: unknown): asserts value is Uint8ClampedArray {
	if (!isUint8ClampedArray(value)) {
		throw new TypeError(typeErrorMessage('Uint8ClampedArray', value));
	}
}

export function assertUndefined(value: unknown): asserts value is undefined {
	if (!isUndefined(value)) {
		throw new TypeError(typeErrorMessage('undefined', value));
	}
}

export function assertUrlInstance(value: unknown): asserts value is URL {
	if (!isUrlInstance(value)) {
		throw new TypeError(typeErrorMessage('URL', value));
	}
}

// eslint-disable-next-line unicorn/prevent-abbreviations
export function assertUrlSearchParams(value: unknown): asserts value is URLSearchParams {
	if (!isUrlSearchParams(value)) {
		throw new TypeError(typeErrorMessage('URLSearchParams', value));
	}
}

export function assertUrlString(value: unknown): asserts value is string {
	if (!isUrlString(value)) {
		throw new TypeError(typeErrorMessage('string with a URL', value));
	}
}

export function assertValidDate(value: unknown): asserts value is Date {
	if (!isValidDate(value)) {
		throw new TypeError(typeErrorMessage('valid Date', value));
	}
}

export function assertValidLength(value: unknown): asserts value is number {
	if (!isValidLength(value)) {
		throw new TypeError(typeErrorMessage('valid length', value));
	}
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function assertWeakMap<Key extends object = object, Value = unknown>(value: unknown): asserts value is WeakMap<Key, Value> {
	if (!isWeakMap(value)) {
		throw new TypeError(typeErrorMessage('WeakMap', value));
	}
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function assertWeakRef<T extends object = object>(value: unknown): asserts value is WeakRef<T> {
	if (!isWeakRef(value)) {
		throw new TypeError(typeErrorMessage('WeakRef', value));
	}
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function assertWeakSet<T extends object = object>(value: unknown): asserts value is WeakSet<T> {
	if (!isWeakSet(value)) {
		throw new TypeError(typeErrorMessage('WeakSet', value));
	}
}

export function assertWhitespaceString(value: unknown): asserts value is string {
	if (!isWhitespaceString(value)) {
		throw new TypeError(typeErrorMessage('whitespace string', value));
	}
}

export default is;

export type {
	ArrayLike,
	Class,
	NodeStream,
	ObservableLike,
	Predicate,
	Primitive,
	TypedArray,
} from './types.js';
