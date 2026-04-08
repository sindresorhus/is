import is, {
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
	type SafeInteger,
	type ValidLength,
} from '../source/index.ts';

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
