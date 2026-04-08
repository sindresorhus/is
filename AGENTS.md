# Notes

## Branded types for type guards

TypeScript type guards narrow in both branches. If `is.integer(n)` returns `value is number` and the input is `number`, the false branch computes `Exclude<number, number>` = `never`. This makes common patterns like `if (!is.integer(n)) throw; use(n)` fail because `n` becomes `never` after the guard.

To avoid this, type guard predicates use branded types (e.g., `number & {readonly __brand: 'Integer'}`, `string & {readonly __brand: 'UrlString'}`). A branded subtype ensures the false branch stays the original type (e.g., `Exclude<number, Integer>` = `number`).

Assert functions (`asserts value is T`) don't need branded types since they throw on failure and have no false branch. They use plain types like `asserts value is number`.
