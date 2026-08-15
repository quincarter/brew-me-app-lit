import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
  IBrewStep,
  IEspressoProfile,
  IEspressoShotStyle,
} from "../../../shared/interfaces/brew.interface";
import { getEspressoRecipeSteps } from "../../../shared/utilities/espresso-recipe.utility";
import "../brew-espresso-recipe-card";
import type { EspressoRecipeCard } from "../EspressoRecipeCard";

const shotStyle: IEspressoShotStyle = {
  id: "double",
  label: "Double",
  ratio: 2,
  doseIn: 18,
  doseOut: 36,
  shotTimeSec: 28,
  blurb: "Double — 1:2, 25–30s, the everyday standard.",
};

const profile: IEspressoProfile = {
  id: "blooming-espresso",
  name: "Blooming Espresso",
  ratio: 2,
  doseIn: 18,
  doseOut: 36,
  shotTimeSec: 30,
  preinfusionSec: 10,
  grind: "Fine",
  waterTemp: "200°F",
  tagline: "A gentle pre-wet before the pull, like a mini bloom for the puck.",
};

const profileWithNote: IEspressoProfile = {
  id: "allonge",
  name: "Allongé",
  ratio: 2.5,
  doseIn: 18,
  doseOut: 45,
  shotTimeSec: 28,
  preinfusionSec: 5,
  grind: "Fine",
  waterTemp: "200°F",
  tagline: "A shot lengthened with hot water after pulling, French-café style.",
  note: "Pull as a standard double, then top with hot water to taste.",
};

