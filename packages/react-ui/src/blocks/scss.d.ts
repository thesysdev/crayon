// Allow side-effect scss imports in blocks (compiled to sibling .css by the
// build; the JS import is rewritten .scss → .css in cp-css.js).
declare module "*.scss";
