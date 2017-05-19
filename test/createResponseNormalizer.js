// @flow

/* eslint-disable id-match */

import invariant from 'assert';
import test from 'ava';
import {
  createResponseNormalizer
} from '../src';

test('does not modify object without __typename and ID', (t) => {
  const response = {
    foo: 'bar'
  };

  const normalizedResponse = createResponseNormalizer()(response);

  t.deepEqual(normalizedResponse, {
    foo: 'bar'
  });
});

test('does not modify first instance of an object; removes known entity properties', (t) => {
  const response = {
    data: [
      {
        __typename: 'foo',
        id: 1,
        name: 'foo'
      },
      {
        __typename: 'foo',
        id: 1,
        name: 'foo'
      }
    ]
  };

  const normalizedResponse = createResponseNormalizer()(response);

  invariant(normalizedResponse.data && normalizedResponse.data.length === 2);

  t.deepEqual(normalizedResponse.data[0], {
    __typename: 'foo',
    id: 1,
    name: 'foo'
  });

  t.deepEqual(normalizedResponse.data[1], {
    __typename: 'foo',
    id: 1
  });
});