describe("brew-espresso-recipe-card", () => {
  let element: EspressoRecipeCard;

  beforeEach(async () => {
    element = document.createElement("brew-espresso-recipe-card") as EspressoRecipeCard;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  const stepRow = (label: string): Element | undefined =>
    Array.from(element.shadowRoot?.querySelectorAll(".steps > li") ?? []).find(
      (row) => row.querySelector(".step-line-label")?.textContent?.trim() === label,
    );

  it("renders nothing when .recipe isn't set", () => {
    expect(element.shadowRoot?.querySelector(".card")).toBeNull();
  });

  it("renders collapsed by default when recipe is set, with label/ratio/dose badges", async () => {
    element.recipe = shotStyle;
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".card")?.classList.contains("expanded")).toBe(false);
    expect(element.shadowRoot?.querySelector(".body")).toBeNull();
    expect(element.shadowRoot?.querySelector(".label")?.textContent?.trim()).toBe("Double");
    expect(element.shadowRoot?.querySelector(".ratio-badge")?.textContent?.trim()).toBe("1:2");
    const doseBadges = Array.from(element.shadowRoot?.querySelectorAll(".dose-badge") ?? []).map(
      (badge) => badge.textContent?.trim(),
    );
    expect(doseBadges).toEqual(["18g in", "36g out"]);
  });

  it("shows the profile's .name (not .label) for a technique profile", async () => {
    element.recipe = profile;
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".label")?.textContent?.trim()).toBe(
      "Blooming Espresso",
    );
  });

  it("renders expanded when start-open is set", async () => {
    // startOpen only seeds the initial expanded state on connect, so it
    // must be set before the element is attached to the DOM.
    element.remove();
    element = document.createElement("brew-espresso-recipe-card") as EspressoRecipeCard;
    element.startOpen = true;
    element.recipe = shotStyle;
    document.body.appendChild(element);
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".card")?.classList.contains("expanded")).toBe(true);
    expect(element.shadowRoot?.querySelector(".body")).not.toBeNull();
  });

  it("toggles expanded state and aria-expanded when the header is clicked", async () => {
    element.recipe = shotStyle;
    await element.updateComplete;

    const header = element.shadowRoot?.querySelector("button.header") as HTMLButtonElement;
    expect(header.getAttribute("aria-expanded")).toBe("false");

    header.click();
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".card")?.classList.contains("expanded")).toBe(true);
    expect(element.shadowRoot?.querySelector(".body")).not.toBeNull();
    expect(header.getAttribute("aria-expanded")).toBe("true");

    header.click();
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".card")?.classList.contains("expanded")).toBe(false);
    expect(element.shadowRoot?.querySelector(".body")).toBeNull();
    expect(header.getAttribute("aria-expanded")).toBe("false");
  });

  it("renders the 4 canonical step rows (Grind/Water temp/Preinfusion/Shot time) for a plain shot style, using the style-wide defaults", async () => {
    element.remove();
    element = document.createElement("brew-espresso-recipe-card") as EspressoRecipeCard;
    element.startOpen = true;
    element.recipe = shotStyle;
    document.body.appendChild(element);
    await element.updateComplete;

    const rows = Array.from(element.shadowRoot?.querySelectorAll(".steps > li") ?? []);
    const labels = rows.map((row) => row.querySelector(".step-line-label")?.textContent?.trim());
    expect(labels).toEqual(["Grind", "Water temp", "Preinfusion", "Shot time"]);

    expect(stepRow("Grind")?.querySelector(".step-line-value")?.textContent?.trim()).toBe("Fine");
    expect(stepRow("Water temp")?.querySelector(".step-line-value")?.textContent?.trim()).toBe(
      "200°F",
    );
    expect(stepRow("Preinfusion")?.querySelector(".step-line-value")?.textContent?.trim()).toBe(
      "00:05",
    );
    expect(stepRow("Shot time")?.querySelector(".step-line-value")?.textContent?.trim()).toBe(
      "00:28",
    );
  });

  it("renders the 4 canonical step rows using the profile's own preinfusion/grind/water temp/shot time", async () => {
    element.remove();
    element = document.createElement("brew-espresso-recipe-card") as EspressoRecipeCard;
    element.startOpen = true;
    element.recipe = profile;
    document.body.appendChild(element);
    await element.updateComplete;

    expect(stepRow("Grind")?.querySelector(".step-line-value")?.textContent?.trim()).toBe("Fine");
    expect(stepRow("Water temp")?.querySelector(".step-line-value")?.textContent?.trim()).toBe(
      "200°F",
    );
    expect(stepRow("Preinfusion")?.querySelector(".step-line-value")?.textContent?.trim()).toBe(
      "00:10",
    );
    expect(stepRow("Shot time")?.querySelector(".step-line-value")?.textContent?.trim()).toBe(
      "00:30",
    );
  });

  it("shows tagline and note for a profile with a note", async () => {
    element.remove();
    element = document.createElement("brew-espresso-recipe-card") as EspressoRecipeCard;
    element.startOpen = true;
    element.recipe = profileWithNote;
    document.body.appendChild(element);
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".tagline")?.textContent?.trim()).toBe(
      profileWithNote.tagline,
    );
    expect(element.shadowRoot?.querySelector(".note")?.textContent?.trim()).toBe(
      profileWithNote.note,
    );
  });

  it("shows tagline but no note for a profile without one", async () => {
    element.remove();
    element = document.createElement("brew-espresso-recipe-card") as EspressoRecipeCard;
    element.startOpen = true;
    element.recipe = profile;
    document.body.appendChild(element);
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".tagline")?.textContent?.trim()).toBe(
      profile.tagline,
    );
    expect(element.shadowRoot?.querySelector(".note")).toBeNull();
  });

  it("shows neither tagline nor note for a plain shot style", async () => {
    element.remove();
    element = document.createElement("brew-espresso-recipe-card") as EspressoRecipeCard;
    element.startOpen = true;
    element.recipe = shotStyle;
    document.body.appendChild(element);
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".tagline")).toBeNull();
    expect(element.shadowRoot?.querySelector(".note")).toBeNull();
  });

  it("dispatches brew-now with the recipe object when 'Brew this recipe now' is clicked", async () => {
    element.recipe = shotStyle;
    await element.updateComplete;

    const header = element.shadowRoot?.querySelector("button.header") as HTMLButtonElement;
    header.click();
    await element.updateComplete;

    const brewButton = Array.from(element.shadowRoot?.querySelectorAll("brew-button") ?? []).find(
      (button) => button.textContent?.replace(/\s+/g, " ").includes("Brew this recipe now"),
    );
    expect(brewButton).not.toBeUndefined();

    const innerButton = brewButton?.shadowRoot?.querySelector("button");
    if (!innerButton) throw new Error("expected the brew-button's inner button");

    const brewNowEvent = new Promise<CustomEvent<IEspressoShotStyle | IEspressoProfile>>(
      (resolve) => {
        element.addEventListener("brew-now", (event) =>
          resolve(event as CustomEvent<IEspressoShotStyle | IEspressoProfile>),
        );
      },
    );

    innerButton.click();

    const event = await brewNowEvent;
    expect(event.detail).toEqual(shotStyle);
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });

  it("omits the brew button when hide-brew-button is set", async () => {
    element.remove();
    element = document.createElement("brew-espresso-recipe-card") as EspressoRecipeCard;
    element.startOpen = true;
    element.hideBrewButton = true;
    element.recipe = shotStyle;
    document.body.appendChild(element);
    await element.updateComplete;

    const brewButton = element.shadowRoot?.querySelector("brew-button");
    expect(brewButton).toBeNull();
  });

  describe("diffAgainst", () => {
    const originalSteps = getEspressoRecipeSteps(profile);

    // A single diffAgainst fixture exercising every diff state at once:
    // - "espresso-grind" unchanged
    // - "espresso-temp" changed (200°F -> 205°F)
    // - "espresso-preinfusion" removed
    // - "espresso-shot" changed (30s -> 35s)
    // - a new "espresso-extra" row added
    const diffAgainst: IBrewStep[] = [
      originalSteps[0], // espresso-grind, unchanged
      { ...originalSteps[1], value: "205°F" }, // espresso-temp, changed
      // "espresso-preinfusion" intentionally omitted (removed).
      { ...originalSteps[3], seconds: 35 }, // espresso-shot, changed
      { id: "espresso-extra", label: "Extra", kind: "note", value: "Swirl before locking in." }, // added
    ];

    beforeEach(async () => {
      element.remove();
      element = document.createElement("brew-espresso-recipe-card") as EspressoRecipeCard;
      element.startOpen = true;
      element.recipe = profile;
      document.body.appendChild(element);
      await element.updateComplete;
    });

    it("with diffAgainst unset, renders no diff classes/badges anywhere (regression guard)", () => {
      expect(element.shadowRoot?.querySelector(".step-changed")).toBeNull();
      expect(element.shadowRoot?.querySelector(".step-added")).toBeNull();
      expect(element.shadowRoot?.querySelector(".step-removed")).toBeNull();
      expect(element.shadowRoot?.querySelector(".step-moved")).toBeNull();
      expect(element.shadowRoot?.querySelector(".diff-badge")).toBeNull();
      expect(Array.from(element.shadowRoot?.querySelectorAll(".steps > li") ?? [])).toHaveLength(4);
    });

    it("with diffAgainst set but identical to the recipe's own canonical steps, falls back to plain rows (no diff annotation)", async () => {
      element.diffAgainst = getEspressoRecipeSteps(profile).map((step) => ({ ...step }));
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".step-changed")).toBeNull();
      expect(element.shadowRoot?.querySelector(".step-added")).toBeNull();
      expect(element.shadowRoot?.querySelector(".step-removed")).toBeNull();
      expect(element.shadowRoot?.querySelector(".step-moved")).toBeNull();
      expect(element.shadowRoot?.querySelector(".diff-badge")).toBeNull();
      const rows = Array.from(element.shadowRoot?.querySelectorAll(".steps > li") ?? []);
      expect(rows).toHaveLength(4);
      expect(rows.map((row) => row.querySelector(".step-line-label")?.textContent?.trim())).toEqual(
        ["Grind", "Water temp", "Preinfusion", "Shot time"],
      );
    });

    it("a changed row renders old -> new with a Changed badge; unaffected rows show no diff annotation", async () => {
      element.diffAgainst = diffAgainst;
      await element.updateComplete;

      const tempRow = stepRow("Water temp");
      expect(tempRow).not.toBeUndefined();
      expect(tempRow?.classList.contains("step-changed")).toBe(true);
      expect(tempRow?.querySelector(".diff-old")?.textContent?.trim()).toBe("200°F");
      expect(tempRow?.querySelector(".diff-new")?.textContent?.trim()).toBe("205°F");
      expect(tempRow?.querySelector(".diff-badge")?.textContent?.trim()).toBe("Changed");

      const grindRow = stepRow("Grind");
      expect(grindRow?.classList.contains("step-changed")).toBe(false);
      expect(grindRow?.querySelector(".diff-badge")).toBeNull();
    });

    it("a removed row renders struck-through with a Removed badge, showing the original value", async () => {
      element.diffAgainst = diffAgainst;
      await element.updateComplete;

      const preinfusionRow = stepRow("Preinfusion");
      expect(preinfusionRow).not.toBeUndefined();
      expect(preinfusionRow?.classList.contains("step-removed")).toBe(true);
      expect(preinfusionRow?.querySelector(".step-line-value")?.textContent?.trim()).toBe("00:10");
      expect(preinfusionRow?.querySelector(".diff-badge")?.textContent?.trim()).toBe("Removed");
    });

    it("an added row (present in diffAgainst, absent from the canonical list) is appended with an Added badge", async () => {
      element.diffAgainst = diffAgainst;
      await element.updateComplete;

      const rows = Array.from(element.shadowRoot?.querySelectorAll(".steps > li") ?? []);
      const lastRow = rows[rows.length - 1];
      expect(lastRow.querySelector(".step-line-label")?.textContent?.trim()).toBe("Extra");
      expect(lastRow.classList.contains("step-added")).toBe(true);
      expect(lastRow.querySelector(".step-line-value")?.textContent?.trim()).toBe(
        "Swirl before locking in.",
      );
      expect(lastRow.querySelector(".diff-badge")?.textContent?.trim()).toBe("Added");
    });

    it("a changed shot time renders old -> new via formatSeconds with a Changed badge", async () => {
      element.diffAgainst = diffAgainst;
      await element.updateComplete;

      const shotRow = stepRow("Shot time");
      expect(shotRow?.classList.contains("step-changed")).toBe(true);
      expect(shotRow?.querySelector(".diff-old")?.textContent?.trim()).toBe("00:30");
      expect(shotRow?.querySelector(".diff-new")?.textContent?.trim()).toBe("00:35");
    });

    describe("moved rows", () => {
      it("flags only the relocated row as moved when only the order changed (no content edits, no add/remove)", async () => {
        const reorderOnlyDiffAgainst: IBrewStep[] = [
          originalSteps[0], // espresso-grind
          originalSteps[2], // espresso-preinfusion, moved ahead of espresso-temp
          originalSteps[1], // espresso-temp
          originalSteps[3], // espresso-shot
        ];
        element.diffAgainst = reorderOnlyDiffAgainst;
        await element.updateComplete;

        const preinfusionRow = stepRow("Preinfusion");
        const tempRow = stepRow("Water temp");
        const grindRow = stepRow("Grind");

        expect(preinfusionRow?.classList.contains("step-moved")).toBe(true);
        expect(preinfusionRow?.querySelector(".diff-badge-moved")?.textContent?.trim()).toBe(
          "Moved",
        );
        expect(tempRow?.classList.contains("step-moved")).toBe(false);
        expect(grindRow?.classList.contains("step-moved")).toBe(false);
        expect(element.shadowRoot?.querySelector(".step-changed")).toBeNull();
      });

      it("renders both Changed and Moved badges when a row is both edited and relocated", async () => {
        const changedAndMovedDiffAgainst: IBrewStep[] = [
          { ...originalSteps[3], seconds: 35 }, // espresso-shot, changed and moved to front
          originalSteps[0], // espresso-grind
          originalSteps[1], // espresso-temp
          originalSteps[2], // espresso-preinfusion
        ];
        element.diffAgainst = changedAndMovedDiffAgainst;
        await element.updateComplete;

        const shotRow = stepRow("Shot time");
        expect(shotRow?.classList.contains("step-changed")).toBe(true);
        expect(shotRow?.classList.contains("step-moved")).toBe(true);
        const badgeTexts = Array.from(shotRow?.querySelectorAll(".diff-badge") ?? []).map((badge) =>
          badge.textContent?.trim(),
        );
        expect(badgeTexts).toEqual(["Changed", "Moved"]);
      });

      it("does not flag a removed or added row as moved even though kept rows were reordered in the same diff", async () => {
        const extraRow: IBrewStep = {
          id: "espresso-extra",
          label: "Extra",
          kind: "note",
          value: "Swirl before locking in.",
        };
        const removedAddedReorderDiffAgainst: IBrewStep[] = [
          originalSteps[3], // espresso-shot, moved to front among the kept rows
          originalSteps[0], // espresso-grind
          originalSteps[1], // espresso-temp
          // "espresso-preinfusion" intentionally omitted (removed)
          extraRow, // added
        ];
        element.diffAgainst = removedAddedReorderDiffAgainst;
        await element.updateComplete;

        const shotRow = stepRow("Shot time");
        const extraRowEl = stepRow("Extra");
        const preinfusionRow = stepRow("Preinfusion");

        expect(shotRow?.classList.contains("step-moved")).toBe(true);
        expect(preinfusionRow?.classList.contains("step-removed")).toBe(true);
        expect(preinfusionRow?.classList.contains("step-moved")).toBe(false);
        expect(extraRowEl?.classList.contains("step-added")).toBe(true);
        expect(extraRowEl?.classList.contains("step-moved")).toBe(false);
      });

      it("regression guard: no row shows a Moved badge when the diff has no reordering (only content changes/add/remove)", async () => {
        element.diffAgainst = diffAgainst;
        await element.updateComplete;

        expect(element.shadowRoot?.querySelector(".step-moved")).toBeNull();
        expect(element.shadowRoot?.querySelector(".diff-badge-moved")).toBeNull();
      });
    });
  });
});
