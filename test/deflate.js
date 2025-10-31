// @flow

import test from 'ava';
import deflate from '../src/deflate';

test('does not modify object without __typename and ID', (t) => {
  const response = {
    foo: 'bar',
  };

  const deflatedResponse = deflate(response);

  t.deepEqual(deflatedResponse, {
    foo: 'bar',
  });
});

test('does not modify first instance of an object; removes known entity properties', (t) => {
  const response = {
    data: [
      {
        __typename: 'foo',
        id: 1,
        name: 'foo',
      },
      {
        __typename: 'foo',
        id: 1,
        name: 'foo',
      },
    ],
  };

  const deflatedResponse = deflate(response);

  t.deepEqual(deflatedResponse, {
    data: [
      {
        __typename: 'foo',
        id: 1,
        name: 'foo',
      },
      {
        __typename: 'foo',
        id: 1,
      },
    ],
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

  t.deepEqual(deflatedResponse, {
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
        },
        bar2: {
          __typename: 'bar',
          id: 1,
        },
        id: 2,
      },
    ],
  });
});

test('does not modify the input', (t) => {
  const response = {
    data: [
      {
        __typename: 'foo',
        id: 1,
        name: 'foo',
      },
      {
        __typename: 'foo',
        id: 1,
        name: 'foo',
      },
    ],
  };

  deflate(response);

  t.deepEqual(response, {
    data: [
      {
        __typename: 'foo',
        id: 1,
        name: 'foo',
      },
      {
        __typename: 'foo',
        id: 1,
        name: 'foo',
      },
    ],
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
        'bar2',
      ],
    },
  };

  const deflatedResponse = deflate(response);

  t.deepEqual(deflatedResponse, {
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
  const response = {
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

  const deflatedResponse = deflate(response);

  t.deepEqual(deflatedResponse, {
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

  const deflatedResponse = deflate(response);

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

  const deflatedResponse = deflate(response);

  t.deepEqual(deflatedResponse, {
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

test('does not modify null values', (t) => {
  const response = {
    data: null,
  };

  const deflatedResponse = deflate(response);

  t.deepEqual(deflatedResponse, {
    data: null,
  });
});

test('does not modify objects with null fields', (t) => {
  const response = {
    bar: null,
    foo: {
      __typename: 'foo',
      id: 1,
      name: 'bar',
    },
  };

  const deflatedResponse = deflate(response);

  t.deepEqual(deflatedResponse, {
    bar: null,
    foo: {
      __typename: 'foo',
      id: 1,
      name: 'bar',
    },
  });
});

test('does not deconstruct an array with null elements', (t) => {
  const response = {
    data: [
      {
        __typename: 'foo',
        id: 1,
        items: [
          null,
        ],
      },
    ],
  };

  const deflatedResponse = deflate(response);

  t.deepEqual(deflatedResponse, {
    data: [
      {
        __typename: 'foo',
        id: 1,
        items: [
          null,
        ],
      },
    ],
  });
});
