import { css } from "lit";

export const AeropressLoaderStyles = css`
  :host {
    display: inline-block;
    /* Kept in sync with AEROPRESS_LOADER_CYCLE_MS in AeropressLoader.ts. */
    --aeropress-cycle: 2400ms;
  }

  .aeropress-loader {
    position: relative;
    width: 96px;
    height: 116px;
  }

  /* The plunger's rod + cap move together as one group, sliding down inside
   * the chamber toward the filter cap - rendered *behind* .chamber in DOM
   * order so the chamber's translucent fill reads as clear plastic with the
   * plunger visible through it, rather than the plunger appearing to float
   * on top of the tube. */
  .plunger {
    position: absolute;
    top: -4px;
    left: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translate(-50%, 0);
    animation: brew-aeropress-press var(--aeropress-cycle) ease-in-out infinite;
    transition: transform 0.4s ease-out;
  }

  .plunger-rod {
    width: 6px;
    height: 22px;
    background: var(--brew-color-on-surface-variant);
    border-radius: 3px 3px 0 0;
  }

  .plunger-cap {
    width: 34px;
    height: 9px;
    margin-top: -2px;
    background: var(--brew-color-on-surface);
    border-radius: 2px;
  }

  /* Straight-walled cylinder, flat at the bottom where the filter cap
   * attaches - only the top corners (where the plunger enters) are rounded,
   * unlike a rounded "capsule" shape, so this reads as a tube rather than a
   * pouch. */
  .chamber {
    position: absolute;
    top: 4px;
    left: 50%;
    box-sizing: border-box;
    width: 46px;
    height: 56px;
    background: color-mix(in srgb, var(--brew-color-primary) 14%, transparent);
    border: 2px solid var(--brew-color-on-surface-variant);
    border-bottom: none;
    border-radius: 6px 6px 0 0;
    transform: translateX(-50%);
    overflow: hidden;
  }

  /* The actual brewing coffee sitting in the chamber before it's pressed
   * out - anchored to the chamber floor so its height shrinking reads as the
   * level dropping as it's pushed through the filter, not the liquid
   * shrinking in place. Synced to the same keyframe stops as .plunger's
   * press so the level visibly drops exactly as the plunger descends. */
  .chamber-liquid {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 34px;
    background: color-mix(in srgb, var(--brew-color-primary) 55%, transparent);
    animation: brew-aeropress-chamber-level var(--aeropress-cycle) ease-in-out infinite;
    transition: height 0.5s ease-out;
  }

  /* The flared plastic filter cap - deliberately *wider* than the chamber
   * (the signature AeroPress silhouette detail) and resting right at the
   * cup's rim, not suspended above it. */
  .filter-cap {
    position: absolute;
    top: 58px;
    left: 50%;
    box-sizing: border-box;
    width: 56px;
    height: 9px;
    background: var(--brew-color-on-surface-variant);
    border-radius: 3px;
    transform: translateX(-50%);
  }

  /* A short pulse of coffee color right at the filter cap, timed with the
   * press peak - stands in for "liquid passing through the filter", not a
   * drip falling through open air (the cap already sits at the cup's rim,
   * so there's no gap to fall through). */
  .flow {
    position: absolute;
    top: 64px;
    left: 50%;
    width: 4px;
    height: 10px;
    background: var(--brew-color-primary);
    border-radius: 2px;
    opacity: 0;
    transform: translateX(-50%);
    animation: brew-aeropress-flow var(--aeropress-cycle) ease-in-out infinite;
    transition: opacity 0.3s ease-out;
  }

  /* Nested a few px under the filter cap's bottom edge, so the AeroPress
   * reads as resting directly on the mug (as it does brewing in the
   * standard, non-inverted position) instead of floating above it. */
  .cup {
    position: absolute;
    top: 62px;
    left: 50%;
    box-sizing: border-box;
    width: 64px;
    height: 40px;
    border-right: 2px solid var(--brew-color-outline-variant);
    border-bottom: 2px solid var(--brew-color-outline-variant);
    border-left: 2px solid var(--brew-color-outline-variant);
    border-radius: 0 0 16px 16px;
    transform: translateX(-50%);
  }

  .cup-liquid {
    position: absolute;
    bottom: 2px;
    left: 2px;
    width: calc(100% - 4px);
    height: 10px;
    background: var(--brew-color-primary);
    border-radius: 0 0 14px 14px;
    transform-origin: bottom center;
    animation: brew-aeropress-ripple var(--aeropress-cycle) ease-in-out infinite;
    transition: height 0.6s ease-out;
  }

  .cup-handle {
    position: absolute;
    top: 8px;
    right: -13px;
    width: 15px;
    height: 20px;
    border: 2px solid var(--brew-color-outline-variant);
    border-left: none;
    border-radius: 0 10px 10px 0;
  }

  @keyframes brew-aeropress-press {
    0%,
    14% {
      transform: translate(-50%, 0);
    }
    50% {
      transform: translate(-50%, 38px);
    }
    86%,
    100% {
      transform: translate(-50%, 0);
    }
  }

  @keyframes brew-aeropress-chamber-level {
    0%,
    14% {
      height: 34px;
    }
    50% {
      height: 6px;
    }
    86%,
    100% {
      height: 34px;
    }
  }

  @keyframes brew-aeropress-flow {
    0%,
    46% {
      opacity: 0;
    }
    54%,
    70% {
      opacity: 1;
    }
    82%,
    100% {
      opacity: 0;
    }
  }

  @keyframes brew-aeropress-ripple {
    0%,
    72%,
    100% {
      transform: scaleX(1);
    }
    78% {
      transform: scaleX(1.08);
    }
    86% {
      transform: scaleX(1);
    }
  }

  /* "Finished" pose: the loop stops with the plunger held fully down and the
   * cup filled to the brim - the full cup itself is the "done" signal (see
   * AeropressLoader's \`done\` doc comment). Each property still has its own
   * \`transition\` above, so switching \`done\` on eases into this pose rather
   * than snapping. */
  :host([done]) .plunger {
    animation: none;
    transform: translate(-50%, 38px);
  }

  :host([done]) .flow {
    animation: none;
    opacity: 0;
  }

  :host([done]) .cup-liquid {
    animation: none;
    height: 34px;
  }

  :host([done]) .chamber-liquid {
    animation: none;
    height: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    .plunger,
    .flow,
    .cup-liquid,
    .chamber-liquid {
      animation: none;
      transition: none;
    }
  }
`;
