// @flow

export default () => {
  const index = {};

  const normalizeResponse = (response: Object) => {
    if (response && response.id && response.__typename) {
      if (index[response.__typename] && index[response.__typename][response.id]) {
        return {
          // eslint-disable-next-line id-match
          __typename: response.__typename,
          id: response.id
        };
      } else {
        if (!index[response.__typename]) {
          index[response.__typename] = {};
        }

        index[response.__typename][response.id] = true;
      }
    }

    const fieldNames = Object.keys(response);

    for (const fieldName of fieldNames) {
      const value = response[fieldName];

      if (Array.isArray(value)) {
        response[fieldName] = value.map(normalizeResponse);
      } else if (typeof value === 'object' && value !== null) {
        response[fieldName] = normalizeResponse(value);
      } else {
        response[fieldName] = value;
      }
    }

    return response;
  };

  return normalizeResponse;
};
