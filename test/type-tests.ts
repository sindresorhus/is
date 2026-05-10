import {expectTypeOf} from 'expect-type';
import is, {
	assert as isAssert,
	assertNotNullOrUndefined,
	assertNotPrimitive,
	assertNotString,
	assertNotUndefined,
	type EvenInteger,
	type FiniteNumber,
	type Integer,
	type NaN as NaNType,
	type NegativeInfinity,
	type NegativeInteger,
	type NegativeNumber,
	type NonNegativeInteger,
	type NonNegativeNumber,
	type OddInteger,
	type PositiveInfinity,
	type PositiveInteger,
	type PositiveNumber,
	type Primitive,
	type SafeInteger,
	type ValidLength,
} from '../source/index.ts';

// eslint-disable-next-line @typescript-eslint/no-restricted-types
type UnknownNotPrimitive<Forbidden extends Primitive> = Exclude<Primitive, Forbidden> | object;

// For each predicate, verify two things:
// 1. True branch narrows to the branded type.
// 2. False branch on a `number` input stays `number` (not `never`).
//    Without the branded types, `Exclude<number, number>` = `never` would break
//    the common validation-guard pattern: if (!is.X(n)) throw; use(n).

const nanCheck = (value: number) => {
	if (is.nan(value)) {
		const _: NaNType = value;
	} else {
		const _: number = value;
	}
};

const finiteNumberCheck = (value: number) => {
	if (is.finiteNumber(value)) {
		const _: FiniteNumber = value;
	} else {
		const _: number = value;
	}
};

const nonNegativeNumberCheck = (value: number) => {
	if (is.nonNegativeNumber(value)) {
		const _: NonNegativeNumber = value;
	} else {
		const _: number = value;
	}
};

const positiveIntegerCheck = (value: number) => {
	if (is.positiveInteger(value)) {
		const _: PositiveInteger = value;
		const __: Integer = value;
		const ___: NonNegativeInteger = value;
	} else {
		const _: number = value;
	}
};

const negativeIntegerCheck = (value: number) => {
	if (is.negativeInteger(value)) {
		const _: NegativeInteger = value;
		const __: Integer = value;
	} else {
		const _: number = value;
	}
};

const nonNegativeIntegerCheck = (value: number) => {
	if (is.nonNegativeInteger(value)) {
		const _: NonNegativeInteger = value;
		const __: Integer = value;
	} else {
		const _: number = value;
	}
};

const infiniteCheck = (value: number) => {
	if (is.infinite(value)) {
		const _: PositiveInfinity | NegativeInfinity = value;
		const __: PositiveNumber | NegativeNumber = value;
	} else {
		const _: number = value;
	}
};

const integerCheck = (value: number) => {
	if (is.integer(value)) {
		const _: Integer = value;
		const __: FiniteNumber = value;
	} else {
		const _: number = value;
	}
};

const safeIntegerCheck = (value: number) => {
	if (is.safeInteger(value)) {
		const _: SafeInteger = value;
		const __: Integer = value;
	} else {
		const _: number = value;
	}
};

const evenIntegerCheck = (value: number) => {
	if (is.evenInteger(value)) {
		const _: EvenInteger = value;
		const __: Integer = value;
	} else {
		const _: number = value;
	}
};

const oddIntegerCheck = (value: number) => {
	if (is.oddInteger(value)) {
		const _: OddInteger = value;
		const __: Integer = value;
	} else {
		const _: number = value;
	}
};

const positiveNumberCheck = (value: number) => {
	if (is.positiveNumber(value)) {
		const _: PositiveNumber = value;
		const __: NonNegativeNumber = value;
	} else {
		const _: number = value;
	}
};

const negativeNumberCheck = (value: number) => {
	if (is.negativeNumber(value)) {
		const _: NegativeNumber = value;
	} else {
		const _: number = value;
	}
};

const validLengthCheck = (value: number) => {
	if (is.validLength(value)) {
		const _: ValidLength = value;
		const __: SafeInteger = value;
		const ___: NonNegativeInteger = value;
	} else {
		const _: number = value;
	}
};

const integerUnknownCheck = (value: unknown) => {
	if (is.integer(value)) {
		const _: Integer = value;
		const __: FiniteNumber = value;
	}
};

const positiveIntegerUnknownCheck = (value: unknown) => {
	if (is.positiveInteger(value)) {
		const _: PositiveInteger = value;
		const __: NonNegativeInteger = value;
	}
};

const integerMixedUnionCheck = (value: string | number) => {
	if (is.integer(value)) {
		const _: number = value;
	} else {
		const _: string = value;
	}
};

const positiveNumberMixedUnionCheck = (value: string | number) => {
	if (is.positiveNumber(value)) {
		const _: number = value;
	} else {
		const _: string = value;
	}
};

