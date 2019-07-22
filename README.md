# graphql-deduplicator

[![GitSpo Mentions](https://gitspo.com/badges/mentions/gajus/graphql-deduplicator?style=flat-square)](https://gitspo.com/mentions/gajus/graphql-deduplicator)
[![Travis build status](http://img.shields.io/travis/gajus/graphql-deduplicator/master.svg?style=flat-square)](https://travis-ci.org/gajus/graphql-deduplicator)
[![Coveralls](https://img.shields.io/coveralls/gajus/graphql-deduplicator.svg?style=flat-square)](https://github.com/gajus/graphql-deduplicator)
[![NPM version](http://img.shields.io/npm/v/graphql-deduplicator.svg?style=flat-square)](https://www.npmjs.org/package/graphql-deduplicator)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)

A GraphQL response deduplicator.

Removes duplicate entities from the GraphQL response.

- [graphql-deduplicator](#graphql-deduplicator)
  - [Client support](#Client-support)
  - [How does it work?](#How-does-it-work)
  - [Motivation](#Motivation)
  - [Real-life example](#Real-life-example)
  - [Usage](#Usage)
    - [Server-side](#Server-side)
    - [Client-side](#Client-side)
      - [Example usage with `apollo-client`](#Example-usage-with-apollo-client)
      - [Example usage with `apollo-boost`](#Example-usage-with-apollo-boost)
  - [Best practices](#Best-practices)
    - [Enable compression conditionally](#Enable-compression-conditionally)
      - [Example using with Apollo Server](#Example-using-with-Apollo-Server)

## Client support

`graphql-deduplicator` works with any GraphQL client that appends `__typename` and `id` fields to every resource. If your client automatically does not request `__typename` and `id` fields, these fields can be specified in your GraphQL query.

`graphql-deduplicator` has been tested with [`apollo-client`](https://github.com/apollographql/apollo-client).

## How does it work?

`__typename` and an `id` values are used to construct a resource identifier. The resource identifier is used to [normalize data](http://dev.apollodata.com/core/how-it-works.html#normalize). As a result, when GraphQL API response contains a resource with a repeating identifier, the `apollo-client` is going to read only the first instance of the resource and ignore duplicate entities. `graphql-deduplicator` strips body (fields other than `__datatype` and `id`) from all the duplicate entities.

## Motivation

`graphql-deduplicator` is designed to reduce the GraphQL response size by removing body of duplicate entities. This allows to make queries that return large datasets of repeated data without worrying about the cost of the response body size, time it takes to parse the response or the memory the reconstructed object will consume.

## Real-life example

Consider the following schema:

```graphql
interface Node {
  id: ID!
}

type Movie implements Node {
  id: ID!
  name: String!
  synopsis: String!
}

type Event implements Node {
  id: ID!
  movie: Movie!
  date: String!
  time: String!
}

type Query {
  events (
    date: String
  ): [Event!]!
}

```

Using this schema, you can query events for a particular date, e.g.

```graphql
{
  events (date: "2017-05-19") {
    __typename
    id
    date
    time
    movie {
      __typename
      id
      name
      synopsis
    }
  }
}

```

Note: If you are using `apollo-client`, then you do not need to include `__typename` when constructing the query.

The result of the above query will contain a lot of duplicate information.

```json
{
  "data": {
    "events": [
      {
        "__typename": "Event",
        "id": "1669971",
        "date": "2017-05-19",
        "time": "17:25",
        "movie": {
          "__typename": "Movie",
          "id": "1198359",
          "name": "King Arthur: Legend of the Sword",
          "synopsis": "When the child Arthur’s father is murdered, Vortigern, Arthur’s uncle, seizes the crown. Robbed of his birthright and with no idea who he truly is, Arthur comes up the hard way in the back alleys of the city. But once he pulls the sword Excalibur from the stone, his life is turned upside down and he is forced to acknowledge his true legacy... whether he likes it or not."
        }
      },
      {
        "__typename": "Event",
        "id": "1669972",
        "date": "2017-05-19",
        "time": "20:30",
        "movie": {
          "__typename": "Movie",
          "id": "1198359",
          "name": "King Arthur: Legend of the Sword",
          "synopsis": "When the child Arthur’s father is murdered, Vortigern, Arthur’s uncle, seizes the crown. Robbed of his birthright and with no idea who he truly is, Arthur comes up the hard way in the back alleys of the city. But once he pulls the sword Excalibur from the stone, his life is turned upside down and he is forced to acknowledge his true legacy... whether he likes it or not."
        }
      },
      // ...
    ]
  }
}

```

I've run into this situation when building https://applaudience.co.uk. A query retrieving 300 events produced a response of 1.5MB. When gziped, that number dropped to 100KB. However, the problem is that upon receiving the response, the browser needs to parse the entire JSON document. Parsing 1.5MB JSON string is (a) time consuming and (b) memory expensive.

The good news is that we do not need to return body of duplicate records (see [How does it work?](#how-does-it-work)). For all duplicate records we only need to return `__typename` and `id`. This information is enough for `apollo-client` to identify the resource as duplicate and skip it. In case when a response includes large and often repeated fragments, this will reduce the response size 10x, 100x or more times.

In case of the earlier example, the response becomes:

```json
{
  "data": {
    "events": [
      {
        "__typename": "Event",
        "id": "1669971",
        "date": "2017-05-19",
        "time": "17:25",
        "movie": {
          "__typename": "Movie",
          "id": "1198359",
          "name": "King Arthur: Legend of the Sword",
          "synopsis": "When the child Arthur’s father is murdered, Vortigern, Arthur’s uncle, seizes the crown. Robbed of his birthright and with no idea who he truly is, Arthur comes up the hard way in the back alleys of the city. But once he pulls the sword Excalibur from the stone, his life is turned upside down and he is forced to acknowledge his true legacy... whether he likes it or not."
        }
      },
      {
        "__typename": "Event",
        "id": "1669972",
        "date": "2017-05-19",
        "time": "20:30",
        "movie": {
          "__typename": "Movie",
          "id": "1198359"
        }
      },
      // ...
    ]
  }
}

```

The `synopsis` and `name` fields have been removed from the duplicate `Movie` entity.

## Usage

### Server-side

You need to format the final result of the query. If you are using [`graphql-server`](https://github.com/apollographql/graphql-server), configure `formatResponse`, e.g.

```js
import express from 'express';
import {
  graphqlExpress
} from 'graphql-server-express';
import {
  deflate
} from 'graphql-deduplicator';

const app = express();

app.use('/graphql', graphqlExpress(() => {
  return {
    formatResponse: (response) => {
      if (response.data && !response.data.__schema) {
        return deflate(response);
      }

      return response;
    }
  };
}));

app.listen(3000);

```

### Client-side

#### Example usage with `apollo-client`

You need to modify the server response before it is processed by the GraphQL client. If you are using [`apollo-client`](https://github.com/apollographql/apollo-client), use [`link`](https://www.apollographql.com/docs/react/reference/index.html#types) configuration to setup an [afterware](https://www.apollographql.com/docs/react/basics/network-layer.html#linkAfterware), e.g.

```js
// @flow

import {
  ApolloClient
} from 'apollo-client';
import {
  ApolloLink,
  concat
} from 'apollo-link';
import {
  InMemoryCache
} from 'apollo-cache-inmemory';
import {
  HttpLink
} from 'apollo-link-http';
import {
  inflate
} from 'graphql-deduplicator';

const httpLink = new HttpLink({
  credentials: 'include',
  uri: '/api'
});

const inflateLink = new ApolloLink((operation, forward) => {
  return forward(operation)
    .map((response) => {
      return inflate(response);
    });
});

const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: concat(inflateLink, httpLink)
});

export default apolloClient;

```

#### Example usage with `apollo-boost`

It is not possible to configure link with `apollo-boost`. Therefore, it is not possible to use `graphql-deduplicator` with `apollo-boost`. Use `apollo-client` setup.

Note: `apollo-boost` will be [discontinued starting Apollo Client v3](https://github.com/apollographql/apollo-client/issues/3225#issuecomment-415858054).

## Best practices

### Enable compression conditionally

Do not break integration of the standard GraphQL clients that are unaware of the `graphql-deduplicator`.

Use `deflate` only when client requests to use `graphql-deduplicator`, e.g.

```js
// Server-side

app.use('/graphql', graphqlExpress((request) => {
  return {
    formatResponse: (response) => {
      if (request.query.deduplicate && response.data && !response.data.__schema) {
        return deflate(response);
      }

      return response;
    }
  };
}));

```

```js
// Client-side

const httpLink = new HttpLink({
  credentials: 'include',
  uri: '/api?deduplicate=1'
});

```

#### Example using with [Apollo Server](https://github.com/apollographql/apollo-server)

```javascript
import { GraphQLExtension, GraphQLResponse } from 'apollo-server-core'
import { deflate } from 'graphql-deduplicator'
// [..]

const createContext = ({ req }): => {
  return {
    req,
    // [..]
  }
}
class DeduplicateResponseExtension extends GraphQLExtension {
  public willSendResponse(o) {
    const { context, graphqlResponse } = o
    // Ensures `?deduplicate=1` is used in the request
    if (context.req.query.deduplicate && graphqlResponse.data && !graphqlResponse.data.__schema) {
      const data = deflate(graphqlResponse.data)
      return {
        ...o,
        graphqlResponse: {
          ...graphqlResponse,
          data,
        },
      }
    }

    return o
  }
}

const apolloServer = new ApolloServer({
  // [..]
  context: createContext,
  extensions: [() => new DeduplicateResponseExtension()],
})
```
