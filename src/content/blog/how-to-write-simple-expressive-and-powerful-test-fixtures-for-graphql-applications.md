---
title: "How to write simple, expressive, and powerful test fixtures for GraphQL applications"
description: "Using GraphQL mocking tools to create simple, expressive, and powerful mocking interfaces — and how to type-check those interfaces to make them effortless to use."
pubDate: 2025-01-14T20:16:30Z
heroImage: /blog/covers/how-to-write-simple-expressive-and-powerful-test-fixtures-for-graphql-applications.jpeg
tags:
  - GraphQL
  - Testing
  - Mocking
  - TypeScript
  - TypeSafety
---

In this blog post series, I'm going to explain 2 things:

1. How to use mocking tools to create simple, expressive, and powerful mocking interfaces

2. How to type-check those interfaces to make them effortless to use

#1 is not a terribly unique concept; lots of folks have written their own mocking interfaces using the tools available in [@graphql-tools/mock](https://www.npmjs.com/package/@graphql-tools/mock) (which I'm going to use) or perhaps via codegen plugins like [typescript-mock-data](https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-mock-data).

I think #2, however, is not a commonly solved problem, and you might even wonder "Why do I need to type-check mocking interfaces?". Type-checking makes the developer experience (DX) 100 times better. It makes tests easier to write because your IDE can use type information to tell you about valid property values when writing a fixture. It makes tests easier to fix when your API changes, since your fixture types are derived from the API types. After all, what's better than an integration test failing after an API change? A test that fails to compile because your test fixtures are type-checked!