const chainedNumericGuardCheck = (value: number) => {
	if (is.positiveNumber(value) && is.integer(value)) {
		const _: PositiveNumber = value;
		const __: Integer = value;
		const ___: FiniteNumber = value;
	}
};

const distinctNumericBrandsStayDistinct = (
	positiveInteger: PositiveInteger,
	negativeInteger: NegativeInteger,
	validLength: ValidLength,
) => {
	// @ts-expect-error -- Distinct numeric refinements must not collapse into each other.
	const _: NegativeInteger = positiveInteger;
	// @ts-expect-error -- ValidLength is non-negative and must not become a signed integer refinement.
	const __: NegativeInteger = validLength;

	return negativeInteger;
};

const assertNotUndefinedCheck = (value: string | undefined) => {
	isAssert.not.undefined(value);
	expectTypeOf(value).toEqualTypeOf<string>();
};

const assertNotUndefinedUnknownCheck = (value: unknown) => {
	isAssert.not.undefined(value);
	expectTypeOf(value).toEqualTypeOf<UnknownNotPrimitive<undefined>>();
};

const assertNotUndefinedGenericCheck = <T>(value: T) => {
	isAssert.not.undefined(value);
	const _: Exclude<T, undefined> = value;
};

const nullValue = null;
type Null = typeof nullValue;

const assertNotNullUnknownCheck = (value: unknown) => {
	isAssert.not.null(value);
	expectTypeOf(value).toEqualTypeOf<UnknownNotPrimitive<Null>>();
};

const assertNotNullOrUndefinedCheck = (value: string | Null | undefined) => {
	isAssert.not.nullOrUndefined(value);
	expectTypeOf(value).toEqualTypeOf<string>();
};

const assertNotNullOrUndefinedUnknownCheck = (value: unknown) => {
	isAssert.not.nullOrUndefined(value);
	expectTypeOf(value).toEqualTypeOf<UnknownNotPrimitive<Null | undefined>>();
};

const assertNotStringCheck = (value: string | number) => {
	isAssert.not.string(value);
	expectTypeOf(value).toEqualTypeOf<number>();
};

const assertNotStringUnknownCheck = (value: unknown) => {
	isAssert.not.string(value);
	expectTypeOf(value).toEqualTypeOf<UnknownNotPrimitive<string>>();
};

const assertNotStringGenericCheck = <T>(value: T) => {
	isAssert.not.string(value);
	const _: Exclude<T, string> = value;
};

const assertNotBooleanUnknownCheck = (value: unknown) => {
	isAssert.not.boolean(value);
	expectTypeOf(value).toEqualTypeOf<UnknownNotPrimitive<boolean>>();
};

const assertNotSymbolUnknownCheck = (value: unknown) => {
	isAssert.not.symbol(value);
	expectTypeOf(value).toEqualTypeOf<UnknownNotPrimitive<symbol>>();
};

const assertNotBigintUnknownCheck = (value: unknown) => {
	isAssert.not.bigint(value);
	expectTypeOf(value).toEqualTypeOf<UnknownNotPrimitive<bigint>>();
};

const assertNotPrimitiveUnknownCheck = (value: unknown) => {
	isAssert.not.primitive(value);
	// eslint-disable-next-line @typescript-eslint/no-restricted-types
	expectTypeOf(value).toEqualTypeOf<object>();
};

const assertNotPrimitiveGenericCheck = <T>(value: T) => {
	isAssert.not.primitive(value);
	const _: Exclude<T, Primitive> = value;
};

const assertNotNamedUndefinedExportCheck = (value: 0 | false | '' | Null | undefined | 'ok') => {
	assertNotUndefined(value);
	expectTypeOf(value).toEqualTypeOf<0 | false | '' | Null | 'ok'>();
};

const assertNotNamedNullOrUndefinedUnknownExportCheck = (value: unknown) => {
	assertNotNullOrUndefined(value);
	expectTypeOf(value).toEqualTypeOf<UnknownNotPrimitive<Null | undefined>>();
};

const assertNotNamedStringExportCheck = (value: string | number) => {
	assertNotString(value);
	expectTypeOf(value).toEqualTypeOf<number>();
};

const assertNotNamedStringUnknownExportCheck = (value: unknown) => {
	assertNotString(value);
	expectTypeOf(value).toEqualTypeOf<UnknownNotPrimitive<string>>();
};

const assertNotNamedPrimitiveUnknownExportCheck = (value: unknown) => {
	assertNotPrimitive(value);
	// eslint-disable-next-line @typescript-eslint/no-restricted-types
	expectTypeOf(value).toEqualTypeOf<object>();
};

const assertNotCallableDoesNotExistCheck = (value: string | undefined) => {
	// @ts-expect-error -- Generic negative assertions cannot safely infer complement types from arbitrary predicates.
	isAssert.not(is.undefined, value);
	const _: string | undefined = value;
};

