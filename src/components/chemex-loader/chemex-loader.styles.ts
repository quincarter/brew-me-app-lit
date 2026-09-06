import { css } from "lit";

export const ChemexLoaderStyles = css`
  :host {
    display: inline-block;
    /* Kept in sync with CHEMEX_LOADER_CYCLE_MS in ChemexLoader.ts. */
    --chemex-cycle: 2800ms;
  }

  .chemex-loader {
    position: relative;
    width: 100px;
    height: 132px;
  }

  /* A pulse of poured water, right above the rim - a real pour-over is
   * poured in stages, not one continuous stream, so this pulses rather than
   * staying visible throughout the cycle. */
  .pour {
    position: absolute;
    top: 0;
    left: 50%;
    width: 3px;
    height: 12px;
    background: var(--brew-color-outline-variant);
    border-radius: 2px;
    opacity: 0;
    transform: translateX(-50%);
    animation: brew-chemex-pour var(--chemex-cycle) ease-in-out infinite;
  }

  /* The wide cone-shaped upper chamber - a filled trapezoid via clip-path,
   * tapering down to the neck. No stroke (clip-path can't carry a border),
   * but a filled shape reads clearly enough as glass against the loader's
   * background, same tinted-fill approach as the AeroPress chamber. */
  .cone {
    position: absolute;
    top: 6px;
    left: 50%;
    width: 78px;
    height: 54px;
    background: color-mix(in srgb, var(--brew-color-on-surface-variant) 12%, transparent);
    clip-path: polygon(6% 0, 94% 0, 66% 100%, 34% 100%);
    transform: translateX(-50%);
  }

  /* The bed of wet grounds sitting in the paper filter, visible near the
   * rim - domed top, flatter bottom, like a mound rather than a flat disc. */
  .grounds {
    position: absolute;
    top: 16px;
    left: 50%;
    width: 42px;
    height: 16px;
    background: color-mix(in srgb, var(--brew-color-primary) 55%, black);
    border-radius: 50% 50% 8px 8px;
    transform: translateX(-50%);
  }

  /* The wood collar/sleeve tied around the vessel's waist - a real Chemex
   * detail, and the clearest single silhouette cue distinguishing it from
   * any other pour-over dripper. */
  .collar {
    position: absolute;
    top: 58px;
    left: 50%;
    width: 34px;
    height: 14px;
    background: var(--brew-color-secondary);
    border-radius: 3px;
    transform: translateX(-50%);
  }

  .neck {
    position: absolute;
    top: 72px;
    left: 50%;
    width: 26px;
    height: 8px;
    background: color-mix(in srgb, var(--brew-color-on-surface-variant) 12%, transparent);
    transform: translateX(-50%);
  }

  /* A short pulse of coffee color at the neck, timed just after the pour -
   * stands in for water passing down through the grounds into the bulb. */
  .flow {
    position: absolute;
    top: 76px;
    left: 50%;
    width: 4px;
    height: 8px;
    background: var(--brew-color-primary);
    border-radius: 2px;
    opacity: 0;
    transform: translateX(-50%);
    animation: brew-chemex-flow var(--chemex-cycle) ease-in-out infinite;
  }

  /* The rounded lower bulb the brewed coffee collects in - flares back out
   * from the neck rather than tapering further, the other half of the
   * hourglass silhouette. */
  .bulb {
    position: absolute;
    top: 78px;
    left: 50%;
    box-sizing: border-box;
    width: 68px;
    height: 48px;
    background: color-mix(in srgb, var(--brew-color-on-surface-variant) 12%, transparent);
    border-radius: 18px 18px 32px 32px;
    transform: translateX(-50%);
    overflow: hidden;
  }

  .bulb-liquid {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 16px;
    background: var(--brew-color-primary);
    transform-origin: bottom center;
    animation: brew-chemex-ripple var(--chemex-cycle) ease-in-out infinite;
    transition: height 0.6s ease-out;
  }

  @keyframes brew-chemex-pour {
    0%,
    18% {
      opacity: 0;
    }
    26%,
    40% {
      opacity: 1;
    }
    50%,
    100% {
      opacity: 0;
    }
  }

  @keyframes brew-chemex-flow {
    0%,
    38% {
      opacity: 0;
    }
    46%,
    60% {
      opacity: 1;
    }
    70%,
    100% {
      opacity: 0;
    }
  }

  @keyframes brew-chemex-ripple {
    0%,
    56%,
    100% {
      transform: scaleX(1);
    }
    62% {
      transform: scaleX(1.08);
    }
    70% {
      transform: scaleX(1);
    }
  }

  /* "Finished brewing" pose: the pour/flow pulses stop and the bulb holds a
   * noticeably fuller level - the full bulb itself is the "done" signal,
   * same grammar as the AeroPress loader's filled cup. */
  :host([done]) .pour,
  :host([done]) .flow {
    animation: none;
    opacity: 0;
  }

  :host([done]) .bulb-liquid {
    animation: none;
    height: 38px;
  }

  @media (prefers-reduced-motion: reduce) {
    .pour,
    .flow,
    .bulb-liquid {
      animation: none;
      transition: none;
    }
  }
`;
