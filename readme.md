# is [![Build Status](https://travis-ci.org/sindresorhus/is.svg?branch=master)](https://travis-ci.org/sindresorhus/is)

> Type check values: `is.string('🦄') //=> true`

<img src="header.gif" width="182" align="right">


## Install

```
$ npm install @sindresorhus/is
```


## Usage

```js
const is = require('@sindresorhus/is');

is('🦄');
//=> 'string'

is(new Map());
//=> 'Map'

is.number(6);
//=> true
```


## API

### is(value)

Returns the type of `value`.

Primitives are lowercase and object types are camelcase.

Example:

- `'undefined'`
- `'null'`
- `'string'`
- `'symbol'`
- `'Array'`
- `'Function'`
- `'Object'`

Note: It will throw if you try to feed it object-wrapped primitives, as that's a bad practice. For example `new String('foo')`.

### is.{method}

All the below methods accept a value and returns a boolean for whether the value is of the desired type.

#### Primitives

##### .undefined(value)
##### .null(value)
##### .string(value)
##### .number(value)
##### .boolean(value)
##### .symbol(value)

#### Built-in types

##### .array(value)
##### .function(value)
##### .buffer(value)
##### .object(value)

Keep in mind that [functions are objects too](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions).

##### .regExp(value)
##### .date(value)
##### .error(value)
##### .nativePromise(value)
##### .promise(value)

Returns `true` for any object with a `.then()` and `.catch()` method. Prefer this one over `.nativePromise()` as you usually want to allow userland promise implementations too.

##### .generator(value)
##### .generatorFunction(value)

##### .map(value)
##### .set(value)
##### .weakMap(value)
##### .weakSet(value)

#### Typed arrays

##### .int8Array(value)
##### .uint8Array(value)
##### .uint8ClampedArray(value)
##### .int16Array(value)
##### .uint16Array(value)
##### .int32Array(value)
##### .uint32Array(value)
##### .float32Array(value)
##### .float64Array(value)

#### Structured data

##### .arrayBuffer(value)
##### .sharedArrayBuffer(value)
##### .dataView(value)

#### Miscellaneous

##### .nan(value)
##### .nullOrUndefined(value)
##### .primitive(value)

JavaScript primitives are as follows: `null`, `undefined`, `string`, `number`, `boolean`, `symbol`.

##### .integer(value)
##### .plainObject(value)

An object is plain if it's created by either `{}`, `new Object()`, or `Object.create(null)`.

##### .iterable(value)
##### .class(value)

Returns `true` for instances created by a ES2015 class.

##### .typedArray(value)


## FAQ

### Why yet another type checking module?

There are hundreds of type checking modules on npm, unfortunately, I couldn't find any that fit my needs:

- Includes both type methods and ability to get the type
- Types of primitives returned as lowercase and object types as camelcase
- Covers all built-ins
- Unsurprising behavior
- Well-maintained
- Comprehensive test suite

For the ones I found, pick 3 of these.

The most common mistakes I noticed in these modules was using `instanceof` for type checking, forgetting that functions are objects, and omitting `symbol` as a primitive.


## Related

- [is-stream](https://github.com/sindresorhus/is-stream) - Check if something is a Node.js stream
- [is-observable](https://github.com/sindresorhus/is-observable) - Check if a value is an Observable
- [file-type](https://github.com/sindresorhus/file-type) - Detect the file type of a Buffer/Uint8Array
- [is-ip](https://github.com/sindresorhus/is-ip) - Check if a string is an IP address
- [is-array-sorted](https://github.com/sindresorhus/is-array-sorted) - Check if an Array is sorted
- [is-error-constructor](https://github.com/sindresorhus/is-error-constructor) - Check if a value is an error constructor
- [is-empty-iterable](https://github.com/sindresorhus/is-empty-iterable) - Check if an Iterable is empty


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
