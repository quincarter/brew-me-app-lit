import { css } from "lit";

export const LeverEspressoLoaderStyles = css`
  :host {
    display: inline-block;
    /* Kept in sync with LEVER_ESPRESSO_LOADER_CYCLE_MS in LeverEspressoLoader.ts. */
    --lever-espresso-cycle: 2200ms;
  }

  .lever-espresso-loader {
    position: relative;
    width: 108px;
    height: 102px;
  }

  /* The boiler/group housing - a squat metal-toned block, not a rounded
   * "capsule", so it reads as a machine body rather than a bag. */
  .machine-body {
    position: absolute;
    top: 2px;
    left: 50%;
    box-sizing: border-box;
    width: 46px;
    height: 30px;
    background: var(--brew-color-outline);
    border: 2px solid var(--brew-color-on-surface-variant);
    border-radius: 6px;
    transform: translateX(-50%);
  }

  /* Pivots from its attachment point on the machine body's right edge -
   * pulling it down builds spring pressure, releasing it forces water
   * through the puck (modeled here as a repeating pull/release loop). */
  .lever {
    position: absolute;
    top: 16px;
    left: 73px;
    width: 32px;
    height: 5px;
    background: var(--brew-color-on-surface);
    border-radius: 3px;
    transform-origin: left center;
    transform: rotate(-22deg);
    animation: brew-lever-press var(--lever-espresso-cycle) ease-in-out infinite;
    transition: transform 0.4s ease-out;
  }

  .group-head {
    position: absolute;
    top: 32px;
    left: 50%;
    width: 18px;
    height: 8px;
    background: var(--brew-color-on-surface-variant);
    transform: translateX(-50%);
  }

  /* The portafilter basket - wider than the group head, tapering slightly
   * narrower toward the bottom where the spout hangs. */
  .portafilter {
    position: absolute;
    top: 40px;
    left: 50%;
    width: 38px;
    height: 10px;
    background: var(--brew-color-on-surface-variant);
    border-radius: 2px 2px 8px 8px;
    transform: translateX(-50%);
  }

  .spout {
    position: absolute;
    top: 50px;
    left: 50%;
    width: 4px;
    height: 6px;
    background: var(--brew-color-outline);
    transform: translateX(-50%);
  }

  /* The shot itself - a fine, near-black stream, distinctly darker and
   * thinner than the AeroPress/Chemex drip, since espresso is far more
   * concentrated than filter coffee. Nested right at the spout, sitting
   * directly on the cup below it, rather than floating with a wide gap. */
  .shot {
    position: absolute;
    top: 56px;
    left: 50%;
    width: 4px;
    height: 12px;
    background: color-mix(in srgb, var(--brew-color-primary) 65%, black);
    border-radius: 2px;
    opacity: 0;
    transform: translateX(-50%);
    animation: brew-lever-shot var(--lever-espresso-cycle) ease-in-out infinite;
    transition: opacity 0.3s ease-out;
  }

  .cup {
    position: absolute;
    top: 66px;
    left: 50%;
    box-sizing: border-box;
    width: 44px;
    height: 30px;
    border-right: 2px solid var(--brew-color-outline-variant);
    border-bottom: 2px solid var(--brew-color-outline-variant);
    border-left: 2px solid var(--brew-color-outline-variant);
    border-radius: 0 0 14px 14px;
    transform: translateX(-50%);
  }

  .espresso-liquid {
    position: absolute;
    bottom: 2px;
    left: 2px;
    width: calc(100% - 4px);
    height: 8px;
    background: color-mix(in srgb, var(--brew-color-primary) 65%, black);
    border-radius: 0 0 10px 10px;
    transform-origin: bottom center;
    animation: brew-lever-ripple var(--lever-espresso-cycle) ease-in-out infinite;
    transition: height 0.6s ease-out;
  }

  /* Rides on top of .espresso-liquid's own animated top edge automatically,
   * since it's positioned relative to that parent's box rather than the
   * cup - the light golden foam layer that's the single clearest visual
   * cue this is espresso, not drip coffee. */
  .crema {
    position: absolute;
    top: -3px;
    left: 0;
    width: 100%;
    height: 4px;
    background: color-mix(in srgb, var(--brew-color-primary) 55%, white);
    border-radius: 2px;
  }

  .cup-handle {
    position: absolute;
    top: 4px;
    right: -11px;
    width: 13px;
    height: 16px;
    border: 2px solid var(--brew-color-outline-variant);
    border-left: none;
    border-radius: 0 8px 8px 0;
  }

  @keyframes brew-lever-press {
    0%,
    14% {
      transform: rotate(-22deg);
    }
    50% {
      transform: rotate(14deg);
    }
    86%,
    100% {
      transform: rotate(-22deg);
    }
  }

  @keyframes brew-lever-shot {
    0%,
    46% {
      opacity: 0;
    }
    54%,
    74% {
      opacity: 1;
    }
    84%,
    100% {
      opacity: 0;
    }
  }

  @keyframes brew-lever-ripple {
    0%,
    70%,
    100% {
      transform: scaleX(1);
    }
    76% {
      transform: scaleX(1.1);
    }
    84% {
      transform: scaleX(1);
    }
  }

  /* "Finished" pose: the lever holds down (spring released) and the cup
   * fills further - the full cup is the "done" signal, same grammar as the
   * other two loaders. */
  :host([done]) .lever {
    animation: none;
    transform: rotate(14deg);
  }

  :host([done]) .shot {
    animation: none;
    opacity: 0;
  }

  :host([done]) .espresso-liquid {
    animation: none;
    height: 18px;
  }

  @media (prefers-reduced-motion: reduce) {
    .lever,
    .shot,
    .espresso-liquid {
      animation: none;
      transition: none;
    }
  }
`;
