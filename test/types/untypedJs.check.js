// ./test/types/untypedJs.check.js
//
// The dice3D-js pattern that a 0.4.0 pre-release broke (src/ui/choiceControls.js,
// checkJs): an untyped JSDoc parameter is `any`; after `isInteger`, a
// variable initialised from it must still take plain numbers. Type-checked
// (allowJs + checkJs) in strict and loose mode by `npm run test:types`.
import { isFiniteNumber, isInteger, isNonEmptyString } from '../../dist/index.js';

/**
 * @param {*} currentIndex
 * @param {number} columnCount
 * @param {number} choiceCount
 * @returns {number}
 */
export function resolveNextChoiceIndex(currentIndex, columnCount, choiceCount) {
  if (!isInteger(currentIndex) || currentIndex < 0 || currentIndex >= choiceCount) return -1;
  let lastRowIndex = currentIndex;
  while (lastRowIndex + columnCount < choiceCount) lastRowIndex += columnCount;
  return lastRowIndex;
}

/**
 * Untyped parameters (implicitly `any` in a JS file).
 * @param {*} width
 * @param {*} label
 */
export function describeSize(width, label) {
  let total = 0;
  if (isFiniteNumber(width)) {
    let clamped = width;
    if (clamped > 100) clamped = 100;
    total += clamped;
  }
  let text = isNonEmptyString(label) ? label : '';
  text += ` ${total}`;
  return text;
}
