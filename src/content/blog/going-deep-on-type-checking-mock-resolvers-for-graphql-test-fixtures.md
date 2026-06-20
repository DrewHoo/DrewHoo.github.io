---
title: "Going deep on type-checking mock resolvers for GraphQL test fixtures"
description: "Advanced type-checking techniques for GraphQL mock resolvers using TypeScript, improving developer experience through type safety and practical codegen configurations."
pubDate: 2025-01-14T20:17:11Z
heroImage: /blog/covers/going-deep-on-type-checking-mock-resolvers-for-graphql-test-fixtures.jpeg
tags:
  - type programming
  - GraphQL
  - Testing
  - TypeScript
  - TypeSafety
---

In the [last post](/blog/how-to-write-simple-expressive-and-powerful-test-fixtures-for-graphql-applications/), I demonstrated how to use GraphQL mocking tools to easily & succinctly create low-maintenance test fixtures with a helper function called `createMockData`, and very briefly covered how to type-check it using the `IMocks` type from the [@graphql-tools/mock](https://the-guild.dev/graphql/tools/docs/mocking) package.

In this post, we're going to go deeper into some type programming and codegen tricks to further improve the developer experience (DX).

Here are the three problems we're going to solve:

1. The `IMocks` type is a bit too permissive, which makes it hard to catch typos in resolver names.

2. The `IMocks` type doesn't quite reflect reality; there are object shapes you can give it which result in default mock values being used instead of the ones you specify in your mock resolver. And, there cases in which the `IMocks` type claims it requires every property to be defined, but doesn't in reality.

3. `IMocks` doesn't provide support for type-checked custom scalar mock resolvers.

So, let's solve these problems!

> **Note:** [this repo](https://github.com/DrewHoo/typechecking-graphql-mock-resolvers) contains a working example that I build toward in this blog post. Feel free to check it out as a reference as you read along.

## Making `IMocks` less permissive

Take a look at `@graphql-tools/mock`'s implementation of `IMocks` and you might spot a big DX issue:

```ts
export type IMocks<TResolvers = IResolvers> = {
    [TTypeName in keyof TResolvers]?: {
        [TFieldName in keyof TResolvers[TTypeName]]: TResolvers[TTypeName][TFieldName] extends (args: any) => any 
          ? () => ReturnType<TResolvers[TTypeName][TFieldName]> | ReturnType<TResolvers[TTypeName][TFieldName]> 
          : TResolvers[TTypeName][TFieldName];
    };
} & {
    [typeOrScalarName: string]: IScalarMock | ITypeMock;
};
```

Do you see it? `IMocks` is an intersection between two types. The first is a [mapped object type](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html) that uses the information in the `TResolvers` type you provide. The second is a very generic-looking object where any string is a valid property name. Yikes! That means that a resolver name like `Abilites` is permissible, when it's clearly a misspelled version of `Abilities`. The compiler can't read minds*, after all.

You can make your own version of the type and simply omit the intersection part, and use that to type-check your own wrapper like so:

```typescript
import { Resolvers } from "src/api/graphql/resolvers"

type MockResolvers<TResolvers> = {
    [TTypeName in keyof TResolvers]?: {
        [TFieldName in keyof TResolvers[TTypeName]]: TResolvers[TTypeName][TFieldName] extends (args: any) => any 
            ? () => ReturnType<TResolvers[TTypeName][TFieldName]> | ReturnType<TResolvers[TTypeName][TFieldName]> 
            : TResolvers[TTypeName][TFieldName];
    };
}

export function createMockData(document, mockResolvers: MockResolvers<Resolvers>) {
  // ...
}
```

And now mistyped property names will result in lovely, angry, squiggly, red compiler errors!

*compilers can't read minds *yet*

## Aligning `IMocks` with reality

Funny thing: `addMocksToSchema` doesn't work when you provide a mocks object like this, which `IMocks` says is definitely legal:

```ts
{
  Query: { cards: [{ name: "this mock value gets ignored" }] }
}
```

For some reason, if at least one of the top two nested properties isn't a function (either `Query` or `cards`), any mock value you provide won't work. Any of these shapes *will* work:

```ts
const mocks = {
  Query: { cards: () => [{ name: "charmander" }] }
}

const mocks1 = {
  Query: () => ({ cards: [{ name: "pikachu" }] })
}

const mocks2 = {
  Query: () => ({ cards: () => [{ name: "bulbasaur" }] })
}
```

It's very difficult to write a type that allows the above variations, but disallows the first example that didn't work. I found it was feasible to write a type that only allows the last two examples, wherein top level properties (Query, in this case) *must* be functions:

```ts
type MockResolvers<TResolvers> = {
    [TTypeName in keyof TResolvers]?: () => {
        [TFieldName in keyof TResolvers[TTypeName]]: TResolvers[TTypeName][TFieldName] extends (args: any) => any 
          ? () => ReturnType<TResolvers[TTypeName][TFieldName]> | ReturnType<TResolvers[TTypeName][TFieldName]> 
          : TResolvers[TTypeName][TFieldName];
    };
}
```

In addition to making this change, you also have to modify your codegen to let resolver types be either values or functions, by adding a [`customResolverFn`](https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-resolvers#customresolverfn) to your config:

```ts
import type { CodegenConfig } from "@graphql-codegen/cli"

export default {
    // ...
    generates: {
        "src/api/graphql/resolvers.ts": {
          config: {
            // ...
            customResolverFn: "TResult | (() => TResult)",
          },  
        },
    },
} satisfies CodegenConfig
```

Hooray! Now when we define mock resolvers in tests, we can be sure they'll work!

Now let's try writing the mock resolver from our first test in a slightly different way (you'll wind up doing this if you want to change the number of items returned in an array for a specific test):

```ts
const mockResolvers: MockResolvers<Resolvers> = { 
  Query: () => ({ cards: () => [{ abilities: [{ effect: "paralyzed" }] }] })
}
```

Here, we're using the `Query` property in the `mocks` object to tell `@graphql-tools/mock` exactly how many cards we want returned in the `cards` array (the default is 2). We're also defining a specific value for our card's `AbilityListItem`'s effect, same as before but through the `Query` resolver instead of the `AbilityListItem` resolver.

Oh no! We have a TypeScript error on `Query`:

```bash
Type '() => { cards: () => { abilities: { effect: string; }[]; }[]; }' is not assignable to type '() => { card?: Resolver<Maybe<ResolverTypeWrapper<Card>>, ParentType, ContextType, Partial<QueryCardArgs>> | undefined; ... 4 more ...; sets?: Resolver<...> | undefined; }'.
  Call signature return types '{ cards: () => { abilities: { effect: string; }[]; }[]; }' and '{ card?: Resolver<Maybe<ResolverTypeWrapper<Card>>, ParentType, ContextType, Partial<QueryCardsArgs>> | undefined; ... 4 more ...; sets?: Resolver<...> | undefined; }' are incompatible.
    The types of 'cards' are incompatible between these types.
      Type '() => { abilities: { effect: string; }[]; }[]' is not assignable to type 'Resolver<Maybe<Maybe<ResolverTypeWrapper<Card>>[]>, ParentType, ContextType, Partial<QueryCardsArgs>> | undefined'.
        Type '() => { abilities: { effect: string; }[]; }[]' is not assignable to type '() => Maybe<Maybe<ResolverTypeWrapper<Card>>[]>'.
          Type '{ abilities: { effect: string; }[]; }[]' is not assignable to type 'Maybe<Maybe<ResolverTypeWrapper<Card>>[]>'.
            Type '{ abilities: { effect: string; }[]; }' is not assignable to type 'Maybe<ResolverTypeWrapper<Card>>'.
              Type '{ abilities: { effect: string; }[]; }' is missing the following properties from type 'Card': category, id, legal, localId, and 3 more.ts(2322)
```

Bleh, that's a lot of text. Always remember: TypeScript errors should be read from the bottom up:

```bash
Type '{ abilities: { effect: string; }[]; }' is missing the following properties
from type 'Card': category, id, legal, localId, and 3 more.ts(2322)
```

Ok, so the object we're providing in the `cards` array is missing some properties. To fix this TypeScript error, we could add all those properties, but we'd no longer have a minimal mocking interface. Besides, if our query required those properties, we know `@graphql-tools/mock` will provide them automatically for us. So the type must be wrong! We can fix it by tweaking our codegen config for `Resolvers`:

```ts
import { CodegenConfig } from "@graphql-codegen/cli"

export default {
    // ...
    generates: {
        "src/api/graphql/resolvers.ts": {
          config: {
            // ...
            resolverTypeWrapperSignature: "RecursivePartial<T>",
          },
          plugins: [
            "typescript", 
            "typescript-resolvers",
            { add: { content: "type RecursivePartial<T> = T extends object ? { [K in keyof T]?: RecursivePartial<T[K]> } : T" } },
          ],
        },
    },
} satisfies CodegenConfig
```

[`resolverTypeWrapperSignature`](https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-resolvers#resolvertypewrappersignature) is a TypeScript type that wraps the resolver's return type. In this case we're saying we want the return type to be a recursive partial type (so we won't have to define all the properties; `@graphql-tools/mock` does that for us at runtime)

In `plugins` we're adding a line to the generated `resolvers.ts` file, and it's a definition for `RecursivePartial`. That way when the resolvers' return types are wrapped with our `resolverTypeSignature`, the definition of `RecursivePartial` is available in the file.

Now if we run codegen to re-generate `resolvers.ts` we find that our mocks object no longer has a type error! Hooray!

## Adding support for type-checked custom scalar mock resolvers

^This title is a mouthful. If you're not familiar with custom scalars in GraphQL or why they're valuable, let me explain:

Let's say your API has fields that are ISO8601 date strings (accept no substitutes!). Well, if they're typed as `String` in the GraphQL API, our `createMockData` function is going to provide values that make sense for a `String` field, like `"Hello, World!"`.

This is really irritating because your app shouldn't have to know anything more specific than the type information your API provides. Any time your app has this kind of 'forbidden knowledge' it leads to runtime errors and bad DX.

Here's what you can do: add a custom scalar type to your API like `DateTime`, which returns an ISO8601 format string, and ensure your API follows through with its promise, of course.

Next, provide a scalar mock to our `createMockData` function, which ensures that every field typed with DateTime gets a ISO8601 format string by default:

```ts
const globalMocks: MockResolvers<Resolvers> = {
    DateTime: () => new Date().toISOString()
}

export function createMockData(documentNode, mocks: MockResolvers<Resolvers>) {
  const executableSchema = addMocksToSchema({ schema, mocks: {...globalMocks, ...mocks} })
  const result = executeSync({ schema: executableSchema, document })
  return result.data
}
```

Yay! Our test will pass, but the `MockResolvers` type does not like the implementation we provided to our `DateTime` resolver. That's just another case where the generated `Resolvers` type, intended for server-side use, isn't quite a good match for what `addMocksToSchema` really wants. We can use codegen tools to fix this!

First, add a scalar type mapping to your codegen config, which will generate a Scalars type we'll use in the next step:

```ts
import { CodegenConfig } from "@graphql-codegen/cli"

export default {
    // ...
    generates: {
        "src/api/graphql/resolvers.ts": {
          config: {
            // ...
            scalars: {
              DateTime: "string"
            },
          },  
        },
    },
} satisfies CodegenConfig
```

The generated Scalars type looks something like this:

```ts
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  // this is the only custom one; defining the scalars map just makes 
  // predefined scalar types explicit
  DateTime: { input: string; output: string; } 
};
```

Now we can modify our custom `IMocks` type to ask for the type of Scalar mock that `addMocksToSchema` really wants:

```ts
import { Resolvers, Scalars } from "src/api/graphql/resolvers"

type IMocks<TResolvers> = {
  [TTypeName in keyof TResolvers]?: TTypeName extends keyof Scalars
  ? () => Scalars[TTypeName]["output"]
  : () => {
    [TFieldName in keyof TResolvers[TTypeName]]: TResolvers[TTypeName][TFieldName] extends (...args: any) => any
    ? (() => ReturnType<TResolvers[TTypeName][TFieldName]>) | ReturnType<TResolvers[TTypeName][TFieldName]>
    : TResolvers[TTypeName][TFieldName];
  }
}
```

In plain English, this type is saying: for each top-level key of the `Resolvers` type, let's define a new value for the property. If the top-level key also exists in the generated Scalars type, then the value ought to be a function that returns the "output" type for that key's entry in the Scalars type. If top-level key doesn't exist in the Scalars map, carry on as we did before.

Now our `globalMocks` object is correctly typed!

> **Note:** another common use case for custom scalar resolvers is ID fields. If you're writing a FE integration test that renders to a virtual DOM, for instance, and your FE code caches or relies on cached query results, adding a custom scalar resolver for the ID field (so that any ID field gets a random UUID instead of `"Hello World"`) will ensure that `createMockData` automatically creates realistic responses with cacheable entities.

# The End?

Is this starting to get complicated? A bit! Does it work well? You bet your ass it does. I wrote this interface (and some more complicated ones for Apollo's [MockedProvider](https://www.apollographql.com/docs/react/development-testing/testing)) about 2 years ago, and now, when I search for usages of these functions in our codebase, I get `375 results in 58 files`.

You can integrate `createMockData` with other testing tools like Apollo's MockedProvider or [msw](https://mswjs.io/docs/api/graphql) to intercept queries made by your application under test and respond with generated mocks. I'll leave this as an exercise to the reader (also msw has fantastic docs).

Types are never perfect, only abandoned, but if you've gotten this far, you should feel good abandoning the types you've made, and using your `createMockData` function to effortlessly create test fixtures.
