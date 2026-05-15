# Assembly Frontend Inventory

This package changes the frontend surface by moving the view model into
WebAssembly text format.

Assembly-owned:

- Hero title, subtitle, and action labels.
- Runtime metrics.
- Feature copy.
- Primitive table copy.
- Exported pointers and counters.

Host-owned:

- DOM node creation.
- CSS application.
- WebAssembly loading.

The host layer remains JavaScript because browser engines expose the DOM through
JavaScript APIs. The assembly module owns the frontend data and exported view
contract.
