## UI Components

This package provides React UI components for the Crayon AI platform.

### React Compatibility

This package supports both React 17 and React 18+. When using React 17, the package automatically includes polyfills for React 18 features:

- `useId`: Provides unique IDs for accessibility
- `useDeferredValue`: Returns values immediately in React 17
- `useTransition`: Provides basic transition state management
- `startTransition`: Defers updates using setTimeout

The polyfills are automatically used when React 18 features are not available, ensuring compatibility across React versions.
