# React 17 Migration Guide

This guide explains how to use the Crayon packages with React 17.

## Changes Made

### 1. Updated Dependencies
- Changed React peer dependency from `>=18.0.0` to `>=17.0.0`
- Added `use-sync-external-store` polyfill for React 17 compatibility
- Added `patch-package` for Zustand compatibility

### 2. Added Polyfills
- Created `useId` polyfill for React 17 compatibility
- Updated components to use polyfilled `useId` instead of React 18's version

### 3. Zustand Compatibility
- Created patch file to make Zustand 5.x work with React 17
- Patch replaces `useSyncExternalStore` from React with the polyfill version

## Installation Steps

1. **Install dependencies:**
```bash
npm install use-sync-external-store patch-package
```

2. **Apply the Zustand patch:**
The patch will be automatically applied when you run `npm install` or `npm run postinstall`.

3. **Verify React 17 compatibility:**
Make sure your project uses React 17:
```bash
npm install react@^17.0.0 react-dom@^17.0.0
```

## What's Included

### Polyfills
- `useId` - Auto-incrementing unique ID generator compatible with React 17
- Support for `useSyncExternalStore` via official React team polyfill

### Updated Components
The following components have been updated to use the polyfilled `useId`:
- `RadioItem`
- `SwitchItem`
- `CheckBoxItem`
- `Charts`

### Patch Files
- `patches/zustand+5.0.2.patch` - Makes Zustand 5.x compatible with React 17

## Usage

After installation, you can use the packages exactly as before. The polyfills are transparent and will automatically use the React 18+ versions when available.

```typescript
import { useThreadManager } from '@crayonai/react-core';
import { Button, RadioItem } from '@crayonai/react-ui';

// Works with both React 17 and React 18+
```

## Troubleshooting

### Zustand Warnings
If you see warnings about `useSyncExternalStore`, make sure:
1. The patch was applied correctly
2. `use-sync-external-store` is installed
3. Run `npm run postinstall` to apply patches

### TypeScript Issues
If you encounter TypeScript issues with React types:
```bash
npm install @types/react@^17.0.0 @types/react-dom@^17.0.0
```

### Hydration Mismatches
The `useId` polyfill generates deterministic IDs that should prevent hydration mismatches. If you still encounter issues, you may need to wrap components with a client-only wrapper.
