/**
 * Feature-detects CSS Anchor Positioning (`anchor-name`/`position-anchor`/
 * `anchor()`) support by checking for `anchorName` on a live element's
 * `CSSStyleDeclaration` - the same check browsers themselves recommend over
 * `CSS.supports`, since `CSS.supports("anchor-name: --foo")` can return
 * `true` in a couple of older engines that parse the property but don't
 * implement positioning. Returns `false` rather than throwing in any
 * non-browser environment (SSR, tests) where `document` isn't defined or
 * `documentElement`/`style` aren't shaped as expected.
 */
export const supportsCssAnchorPositioning = (): boolean => {
  try {
    return "anchorName" in document.documentElement.style;
  } catch {
    return false;
  }
};
