// @flow

// eslint-disable-next-line complexity
const deflate = (node: Object, index: Object, path: $ReadOnlyArray<string>) => {
  if (node && node.id && node.__typename) {
    const route = path.join(',');

    if (index[route] && index[route][node.__typename] && index[route][node.__typename][node.id]) {
      return {
        // eslint-disable-next-line id-match
        __typename: node.__typename,
        id: node.id
      };
    } else {
      if (!index[route]) {
        index[route] = {};
      }

      if (!index[route][node.__typename]) {
        index[route][node.__typename] = {};
      }

      index[route][node.__typename][node.id] = true;
    }
  }

  const fieldNames = Object.keys(node);

  for (const fieldName of fieldNames) {
    const value = node[fieldName];

    if (Array.isArray(value)) {
      node[fieldName] = value.map((childNode) => {
        return deflate(childNode, index, path.concat([fieldName]));
      });
    } else if (typeof value === 'object' && value !== null) {
      node[fieldName] = deflate(value, index, path.concat([fieldName]));
    } else {
      node[fieldName] = value;
    }
  }

  return node;
};

export default (response: Object) => {
  const index = {};

  return deflate(response, index, []);
};
