// @flow

import test from 'ava';
import isPlainObject from '../src/isPlainObject';

test('isPlainObject', (t) => {
  t.false(isPlainObject('foo'));
  t.false(isPlainObject(null));
  t.false(isPlainObject([]));
  t.false(isPlainObject(new Map()));

  t.true(isPlainObject({}));
});
