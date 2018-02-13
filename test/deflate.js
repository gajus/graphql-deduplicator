// @flow

/* eslint-disable id-match */

import invariant from 'assert';
import test from 'ava';
import deflate from '../src/deflate';

test('does not modify object without __typename and ID', (t) => {
  const response = {
    foo: 'bar'
  };

  const deflatedResponse = deflate(response);

  t.deepEqual(deflatedResponse, {
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

  const deflatedResponse = deflate(response);

  invariant(deflatedResponse.data && deflatedResponse.data.length === 2);

  t.deepEqual(deflatedResponse.data[0], {
    __typename: 'foo',
    id: 1,
    name: 'foo'
  });

  t.deepEqual(deflatedResponse.data[1], {
    __typename: 'foo',
    id: 1
  });
});
