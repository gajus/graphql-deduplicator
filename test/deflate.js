// @flow

/* eslint-disable id-match */

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

  t.deepEqual(deflatedResponse, {
    data: [
      {
        __typename: 'foo',
        id: 1,
        name: 'foo'
      },
      {
        __typename: 'foo',
        id: 1
      }
    ]
  });
});

test('does not modify first instance of an object; removes known entity properties (nested; different path)', (t) => {
  const response = {
    data: [
      {
        __typename: 'foo',
        bar1: {
          __typename: 'bar',
          id: 1,
          name: 'red'
        },
        bar2: {
          __typename: 'bar',
          id: 1,
          name: 'bar'
        },
        id: 1
      },
      {
        __typename: 'foo',
        bar1: {
          __typename: 'bar',
          id: 1,
          name: 'bar'
        },
        bar2: {
          __typename: 'bar',
          id: 1,
          name: 'bar'
        },
        id: 2
      }
    ]
  };

  const deflatedResponse = deflate(response);

  t.deepEqual(deflatedResponse, {
    data: [
      {
        __typename: 'foo',
        bar1: {
          __typename: 'bar',
          id: 1,
          name: 'red'
        },
        bar2: {
          __typename: 'bar',
          id: 1,
          name: 'bar'
        },
        id: 1
      },
      {
        __typename: 'foo',
        bar1: {
          __typename: 'bar',
          id: 1
        },
        bar2: {
          __typename: 'bar',
          id: 1
        },
        id: 2
      }
    ]
  });
});
