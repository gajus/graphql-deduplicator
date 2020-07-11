// @flow

type NodeType = Object | $ReadOnlyArray<NodeType>;

// eslint-disable-next-line complexity
const inflate = (node: NodeType, index: Object, path: $ReadOnlyArray<string>): NodeType => {
  if (Array.isArray(node)) {
    return node.map((childNode) => {
      if (typeof childNode === 'string' || typeof childNode === 'number' || typeof childNode === 'boolean') {
        return childNode;
      } else {
        return inflate(childNode, index, path);
      }
    });
  } else {
    if (node && node.id && node.__typename) {
      const route = path.join(',');

      if (index[route] && index[route][node.__typename] && index[route][node.__typename][node.id]) {
        return index[route][node.__typename][node.id];
      }

      if (!index[route]) {
        index[route] = {};
      }

      if (!index[route][node.__typename]) {
        index[route][node.__typename] = {};
      }

      index[route][node.__typename][node.id] = node;
    }
    const fieldNames = Object.keys(node);
    const result = {};
    for (const fieldName of fieldNames) {
      const value = node[fieldName];

      if (Array.isArray(value) || typeof value === 'object' && value !== null) {
        result[fieldName] = inflate(value, index, path.concat([fieldName]));
      } else {
        result[fieldName] = value;
      }
    }

    return result;
  }
};

export default (response: Object) => {
  const index = {};

  return inflate(response, index, []);
};
