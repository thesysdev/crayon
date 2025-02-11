// creating a custom type for postcss-js and not using @types/postcss-js
// because it's not updated for postcss v8
declare module 'postcss-js' {
  import { Root } from 'postcss';
  
  export function objectify(root: Root): Record<string, any>;
  export function parse(obj: object): Root;
  export function sync(obj: object): Root;
} 