> Note: [this repo](https://github.com/DrewHoo/typechecking-graphql-mock-resolvers) contains a working example that I build toward in this blog post. Feel free to check it out as a reference as you read along.

# Let's start with a test

Let's say you've got an application that uses GraphQL. In this case the GraphQL API is the public api from [tcgdex](https://www.tcgdex.net), a public pokémon card api, and an `app` function which just returns the effect of the first ability of the first card (it's a contrived example, but realistic examples get complex very quickly!).

tl;dr: you have a function that uses data from a GraphQL request, and you need to test it.

```javascript
import { ResultOf } from "@graphql-typed-document-node/core";
import { graphql } from "src/api/graphql";

export const GetCardsDocument = graphql(`
    query GetCards {
        cards {
            id
            abilities {
                effect
                name
            }
        }
    }
`)

export function app(data: ResultOf<typeof GetCardsDocument>) {
    return data.cards?.[0]?.abilities?.[0]?.effect
}
```

A test of this form may be familiar to you:

```javascript
import { expect, test } from 'vitest'
import { app } from './app'

test('app', () => {
    const data = {
        cards: [{
            id: "626d73ed-a443-4951-b3aa-b5445b143082",
            abilities: [{
                name: "thunder",
                effect: "paralyzed"
            }]
         }]
    }
    const result = app(data)
    expect(result).toBe("paralyzed")
})
```

When I think about what makes a test *good*, I consider its value:effort ratio. Value = how valuable is its failure? Effort = how difficult is it to write, read, maintain, and run? The trouble with the test fixture above is that it requires a lot of effort to use & maintain in an otherwise valuable test. There are three reasons why:

1. It's too long. A realistic component is likely requesting quite a lot more data than I am in this contrived example, but already my test fixture is taking up 9 lines of code. Longer tests are harder to read.

2. It obscures the information the test cares about. Great tests provide minimal mock data so it's easy to see what behavior is being tested. `effect: "paralyzed"` is the only data we should have to provide for this test.

3. It is difficult to maintain. This fixture is difficult to type-check! You could use a generated query type from `GetCardsDocument` to check that the fixture provides all the requested data, but that also means you have to modify this fixture whenever the query changes. And because TypeScript uses Open Object Types, it'll be pretty difficult to keep your static fixtures from containing properties they don't need, as your API grows and changes.

If I could imagine a test with a very high value:effort ratio, it'd look something like this:

```javascript
import { expect, test } from 'vitest'
import { app, GetCardsDocument } from './app'
import { createMockData } from 'src/api/mock-data-utils/create-mock-data'

test('app', () => {
    const data = createMockData(GetCardsDocument, 
        { AbilitiesListItem: { effect: () => "paralyzed" } }
    )
    const result = app(data)
    expect(result).toBe("paralyzed")
})
```

Same test, but the test fixture is three lines instead of nine, AND we're specifying only the data the test cares about (`createMockData` creates everything else the query document requires). But the best thing about this ideal test is that it's *real*. You can run it by following the README instructions in the repo linked above.

So how does `createMockData` work? Is there magic involved?

## Finding the magic

Spoiler alert: there is no magic. The mocking & codegen tools in the GraphQL ecosystem allow us to define extraordinarily succinct fixtures; our `app` function can ask for any amount or type of data it wants, but to mock the data, `createMockData` only needs two things:

1. the document node that `app` defined: `GetCardsDocument`

2. the specific values the test cares about: `effect: "paralyzed"`

How does it work? In this case `createMockData` is a convenience wrapper for [`@graphql-tools/mock`](https://the-guild.dev/graphql/tools/docs/mocking)'s `addMocksToSchema` function. `addMocksToSchema` accepts a schema and an optional `mocks` argument, which lets you define values for specific fields in your GraphQL API. Here's a simplified version:

```javascript
import { executeSync, buildASTSchema } from "graphql"
import { addMocksToSchema } from "@graphql-tools/mock"
import SDL from "src/api/graphql/schema.graphql"

const schema = buildASTSchema(SDL)

export function createMockData(document, mockResolvers) {
  const executableSchema = addMocksToSchema({
      schema,
      mocks: mockResolvers,
    },
  )
  const result = executeSync({ schema: executableSchema, document })
  return result.data 
}
```

Give it a schema and a mocks object, and you get back an executable schema you can use to create realistic responses to GraphQL queries! That's pretty great! Now when I run the test, my component under test will receive mock data that looks like this:

```json
{
    "cards": [
        {
            "id": "Hello World",
            "abilities": [
                {
                    "effect": "paralyzed",
                    "name": "Hello World",
                    "__typename": "AbilitiesListItem"
                },
                {
                    "effect": "paralyzed",
                    "name": "Hello World",
                    "__typename": "AbilitiesListItem"
                }
            ],
            "item": {
                "effect": "Hello World",
                "name": "Hello World",
                "__typename": "Item"
            },
            "__typename": "Card"
        },
        {
            "id": "Hello World",
            "abilities": [
                {
                    "effect": "paralyzed",
                    "name": "Hello World",
                    "__typename": "AbilitiesListItem"
                },
                {
                    "effect": "paralyzed",
                    "name": "Hello World",
                    "__typename": "AbilitiesListItem"
                }
            ],
            "item": {
                "effect": "Hello World",
                "name": "Hello World",
                "__typename": "Item"
            },
            "__typename": "Card"
        }
    ]
}
```

Whoa, that's a lot of mock data! Why so much? When `addMocksToSchema` creates that `executableSchema`, it's adding resolvers for every field in the schema, based on the type of the field. By default, fields that are typed as arrays in the GraphQL API get a resolver that returns an array with two items. Fields typed as `String` get a resolver that returns `"Hello World"`. Except for the `effect` field, which we provided a different default resolver for, which will return `"paralyzed"`.

This is incredibly cool! It's realistic. It's powerful. It's expressive. There's only one problem: it's hard to know whether your fixture values are correct, so when invocations like this fail to create the desired mock data, they can be really frustrating to debug:

```javascript
const data = createMockData(GetCardsDocument, 
    { AbilitesListItem: { effect: () => "paralyzed" } }
)
```

## Making a powerful interface easy to use via type-checking

It doesn't matter how powerful your tooling is if it's hard to use. Let's type-check this interface to get things like

1. autocomplete for properties in the `mockResolvers` argument

2. compiler errors for invalid properties

[`@graphql-tools/mock`](https://www.npmjs.com/package/@graphql-tools/mock) provides a type for us to use for the `mockResolvers` argument, and it's called `IMocks`.

```javascript
export type IMocks<TResolvers = IResolvers> = //...
```

It accepts a generic type argument called `TResolvers`, and uses that to define a type for an object that would look something like this:

```javascript
const resolvers: IMocks<MyResolvers> = {
  Query: () => ({ someQuery: () => ({ someField: () => generateRandomValue() })}),
  Mutation: () => ({ someMutation: () => ({ someField: () => generateRandomValue() })}),
  Entity: () => ({ someField: () => generateRandomValue() }),
  Entity2: () => ({ someField: () => generateRandomValue() }),
}
```

What they intend here is for you to produce your own `Resolvers` type from your GraphQL API (probably using the [typescript-resolvers codegen plugin](https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-resolvers)), and then feed that to `IMocks` to type-check your mock resolvers. Here's an example codegen config that will produce a `Resolvers` type for us:

```javascript
import { CodegenConfig } from "@graphql-codegen/cli"

export default {
    overwrite: true,
    schema: ["src/api/graphql/schema.graphql"],
    documents: ["src/**/*.graphql", "!src/api/*", "src/**/*.tsx", "src/**/*.ts"],
    generates: {
        "src/api/graphql/resolvers.ts": {
          plugins: [
            "typescript", 
            "typescript-resolvers",
          ],
        },
    },
} satisfies CodegenConfig
```

(recall that a full working codegen config can be found in [this repo](https://github.com/DrewHoo/typechecking-graphql-mock-resolvers))

We can then use the generated `Resolvers` type to type our `createMockData` interface:

```typescript
import { addMocksToSchema, IMocks } from "@graphql-tools/mock"
import { Resolvers } from "src/api/graphql/resolvers"

type MockResolvers = IMocks<Resolvers>

export function createMockData(document, mockResolvers: MockResolvers) {
  //...
```

With this type, you'll get autocomplete informed by types in your GraphQL API when creating mock resolver objects for tests! See it in action below!

<!-- original image (Glitch CDN, now offline): https://cdn.glitch.global/bce2a4f6-4121-4d68-bc05-29e104f524e7/2025-01-08%2014.11.04.gif -->
> 🎬 *(Screen recording: creating a mock resolver in the IDE, with autocomplete suggesting valid properties drawn from the GraphQL schema's types.)*

## The End... or is it?

Are we done? Depending on your perspective, I have either bad news or good news for you. TypeScript types--like great works of art--are never finished, only abandoned.

You could leave well enough alone and use this function in your codebase as it is (or just use the pattern I've created in the example repo)! However, keep reading [the next post](/blog/going-deep-on-type-checking-mock-resolvers-for-graphql-test-fixtures/) in this series if you want to take your DX to the next level.
