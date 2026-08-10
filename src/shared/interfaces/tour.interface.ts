export type TourStepKind = "slide" | "spotlight";

export interface ITourStep {
  id: string;
  kind: TourStepKind;
  /** Plain pathname (no base prefix). Omit when staying on the same route as the previous step. */
  route?: string;
  title: string;
  body: string;
  /** Shadow-piercing selector chain for "spotlight" steps, each queried inside the previous match's shadow root. */
  targetSelectors?: string[];
  /** Extra px around the target's bounding rect for the spotlight cutout. Component defaults to 8 if omitted. */
  spotlightPadding?: number;
  /** Runs synchronously before this step's navigation/render. */
  beforeEnter?: () => void;
  /** Label for the primary advance button. */
  ctaLabel: string;
}
