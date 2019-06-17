// @flow

// eslint-disable-next-line complexity
const inflate = (node: Object, index: Object, path: $ReadOnlyArray<string>, key) => {
  if (node && node[key] && node.__typename) {
    const route = path.join(',');

    if (index[route] && index[route][node.__typename] && index[route][node.__typename][node[key]]) {
      return index[route][node.__typename][node[key]];
    }

    if (!index[route]) {
      index[route] = {};
    }

    if (!index[route][node.__typename]) {
      index[route][node.__typename] = {};
    }

    index[route][node.__typename][node[key]] = node;
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

        return inflate(childNode, index, path.concat([fieldName]), key);
      });
    } else if (typeof value === 'object' && value !== null) {
      result[fieldName] = inflate(value, index, path.concat([fieldName]), key);
    } else {
      result[fieldName] = value;
    }
  }

  return result;
};

export default (response: Object, key: string = 'id') => {
  const index = {};

  return inflate(response, index, [], key);
};
