# graphql-normalizer

[![Travis build status](http://img.shields.io/travis/gajus/graphql-normalizer/master.svg?style=flat-square)](https://travis-ci.org/gajus/graphql-normalizer)
[![Coveralls](https://img.shields.io/coveralls/gajus/graphql-normalizer.svg?style=flat-square)](https://github.com/gajus/graphql-normalizer)
[![NPM version](http://img.shields.io/npm/v/graphql-normalizer.svg?style=flat-square)](https://www.npmjs.org/package/graphql-normalizer)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)

A GraphQL response normalizer designed to work with [`apollo-client`](https://github.com/apollographql/apollo-client).

* [How does it work?](#how-does-it-work)
* [Motivation](#motivation)
* [Usage](#usage)

## How does it work?

`apollo-client` uses `__datatype` and an `id` values to construct a resource identifier. The resource identifier is used to [normalize data](http://dev.apollodata.com/core/how-it-works.html#normalize). As a result, when GraphQL API response contains a resource with a repeating identifier, the `apollo-client` is going to read only the first instance of the resource and ignore the subsequent repetitions. We can leverage this to strip body of all duplicate resource instances.

## Motivation

Consider the following schema:

```graphql
interface Node {
  id: ID!
}

type Movie implements Node {
  id: ID!
  name: String!
}

type Venue implements Node {
  id: ID!
  name: String!
}

type Event implements Node {
  id: ID!
  venue: Venue!
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
    id
    date
    time
    movie {
      id
      name
    }
    venue {
      id
      name
    }
  }
}

```

The result of the above query will contain a lot of duplicate information.

```json
{
  "data": {
    "events": [
      {
        "id": "1669971",
        "date": "2017-05-19",
        "time": "17:25",
        "movie": {
          "id": "1198359",
          "name": "King Arthur: Legend of the Sword"
        },
        "venue": {
          "id": "1000819",
          "name": "Vue Westfield London"
        }
      },
      {
        "id": "1669972",
        "date": "2017-05-19",
        "time": "20:30",
        "movie": {
          "id": "1198359",
          "name": "King Arthur: Legend of the Sword"
        },
        "venue": {
          "id": "1000819",
          "name": "Vue Westfield London"
        }
      },
      // ...
    ]
  }
}

```

I've run into this situation when building https://gotocinema.com. A query retrieving 300 events (movie screening event) produced a response of 1.5MB. When gziped, that number dropped to 100KB. However, the problem is that upon receiving the response, the browser needs to parse the entire JSON document. Parsing 1.5MB JSON string is (a) time consuming and (b) memory expensive.

The good news is that we do not need to return body of duplicate records (see [How does it work?](#how-does-it-work)). For all duplicate records we only need to return `__typename` and `id`. This information is enough for `apollo-client` to identify the resource as duplicate and skip it. In case when a response includes large and often repeated fragments, this will reduce the response size 10x, 100x or more times.

## Usage

You need to format the final result of the query. If you are using `graphql-server`, configure `formatResponse`.

```js
import express from 'express';
import {
  graphqlExpress
} from 'graphql-server-express';
import {
  createResponseNormalizer
} from 'graphql-normalizer';

const SERVICE_PORT = 3000;

const app = express();

app.use('/graphql', graphqlExpress(() => {
  return {
    formatResponse: createResponseNormalizer()
  };
}));

app.listen(SERVICE_PORT);

```

> Note: You must create a new instance of `graphql-normalizer` for each request.

Using `graphql-normalizer` does not require any changes to the client-side code.
