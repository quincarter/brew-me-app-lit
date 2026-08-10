import { Router } from "@lit-labs/router";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { html as staticHtml, unsafeStatic } from "lit/static-html.js";
import "urlpattern-polyfill";
import { AppShellStyles } from "./app-shell.styles";
import "./components/install-prompt/brew-install-prompt";
import "./components/post-save-sheet/brew-post-save-sheet";
import "./components/theme-toggle/brew-theme-toggle";
import "./components/tour-overlay/brew-tour-overlay";
import "./components/update-prompt/brew-update-prompt";
import { withBase } from "./shared/configuration/base-path";
import { routes } from "./shared/configuration/routes";
import { initInstallPromptListener } from "./shared/stores/install-prompt.store";
import { maybeAutoStartTour } from "./shared/stores/tour.store";
import { registerServiceWorker } from "./shared/utilities/register-service-worker.utility";

// Attach the beforeinstallprompt/appinstalled listeners as early as possible
// so the event is never missed while `brew-install-prompt` isn't mounted yet.
initInstallPromptListener();
registerServiceWorker();

/**
 * Root element: wires up the router (lazy-loading each screen's module on
 * first visit, same shape as app-shell-starter's `_setupRoutes`) and hosts
 * the current screen full-bleed at every viewport size. Individual screens
 * (via `brew-bottom-nav` and `shared/styles/responsive.styles.ts`) switch
 * from a bottom tab bar to a left navigation rail at expanded widths -
 * there's no separate "desktop" chrome here, the app just adapts.
 */
@customElement("app-shell")
export class AppShell extends LitElement {
  static styles = [AppShellStyles];

  private _router = new Router(
    this,
    routes.map((route) => ({
      path: withBase(route.path),
      enter: async () => {
        await import(`./views/${route.directory}/${route.fileName}.ts`);
        return true;
      },
      render: (params: { [key: string]: string | undefined }) => {
        const tag = unsafeStatic(route.tagName);
        return staticHtml`<${tag} .routeParams="${params}"></${tag}>`;
      },
    })),
  );

  firstUpdated(): void {
    maybeAutoStartTour();
  }

  render(): HTMLTemplateResult {
    return html`
      <brew-theme-toggle></brew-theme-toggle>
      <main>${this._router.outlet()}</main>
      <brew-install-prompt></brew-install-prompt>
      <brew-update-prompt></brew-update-prompt>
      <brew-post-save-sheet></brew-post-save-sheet>
      <brew-tour-overlay></brew-tour-overlay>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-shell": AppShell;
  }
}
