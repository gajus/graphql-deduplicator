// @flow

import test from 'ava';
import deflate from '../src/deflate';
import inflate from '../src/inflate';

test('deflate() followed by inflate() returns an identical object', (t) => {
  const response = {
    data: [
      {
        __typename: 'foo',
        bar1: {
          __typename: 'bar',
          id: 1,
          name: 'bar',
        },
        bar2: {
          __typename: 'bar',
          id: 1,
          name: 'bar',
        },
        id: 1,
      },
      {
        __typename: 'foo',
        bar1: {
          __typename: 'bar',
          id: 1,
          name: 'bar',
        },
        bar2: {
          __typename: 'bar',
          id: 1,
          name: 'bar',
        },
        id: 2,
      },
    ],
  };

  const deflatedResponse = deflate(response);
  const inflatedResponse = inflate(deflatedResponse);

  t.deepEqual(inflatedResponse, response);
});
