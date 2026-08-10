/**
 * Walks a selector chain across shadow-DOM boundaries: the first selector is
 * queried against `document`, and each subsequent selector is queried inside
 * the previous match's shadow root, so a path like
 * `["calculator-page", "brew-type-picker", "[data-tour='type-v60']"]` can
 * reach an element nested three custom elements deep.
 */
export const queryDeep = (selectorPath: readonly string[]): Element | null => {
  if (selectorPath.length === 0) return null;

  let searchRoot: ParentNode = document.querySelector("app-shell")?.shadowRoot ?? document;
  for (let i = 0; i < selectorPath.length; i += 1) {
    const match = searchRoot.querySelector(selectorPath[i]);
    if (!match) return null;
    if (i === selectorPath.length - 1) return match;
    if (!match.shadowRoot) return null;
    searchRoot = match.shadowRoot;
  }
  return null;
};