const assertNotNumberDoesNotExistCheck = (value: string | number) => {
	// @ts-expect-error -- `is.number` rejects `NaN`, so a narrowing negative assertion would be unsound.
	isAssert.not.number(value); // eslint-disable-line @typescript-eslint/no-unsafe-call
	const _: string | number = value;
};

const assertNotIntegerDoesNotExistCheck = (value: string | number) => {
	// @ts-expect-error -- Numeric refinements are intentionally excluded from `assert.not`.
	isAssert.not.integer(value); // eslint-disable-line @typescript-eslint/no-unsafe-call
	const _: string | number = value;
};

const assertNotObjectDoesNotExistCheck = (value: Record<string, unknown> | string) => {
	// @ts-expect-error -- TypeScript's `{}` type includes primitives, so `not.object` cannot safely narrow every object-like input.
	isAssert.not.object(value); // eslint-disable-line @typescript-eslint/no-unsafe-call
	const _: Record<string, unknown> | string = value;
};

const assertNotBlobDoesNotExistCheck = (value: Blob | File | string) => {
	// @ts-expect-error -- `File` extends `Blob` in TypeScript but does not match the exact runtime `Blob` check.
	isAssert.not.blob(value); // eslint-disable-line @typescript-eslint/no-unsafe-call
	const _: Blob | File | string = value;
};

const assertNotMapDoesNotExistCheck = (value: Map<string, number> | string) => {
	// @ts-expect-error -- Structural object types such as `Map` can be assignable in TypeScript without matching the runtime brand check.
	isAssert.not.map(value); // eslint-disable-line @typescript-eslint/no-unsafe-call, unicorn/no-array-callback-reference
	const _: Map<string, number> | string = value;
};

const assertNotSetDoesNotExistCheck = (value: Set<string> | string) => {
	// @ts-expect-error -- Structural object types such as `Set` can be assignable in TypeScript without matching the runtime brand check.
	isAssert.not.set(value); // eslint-disable-line @typescript-eslint/no-unsafe-call
	const _: Set<string> | string = value;
};

const assertNotDateDoesNotExistCheck = (value: Date | string) => {
	// @ts-expect-error -- Structural object types such as `Date` can be assignable in TypeScript without matching the runtime brand check.
	isAssert.not.date(value); // eslint-disable-line @typescript-eslint/no-unsafe-call
	const _: Date | string = value;
};

// Suppress unused variable warnings
nanCheck(42);
finiteNumberCheck(42);
nonNegativeNumberCheck(42);
positiveIntegerCheck(42);
negativeIntegerCheck(-1);
nonNegativeIntegerCheck(0);
infiniteCheck(Number.POSITIVE_INFINITY);
integerCheck(1);
safeIntegerCheck(1);
evenIntegerCheck(2);
oddIntegerCheck(1);
positiveNumberCheck(1);
negativeNumberCheck(-1);
validLengthCheck(0);
integerUnknownCheck(1);
positiveIntegerUnknownCheck(1);
integerMixedUnionCheck(1);
positiveNumberMixedUnionCheck(1);
chainedNumericGuardCheck(1);
distinctNumericBrandsStayDistinct(42 as PositiveInteger, -1 as NegativeInteger, 0 as ValidLength);
assertNotUndefinedCheck('🦄');
assertNotUndefinedUnknownCheck('🦄');
assertNotUndefinedGenericCheck<string | undefined>('🦄');
assertNotNullUnknownCheck('🦄');
assertNotNullOrUndefinedCheck('🦄');
assertNotNullOrUndefinedUnknownCheck('🦄');
assertNotStringCheck(1);
assertNotStringUnknownCheck(1);
assertNotStringGenericCheck<string | number>(1);
assertNotBooleanUnknownCheck(1);
assertNotSymbolUnknownCheck(1);
assertNotBigintUnknownCheck(1);
assertNotPrimitiveUnknownCheck({});
assertNotPrimitiveGenericCheck<string | {unicorn: true}>({unicorn: true});
assertNotNamedUndefinedExportCheck(0);
assertNotNamedNullOrUndefinedUnknownExportCheck('🦄');
assertNotNamedStringExportCheck(1);
assertNotNamedStringUnknownExportCheck(1);
assertNotNamedPrimitiveUnknownExportCheck({});
assertNotCallableDoesNotExistCheck('🦄');
assertNotNumberDoesNotExistCheck(Number.NaN);
assertNotIntegerDoesNotExistCheck(1.5);
assertNotObjectDoesNotExistCheck('🦄');
assertNotBlobDoesNotExistCheck('🦄');
assertNotMapDoesNotExistCheck('🦄');
assertNotSetDoesNotExistCheck('🦄');
assertNotDateDoesNotExistCheck('🦄');
