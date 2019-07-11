// @flow

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
          name: 'bar'
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
          name: 'bar'
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

test('does not modify the input', (t) => {
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

  deflate(response);

  t.deepEqual(response, {
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
  });
});

test('does not deconstruct an array of string', (t) => {
  const response = {
    data: {
      __typename: 'foo',
      id: 1,
      names: [
        'foo',
        'bar1',
        'bar2'
      ]
    }
  };

  const deflatedResponse = deflate(response);

  t.deepEqual(deflatedResponse, {
    data: {
      __typename: 'foo',
      id: 1,
      names: [
        'foo',
        'bar1',
        'bar2'
      ]
    }
  });
});

// https://github.com/gajus/graphql-deduplicator/issues/13
test('regression: does not change object types', (t) => {
  const http = {
    headers: new Map([['foo', 'bar']])
  };
  const response = {
    http
  };

  const deflatedResponse: any = deflate(response);

  t.true(deflatedResponse.http.headers instanceof Map);
  t.deepEqual(deflatedResponse.http.headers.get('foo'), 'bar');
});
