// Every named guard/assert must also be declared on both namespaces.
import * as mod from '../../dist/index.js';
import { is as autoIs, assertType as autoAssertType } from '../../dist/auto.js';

type GuardKeys = keyof typeof mod extends infer K
  ? K extends `is${infer Name}` ? Uncapitalize<Name> : never : never;
type AssertKeys = keyof typeof mod extends infer K
  ? K extends `assert${infer Name}` ? Uncapitalize<Name> : never : never;
type ExpectNever<T extends never> = T;
type MissingNamedAsserts = ExpectNever<Exclude<`assert${Capitalize<Exclude<GuardKeys, ''>>}`, keyof typeof mod>>;
type MissingGuards = ExpectNever<Exclude<GuardKeys, '' | keyof typeof mod.is>>;
type MissingAsserts = ExpectNever<Exclude<AssertKeys, 'type' | keyof typeof mod.assertType>>;
type MissingAutoGuards = ExpectNever<Exclude<GuardKeys, '' | keyof typeof autoIs>>;
type MissingAutoAsserts = ExpectNever<Exclude<AssertKeys, 'type' | keyof typeof autoAssertType>>;

function narrow(x: unknown, y: unknown, z: unknown) {
  if (mod.is.int8Array(x)) { const bytes: Int8Array = x; void bytes; }
  mod.assertType.map(y);
  const map: Map<any, any> = y;
  autoAssertType.uint8Array(z);
  const bytes: Uint8Array = z;
  void map; void bytes;
}
void narrow;
