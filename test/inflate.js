// @flow

import test from 'ava';
import inflate from '../src/inflate';

test('inflates a deflated object', (t) => {
  const deflatedResponse = {
    data: [
      {
        __typename: 'foo',
        id: 1,
        name: 'bar',
      },
      {
        __typename: 'foo',
        id: 1,
      },
    ],
  };

  const inflatedResponse = inflate(deflatedResponse);

  t.deepEqual(inflatedResponse, {
    data: [
      {
        __typename: 'foo',
        id: 1,
        name: 'bar',
      },
      {
        __typename: 'foo',
        id: 1,
        name: 'bar',
      },
    ],
  });
});

test('inflates a deflated object (nested; different path)', (t) => {
  const deflatedResponse = {
    data: [
      {
        __typename: 'foo',
        bar1: {
          __typename: 'bar',
          id: 1,
          name: 'bar1',
        },
        bar2: {
          __typename: 'bar',
          id: 1,
          name: 'bar2',
        },
        id: 1,
      },
      {
        __typename: 'foo',
        bar1: {
          __typename: 'bar',
          id: 1,
        },
        bar2: {
          __typename: 'bar',
          id: 1,
        },
        id: 2,
      },
    ],
  };

  const inflatedResponse = inflate(deflatedResponse);

  t.deepEqual(inflatedResponse, {
    data: [
      {
        __typename: 'foo',
        bar1: {
          __typename: 'bar',
          id: 1,
          name: 'bar1',
        },
        bar2: {
          __typename: 'bar',
          id: 1,
          name: 'bar2',
        },
        id: 1,
      },
      {
        __typename: 'foo',
        bar1: {
          __typename: 'bar',
          id: 1,
          name: 'bar1',
        },
        bar2: {
          __typename: 'bar',
          id: 1,
          name: 'bar2',
        },
        id: 2,
      },
    ],
  });
});

test('inflates a deflated object (with deflated nested object)', (t) => {
  const deflatedResponse = {
    data: [
      {
        __typename: 'foo1',
        bar: {
          __typename: 'bar',
          id: 1,
          name: 'bar',
        },
        id: 1,
      },
      {
        __typename: 'foo2',
        bar: {
          __typename: 'bar',
          id: 1,
        },
        id: 2,
      },
      {
        __typename: 'foo2',
        bar: {
          __typename: 'bar',
          id: 1,
        },
        id: 2,
      },
    ],
  };

  const inflatedResponse = inflate(deflatedResponse);

  t.deepEqual(inflatedResponse, {
    data: [
      {
        __typename: 'foo1',
        bar: {
          __typename: 'bar',
          id: 1,
          name: 'bar',
        },
        id: 1,
      },
      {
        __typename: 'foo2',
        bar: {
          __typename: 'bar',
          id: 1,
          name: 'bar',
        },
        id: 2,
      },
      {
        __typename: 'foo2',
        bar: {
          __typename: 'bar',
          id: 1,
          name: 'bar',
        },
        id: 2,
      },
    ],
  });
});

test('does not deconstruct an array of string', (t) => {
  const deflatedResponse = {
    data: {
      __typename: 'foo',
      id: 1,
      names: [
        'foo',
        'bar1',
        'bar2',
      ],
    },
  };

  const inflatedResponse = inflate(deflatedResponse);

  t.deepEqual(inflatedResponse, {
    data: {
      __typename: 'foo',
      id: 1,
      names: [
        'foo',
        'bar1',
        'bar2',
      ],
    },
  });
});

test('does not deconstruct an array of numbers', (t) => {
  const deflatedResponse = {
    data: {
      __typename: 'foo',
      id: 1,
      numbers: [
        1,
        2,
        3,
      ],
    },
  };

  const inflatedResponse = inflate(deflatedResponse);

  t.deepEqual(inflatedResponse, {
    data: {
      __typename: 'foo',
      id: 1,
      numbers: [
        1,
        2,
        3,
      ],
    },
  });
});

test('does not deconstruct an array of booleans', (t) => {
  const response = {
    data: {
      __typename: 'foo',
      bools: [
        true,
        false,
        false,
      ],
      id: 1,
    },
  };

  const deflatedResponse = inflate(response);

  t.deepEqual(deflatedResponse, {
    data: {
      __typename: 'foo',
      bools: [
        true,
        false,
        false,
      ],
      id: 1,
    },
  });
});

test('does not deconstruct a nested array', (t) => {
  const response = {
    data: {
      __typename: 'foo',
      names: [
        [
          'foo',
          'bar1',
          'bar2',
        ],
      ],
    },
  };

  const inflatedResponse = inflate(response);

  t.deepEqual(inflatedResponse, {
    data: {
      __typename: 'foo',
      names: [
        [
          'foo',
          'bar1',
          'bar2',
        ],
      ],
    },
  });
});
