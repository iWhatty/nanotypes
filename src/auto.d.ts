// ./src/auto.d.ts
//
// `nanotypes/auto` extends the runtime surface of the default entry with
// scanner-discovered globals. TypeScript can only narrow against the
// statically-declared surface, so the types here match `index.d.ts`
// exactly. Extra runtime guards need a local type assertion or declaration.

export * from './index';
