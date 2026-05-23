# CHANGELOG — `nanotypes`

> Initial cut seeded from `git log` by the host repo's `tools/seed-changelogs.mjs` script. Version groupings infer release boundaries from tags and commit subjects; rough cuts are expected — review and tighten as part of normal maintenance.

## 0.2.2 — 2026-05-23

- **fix(asserts): tree-shake regression — rewrite `wrap()` factory to direct function declarations.** Pre-0.2.2 the asserts module used `export const assertString = wrap('string', isString)` for all ~90 asserts. Bundlers cannot statically prove that the module-level `wrap(...)` initializers are side-effect-free, so even a minimal `import { assertStr, assertObject }` consumer pulled in all 91 asserts plus every guard they reference — measured at **2,230 B gz** during the 0.2.0→0.2.1 wave. The 0.2.1 fix landed for `guards.js` but `asserts.js` carried the same pattern and was deferred as "next coordinated republish" territory (host carry-forward #2). Same fix applied: every `export const assertX = wrap(...)` becomes `export function assertX(x) { if (!isX(x)) throw new TypeError(\`Expected name, got ${describe.value(x)}\`); }`. Shorthand aliases (`assertStr = assertString`, etc.) stay as identifier-reference `const`s — those are tree-shake-safe. Verified: minimal `assertStr + assertObject` consumer now bundles to **850 B gz** (down 62%). Guards-only baseline is 648 B gz; the 202 B gap is the error-template + `describe.value` overhead inherent to asserts.

## 0.2.1 — 2026-05-19

- chore(license): finalize AGPL-3.0 + WATT3D Additional Terms metadata  `f257e5a`

## 0.2.0 — 2026-05-19

_(no commits in this range)_

## 0.1.0 — 2026-05-19

- docs(README): apply @whatty README template  `18a56d4`

## 0.0.17 — 2026-05-19

- set side effects to false again  `ea20ecb`
- chore: normalize README shields row  `3d21617`
- chore: normalize repository.url case to lowercase  `3d53591`
- chore: rebrand author to WATT3D, interim license  `835820f`
- feat: relicense to AGPL-3.0 + WATT3D AI Training Rider  `4a9bd89`
- chore: deploy WATT3D AI-bot robots.txt policy  `92d71ae`
- chore: revise AI Training Rider (v2 — pre-counsel drafting fixes)  `e73453b`
- chore: rider v3 — remove gameable 0.1% safe harbor  `e650353`
- chore: rider v4 — Commercial Use restricted to Fully Open Source  `67f1d6c`

## 0.0.15 — 2026-03-19

_(no commits in this range)_

## 0.0.14 — 2026-03-19

- updated description  `d35d131`
- bumped to 0.012  `e04d894`
- testing "sideEffects": true, for bundler stabilty.  `59e3b36`

## 0.0.11 — 2026-02-22

_(no commits in this range)_

## 0.0.10 — 2026-02-21

- fix: avoid BigInt constructor guard and improve smoke testing  `0114028`
- chore: fix package metadata for npm publish  `a8da99a`
- Fixed repo ur, and added package-lock.json to repo. updated readme for v0.0.9 npm publish  `e0b0b2d`

## 0.0.9 — 2026-02-21

- refactor(core): harden guards, centralize DEV detection, and add primitive shorthands  `ce740e6`

## 0.0.8 — 2026-02-16

- Cleaned up whitespace in assertType  `70cd871`
- feat(build,core): optimize import performance and harden runtime safety  `1a219c8`

## 0.0.7 — 2025-05-24

- feat(core): add dynamic instanceof map and assertType auto-generation  `590a1f2`

## 0.0.6 — 2025-05-23

- Added sizes to readME  `7b39671`

## 0.0.5 — 2025-05-23

_(no commits in this range)_

## 0.0.4 — 2025-05-23

- Fixed typos in ReadMe  `aab9c2d`

## 0.0.2 — 2025-05-23

- Initial commit  `f64762f`
- Initial v0.0.1 commit. We export is, describe and assert  `330b035`
- Added .ignore files for git and npm.  `cf96938`
- Created string to type maps for the common instance of checks and type of checks.  `65c07d1`
- assertTypes is now dynamically built from is.js  `13d0de1`
- Updated readme to match new API surface with, is, assertType and describe  `2d394fa`
- Repo rename to NanoTypes  `5823a1d`
