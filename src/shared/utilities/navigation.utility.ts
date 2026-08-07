/**
 * Performs a client-side navigation compatible with @lit-labs/router, which
 * listens for the native `popstate` event to re-render its outlet. Use this
 * for programmatic navigation that isn't triggered by an `<a>` click (the
 * router already intercepts same-origin anchor clicks on its own).
 */
export const navigateTo = (pathname: string): void => {
  window.history.pushState({}, "", pathname);
  window.dispatchEvent(new PopStateEvent("popstate"));
};
