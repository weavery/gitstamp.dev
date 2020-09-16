# Gitstamp

[![Project license](https://img.shields.io/badge/license-Public%20Domain-blue.svg)](https://unlicense.org)
[![Gitstamp](https://github.com/weavery/gitstamp.dev/workflows/Gitstamp/badge.svg)](https://github.com/weavery/gitstamp.dev/actions?query=workflow%3AGitstamp)

[Gitstamp] is a specification and service for timestamping Git commits using
the [Arweave] permaweb.

By timestamping Git commits permanently and uncensorably on Arweave, it is
easy to prove to any third party that a particular commit was created no
later than at the time when it was timestamped.

## Sample

The Git commit metadata is recorded on the blockweave as follows:

<img alt="Screenshot of Gitstamp metadata" src="https://raw.githubusercontent.com/weavery/gitstamp-action/master/sample.png" width="480"/>

## Specification

Each timestamped commit corresponds to an Arweave transaction where the
commit message is as-is stored as the transaction data, and where various
commit metadata are stored in transaction tags.

For each timestamped commit, the corresponding Arweave transaction contains
the following metadata tags:

Tag                  | Value                    |
:------------------- | :----------------------- |
`Content-Type`       | `"text/plain"`           |
`App-Name`           | `"Gitstamp"`             |
`Git-Commit`         | SHA-1 hash (hexadecimal) |
`Git-Commit-Link`    | optional URL             |
`Git-Author`         | author URI               |
`Git-Committer`      | author URI               |
`Git-Committer-Date` | ISO-8601 timestamp       |

Note that the `Git-Commit-Link` tag is optional, since we do wish to support
the use case of timestamping commits in nonpublic code repositories without
leaking the URL of said code repository.

Author URIs can be given either as a `mailto:` URI containing the author's
email address or using the author's profile URL at the code hosting service
(for example, GitHub or GitLab) the commit was submitted from. When possible,
we strongly recommend the latter due to the better privacy profile of not
leaking personal email addresses into a permanent record.

## Usage

### Usage with GitHub Actions

The easiest way to timestamp your Git commits is to use our [GitHub Actions
integration](https://github.com/weavery/gitstamp-action), where every push to
your GitHub repository timestamps the `HEAD` commit.

To use the GitHub Actions integration, you will need to configure a repository
or organization secret named `GITSTAMP_KEYFILE` to contain your Arweave JWK
wallet file.

### Usage with GitLab CI

See the [`.gitlab-ci.yml`] configuration in this repository for an example of
how to configure GitLab CI to timestamp your commits when they are pushed to
GitLab.

To use the GitLab CI integration, you will need to configure an environment
variable (of type _File_) named `GITSTAMP_KEYFILE` to contain your Arweave JWK
wallet file.

[`.gitlab-ci.yml`]: https://github.com/weavery/gitstamp.dev/blob/master/.gitlab-ci.yml

### Usage with Bitbucket Pipelines

A future integration with Bitbucket is planned.

### Usage with Git

In case you wish to submit your commits from a local Git repository, you can
use the [Gitstamp command-line interface (CLI)](https://github.com/weavery/gitstamp-cli):

```bash
$ cd /path/to/git/repository

$ gitstamp publish --wallet /path/to/arweave-keyfile.json
```

To use the Gitstamp CLI, you will need to have your Arweave wallet file
locally available.

## Costs

Each Arweave transaction requires an enclosed transaction fee to pay for
transaction processing and permanent storage on the Arweave network.
In practice, this works out to less than USD$0.00001 per timestamped commit.
(In other words, a USD$1 wallet will suffice for at least 100,000 commits.)

## Querying

### Querying with ArQL

To retrieve all timestamped commits using [ArQL], query for the tag
`App-Name`:

```javascript
{
  op: "equals",
  expr1: "App-Name",
  expr2: "Gitstamp"
}
```

Note that ArQL does not support pagination, so you probably want to use
GraphQL instead.

### Querying with GraphQL

Here's a basic example of retrieving timestamped commits using [GraphQL]:

```graphql
query {
  transactions(tags: [{name: "App-Name", values: "Gitstamp"}]) {
    pageInfo {
      hasNextPage
    }
    edges {
      cursor
      node {
        id
        tags {
          name,
          value
        }
      }
    }
  }
}
```

The aforementioned query returns results with the following structure:

```javascript
{
  "data": {
    "transactions": {
      "pageInfo": {
        "hasNextPage": true
      },
      "edges": [
        {
          "cursor": "WyIyMDIwLTA5LTEyVDEyOjMzOjUwLjc5OVoiLDFd",
          "node": {
            "id": "ieW3p3tfEDLMOcwF_mLWfzbF89G5Tau__bY7mkFab7Y",
            "tags": [
              {
                "name": "Content-Type",
                "value": "text/plain"
              },
              {
                "name": "App-Name",
                "value": "Gitstamp"
              },
              {
                "name": "Git-Commit",
                "value": "c1308c5f19d90ddb09a99e31f8c9c12951696b1b"
              },
              {
                "name": "Git-Commit-Link",
                "value": "https://github.com/artob/gitstamp.dev/commit/c1308c5f19d90ddb09a99e31f8c9c12951696b1b"
              },
              {
                "name": "Git-Author",
                "value": "https://github.com/artob"
              },
              {
                "name": "Git-Committer",
                "value": "https://github.com/artob"
              },
              {
                "name": "Git-Committer-Date",
                "value": "2020-09-12T15:25:06+03:00"
              }
            ]
          }
        }
        // ...
      ]
    }
  }
}
```

## See Also

This repository is mirrored on [GitHub], [GitLab], and [Bitbucket].

[Gitstamp]:       https://gitstamp.dev
[Arweave]:        https://www.arweave.org
[Arweave wallet]: https://www.arweave.org/wallet
[ArQL]:           https://github.com/ArweaveTeam/arweave-js#arql
[GraphQL]:        https://arweave.dev/graphql
[GitHub]:         https://github.com/weavery/gitstamp.dev
[GitLab]:         https://gitlab.com/weavery/gitstamp.dev
[Bitbucket]:      https://bitbucket.org/weavery/gitstamp.dev
