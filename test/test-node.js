import assert from 'node:assert';
import {test} from 'node:test';
import is, {assert as isAssert} from '../distribution/index.js';

// Note: this test is separate from the rest of the tests, as it requires
// preserving whitespace. The tsimp modifies the source and does not
// properly preserve the intended test case
test('is.class', () => {
	const minifiedClass = class{}; // eslint-disable-line keyword-spacing
	assert.ok(is.class(minifiedClass));

	assert.doesNotThrow(() => {
		isAssert.class(minifiedClass);
	});
});
