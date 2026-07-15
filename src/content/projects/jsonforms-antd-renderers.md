---
title: jsonforms-antd-renderers
blurb: "An antd renderer package for jsonforms I wrote & led at Great Expectations (Fivetran owns it now). My favorite part is a DFS written inside TypeScript's type system which checks ui schema property paths against the data validation schema. tl;dr if your validation schemas change, the compiler tells you which forms broke!"
liveUrl: https://fivetran.github.io/jsonforms-antd-renderers/
repoUrl: https://github.com/fivetran/jsonforms-antd-renderers
tags:
  - engineering
stack:
  - TypeScript
  - React
  - Ant Design
  - jsonforms
cover: /projects/jsonforms-antd-renderers.png
coverAlt: The renderer package's storybook — an Object Array form rendered with Ant Design components
pinned: false
order: 8
updated: 2026-07-13
---

Not a data-viz experiment — an npm package I wrote & led development of at
Great Expectations, since adopted (along with the rest of the company) by
Fivetran. It renders [jsonforms](https://jsonforms.io/) forms with
[Ant Design](https://ant.design/) components.

The part I'm proudest of is a type called `SchemaAwareScope`. In jsonforms you
describe a form twice: a JSON Schema for the data, and a UISchema whose Control
elements point into that schema with path strings like
`#/properties/person/properties/name`. Stock jsonforms types those paths as
`string`, so a typo — or a schema change — becomes a runtime surprise.

`SchemaAwareScope<T>` walks your actual JSON Schema at the type level (via
template-literal types and a prefix accumulator) and builds a union of every
legal scope path, so an invalid path simply won't compile. It goes a step
further, too: each schema node's type maps to the right options type — a
`date-time` string gets date-picker options, a `oneOf` gets combinator options
— so the `options` on each Control are checked as well. The practical effect is
the thing I wanted all along: when the schema changes, the compiler hands you a
to-do list of exactly which forms to fix.
