/**
 * `document.elementFromPoint` only pierces one level of (open) shadow DOM -
 * it returns the shadow *host* rather than descending further, so through
 * this app's several nested custom-element shells (e.g. app-shell ->
 * calculator-page -> brew-steps-card -> brew-icon-button) it resolves to
 * the outermost host and nothing more. Repeatedly hand the point to each
 * successive host's own `shadowRoot.elementFromPoint` to reach the real
 * element actually under the point. Shared by every pointer-drag-to-reorder
 * component (`brew-steps-card`, `home-screen-configurator-page`) - each
 * sits several shadow roots deep, so each needs this same walk to resolve
 * what's actually under the pointer during a drag.
 */
export const deepElementFromPoint = (x: number, y: number): Element | null => {
  let el = document.elementFromPoint(x, y);
  while (el?.shadowRoot) {
    const nested = el.shadowRoot.elementFromPoint(x, y);
    if (!nested || nested === el) break;
    el = nested;
  }
  return el;
};

/**
 * `Element.closest()` only searches its own shadow tree - it can't cross
 * back out through a shadow boundary to keep walking up into the host
 * document, which `deepElementFromPoint` above will have crossed *into*.
 * Same walk as `closest()`, but hops from a shadow root's top to its host
 * and keeps going instead of stopping there.
 */
export const composedClosest = (start: Element | null, selector: string): HTMLElement | null => {
  let node: Element | null = start;
  while (node) {
    if (node.matches(selector)) return node as HTMLElement;
    if (node.parentElement) {
      node = node.parentElement;
      continue;
    }
    const root = node.getRootNode();
    node = root instanceof ShadowRoot ? root.host : null;
  }
  return null;
};
