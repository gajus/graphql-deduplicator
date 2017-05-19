# graphql-deduplicator

[![Travis build status](http://img.shields.io/travis/gajus/graphql-deduplicator/master.svg?style=flat-square)](https://travis-ci.org/gajus/graphql-deduplicator)
[![Coveralls](https://img.shields.io/coveralls/gajus/graphql-deduplicator.svg?style=flat-square)](https://github.com/gajus/graphql-deduplicator)
[![NPM version](http://img.shields.io/npm/v/graphql-deduplicator.svg?style=flat-square)](https://www.npmjs.org/package/graphql-deduplicator)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)

A GraphQL response deduplicator.

Removes duplicate entities from the GraphQL response.

* [Client support](#client-support)
* [How does it work?](#how-does-it-work)
* [Motivation](#motivation)
* [Real-life example](#real-life-example)
* [Usage](#usage)

## Client support

`graphql-deduplicator` has been tested with [`apollo-client`](https://github.com/apollographql/apollo-client).

In theory, it should work with any GraphQL client that utilises normalization. The plan is to create a request proxy for clients that do not support normalization (see [issue #1](https://github.com/gajus/graphql-deduplicator/issues/1)).

## How does it work?

`apollo-client` uses `__datatype` and an `id` values to construct a resource identifier. The resource identifier is used to [normalize data](http://dev.apollodata.com/core/how-it-works.html#normalize). As a result, when GraphQL API response contains a resource with a repeating identifier, the `apollo-client` is going to read only the first instance of the resource and ignore duplicate entities. `graphql-deduplicator` strips body (fields other than `__datatype` and `id`) from all the duplicate entities.

## Motivation

`graphql-deduplicator` is designed to reduce the GraphQL response size by removing body of duplicate entities. This allows to make queries that return large result sets of repeated data without worrying about the cost of the response body size, time it takes to parse the response or the memory the reconstructed object will consume.

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
  # YYYY-MM-DD
  date: String!
  # HH:mm
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
    __datatype
    id
    date
    time
    movie {
      __datatype
      id
      name
      synopsis
    }
  }
}

```

> Note: If you are using `apollo-client`, then you do not need to include `__datatype` when constructing the query. `apollo-client` will do this for you.

The result of the above query will contain a lot of duplicate information.

```json
{
  "data": {
    "events": [
      {
        "__datatype": "Event",
        "id": "1669971",
        "date": "2017-05-19",
        "time": "17:25",
        "movie": {
          "__datatype": "Movie",
          "id": "1198359",
          "name": "King Arthur: Legend of the Sword",
          "synopsis": "When the child Arthur’s father is murdered, Vortigern, Arthur’s uncle, seizes the crown. Robbed of his birthright and with no idea who he truly is, Arthur comes up the hard way in the back alleys of the city. But once he pulls the sword Excalibur from the stone, his life is turned upside down and he is forced to acknowledge his true legacy... whether he likes it or not."
        }
      },
      {
        "__datatype": "Event",
        "id": "1669972",
        "date": "2017-05-19",
        "time": "20:30",
        "movie": {
          "__datatype": "Movie",
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

I've run into this situation when building https://gotocinema.com. A query retrieving 300 events (movie screening event) produced a response of 1.5MB. When gziped, that number dropped to 100KB. However, the problem is that upon receiving the response, the browser needs to parse the entire JSON document. Parsing 1.5MB JSON string is (a) time consuming and (b) memory expensive.

The good news is that we do not need to return body of duplicate records (see [How does it work?](#how-does-it-work)). For all duplicate records we only need to return `__typename` and `id`. This information is enough for `apollo-client` to identify the resource as duplicate and skip it. In case when a response includes large and often repeated fragments, this will reduce the response size 10x, 100x or more times.

In case of the earlier example, the response becomes:

```json
{
  "data": {
    "events": [
      {
        "__datatype": "Event",
        "id": "1669971",
        "date": "2017-05-19",
        "time": "17:25",
        "movie": {
          "__datatype": "Movie",
          "id": "1198359",
          "name": "King Arthur: Legend of the Sword",
          "synopsis": "When the child Arthur’s father is murdered, Vortigern, Arthur’s uncle, seizes the crown. Robbed of his birthright and with no idea who he truly is, Arthur comes up the hard way in the back alleys of the city. But once he pulls the sword Excalibur from the stone, his life is turned upside down and he is forced to acknowledge his true legacy... whether he likes it or not."
        }
      },
      {
        "__datatype": "Event",
        "id": "1669972",
        "date": "2017-05-19",
        "time": "20:30",
        "movie": {
          "__datatype": "Movie",
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

You need to format the final result of the query. If you are using [`graphql-server`](https://github.com/apollographql/graphql-server), configure `formatResponse`, e.g.

```js
import express from 'express';
import {
  graphqlExpress
} from 'graphql-server-express';
import {
  createResponseDeduplicator
} from 'graphql-deduplicator';

const SERVICE_PORT = 3000;

const app = express();

app.use('/graphql', graphqlExpress(() => {
  return {
    formatResponse: createResponseDeduplicator()
  };
}));

app.listen(SERVICE_PORT);

```

> Note: You must create a new instance of `graphql-deduplicator` for each request.

Using `graphql-deduplicator` does not require any changes to the client-side code.
