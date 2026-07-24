# A2UI JSON vs A2UI + OpenUI Lang

Across seven existing UI fixtures, replacing A2UI's JSON component objects with OpenUI Lang statements reduced the complete protocol streams from **6,894 to 5,526 tokens**: **1,368 fewer tokens (19.8%)**. At a fixed 60 output tokens/second, that is **22.8 seconds less estimated decode time** across the corpus, or a **1.25x aggregate speedup**.

| Scenario           | A2UI + JSON | A2UI + OpenUI Lang | Tokens saved |  Reduction | JSON latency | OpenUI latency |   Speedup |
| ------------------ | ----------: | -----------------: | -----------: | ---------: | -----------: | -------------: | --------: |
| simple-table       |         249 |                210 |           39 |     -15.7% |        4.15s |          3.50s |     1.19x |
| chart-with-data    |         363 |                294 |           69 |     -19.0% |        6.05s |          4.90s |     1.23x |
| contact-form       |         570 |                370 |          200 |     -35.1% |        9.50s |          6.17s |     1.54x |
| dashboard          |        1574 |               1349 |          225 |     -14.3% |       26.23s |         22.48s |     1.17x |
| pricing-page       |        1656 |               1383 |          273 |     -16.5% |       27.60s |         23.05s |     1.20x |
| settings-panel     |         837 |                628 |          209 |     -25.0% |       13.95s |         10.47s |     1.33x |
| e-commerce-product |        1645 |               1292 |          353 |     -21.5% |       27.42s |         21.53s |     1.27x |
| **TOTAL**          |    **6894** |           **5526** |     **1368** | **-19.8%** |  **114.90s** |     **92.10s** | **1.25x** |

## What was held constant

- Both variants use A2UI v1.0 and contain the same compact `createSurface` plus `updateComponents` JSONL messages.
- Both encode the same parsed component tree from the existing OpenUI benchmark fixtures.
- The surface ID, catalog ID, message boundaries, and JSON serialization are identical.
- The only variable is `updateComponents.components`: flat catalog component objects for A2UI + JSON, statement strings for A2UI + OpenUI Lang.

The A2UI JSON side uses a custom catalog with the same component and prop names as the OpenUI fixture library. Its component graph is flattened with deterministic IDs, matching A2UI's adjacency-list model. Both streams are minified, so the comparison does not rely on JSON whitespace.

## Reproduce it

Build the workspace packages once from the repository root, then run the offline benchmark:

```bash
pnpm install --frozen-lockfile
cd benchmarks
pnpm install --ignore-workspace
pnpm generate:a2ui
pnpm test:a2ui
pnpm bench:a2ui
```

Generation and measurement are offline and use the checked-in `.oui` fixtures. `test:a2ui` checks that both protocol envelopes are otherwise identical and replays all seven hybrid streams through the new client and Lang parser. Token counts use `tiktoken` with the `gpt-5` encoding. Latency is an estimate at 60 output tokens/second; it does not include model time-to-first-token, parsing/rendering CPU, transport overhead, or compression.

## Issue-ready summary

Add an experimental `@openuidev/a2ui-lang` package that preserves the A2UI v1.0 lifecycle, data-model, action, RPC, capability, and error messages, while changing only `updateComponents.components` from catalog JSON objects to OpenUI Lang statement strings. The package should maintain per-surface Lang source through statement-level patches, parse it with `@openuidev/lang-core`, and expose a React surface renderer. The reproducible seven-scenario benchmark currently shows a 19.8% full-stream token reduction and 1.25x estimated decode speedup versus compact A2UI JSON.
