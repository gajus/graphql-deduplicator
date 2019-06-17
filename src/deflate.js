// @flow

// eslint-disable-next-line complexity
const deflate = (node: Object, index: Object, path: $ReadOnlyArray<string>, key: string) => {
  if (node && node[key] && node.__typename) {
    const route = path.join(',');

    if (index[route] && index[route][node.__typename] && index[route][node.__typename][node[key]]) {
      return {
        // eslint-disable-next-line id-match
        __typename: node.__typename,
        [key]: node[key]
      };
    } else {
      if (!index[route]) {
        index[route] = {};
      }

      if (!index[route][node.__typename]) {
        index[route][node.__typename] = {};
      }

      index[route][node.__typename][node[key]] = true;
    }
  }

  const fieldNames = Object.keys(node);

  const result = {};

  for (const fieldName of fieldNames) {
    const value = node[fieldName];

    if (Array.isArray(value)) {
      result[fieldName] = value.map((childNode) => {
        if (typeof childNode === 'string') {
          return childNode;
        }

        return deflate(childNode, index, path.concat([fieldName]), key);
      });
    } else if (typeof value === 'object' && value !== null) {
      result[fieldName] = deflate(value, index, path.concat([fieldName]), key);
    } else {
      result[fieldName] = value;
    }
  }

  return result;
};

export default (response: Object, key: string = 'id') => {
  const index = {};

  return deflate(response, index, [], key);
};
