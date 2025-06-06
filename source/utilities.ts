export function keysOf<T extends Record<PropertyKey, unknown>>(value: T): Array<keyof T> {
	return Object.keys(value) as Array<keyof T>;
}
