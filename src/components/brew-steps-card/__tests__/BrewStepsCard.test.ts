import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IBrewStep, IBrewStepsConfig } from "../../../shared/interfaces/brew.interface";
import {
  customStepLabelsSignal,
  knownStepLabelsSignal,
} from "../../../shared/stores/custom-step-labels.store";
import "../brew-steps-card";
import type { BrewStepsCard } from "../BrewStepsCard";

const baseSteps: IBrewStep[] = [
  { id: "s1", label: "Bloom", kind: "timed", seconds: 30, note: "Wet grounds" },
  { id: "s2", label: "Plunge", kind: "timed", seconds: null },
  { id: "s3", label: "Filter", kind: "note", value: "Paper" },
];

const baseConfig: IBrewStepsConfig = { steps: baseSteps };

const progressSteps: IBrewStep[] = [
  { id: "p1", label: "Bloom", kind: "timed", seconds: 30 },
  { id: "p2", label: "Pour", kind: "timed", seconds: 45 },
  { id: "p3", label: "Draw down", kind: "timed", seconds: null },
];
const progressConfig: IBrewStepsConfig = { steps: progressSteps };

describe("brew-steps-card", () => {
  let element: BrewStepsCard;

  const mount = async (options?: { editing?: boolean }): Promise<void> => {
    element = document.createElement("brew-steps-card") as BrewStepsCard;
    element.startOpen = true;
    if (options?.editing) element.editing = true;
    document.body.appendChild(element);
    element.config = baseConfig;
    await element.updateComplete;
  };

  const waitForConfigChange = (): Promise<CustomEvent<IBrewStepsConfig>> =>
    new Promise((resolve) => {
      element.addEventListener(
        "config-change",
        (event) => resolve(event as CustomEvent<IBrewStepsConfig>),
        {
          once: true,
        },
      );
    });

  beforeEach(() => {
    customStepLabelsSignal.value = [];
  });

  afterEach(() => {
    element.remove();
  });

  describe("read-only rendering", () => {
    beforeEach(async () => {
      await mount();
    });

    it("renders nothing (no card at all) when config is null", async () => {
      element.config = null;
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".card")).toBeNull();
    });

    it("shows a formatted duration pill for a timed row with a numeric duration", () => {
      const rows = element.shadowRoot?.querySelectorAll(".step-row");
      const bloomRow = rows?.[0];
      expect(bloomRow?.querySelector(".step-label")?.textContent).toBe("Bloom");
      expect(bloomRow?.querySelector(".pill")?.textContent?.trim()).toBe("00:30");
      expect(bloomRow?.querySelector(".pill")?.classList.contains("pill-timed")).toBe(true);
      expect(bloomRow?.querySelector(".step-note")?.textContent).toBe("Wet grounds");
    });

    it("shows 'Now' for a timed row with null seconds (an untimed marker)", () => {
      const rows = element.shadowRoot?.querySelectorAll(".step-row");
      const plungeRow = rows?.[1];
      expect(plungeRow?.querySelector(".pill")?.textContent?.trim()).toBe("Now");
    });

    it("shows the value in a note-styled pill for a note row", () => {
      const rows = element.shadowRoot?.querySelectorAll(".step-row");
      const filterRow = rows?.[2];
      expect(filterRow?.querySelector(".pill")?.textContent?.trim()).toBe("Paper");
      expect(filterRow?.querySelector(".pill")?.classList.contains("pill-timed")).toBe(false);
    });

    it("renders a timeline segment only for timed rows with a positive numeric duration", () => {
      const segments = element.shadowRoot?.querySelectorAll(".timeline-segment");
      // Only "Bloom" (30s) qualifies - "Plunge" has null seconds, "Filter" is a note row.
      expect(segments).toHaveLength(1);
      expect(segments?.[0]?.getAttribute("style")).toContain("flex-grow:30");
      expect(segments?.[0]?.getAttribute("title")).toBe("Bloom · 00:30");
    });

    it("renders no timeline bar at all when there are no timed rows with a numeric duration", async () => {
      element.config = { steps: [baseSteps[2]] };
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".timeline")).toBeNull();
    });

    it("does not render edit-only controls", () => {
      expect(element.shadowRoot?.querySelector(".edit-row")).toBeNull();
      expect(element.shadowRoot?.querySelector(".label-select")).toBeNull();
    });

    it("renders long WAC-style note prose as wrapped text, not a pill", async () => {
      const proseStep: IBrewStep = {
        id: "s4",
        label: "Step 1",
        kind: "note",
        value: "At 50s, begin gently pressing for about 20 seconds.",
      };
      element.config = { steps: [proseStep] };
      await element.updateComplete;

      const row = element.shadowRoot?.querySelector(".step-row");
      expect(row?.querySelector(".pill")).toBeNull();
      expect(row?.querySelector(".step-note-value")?.textContent?.trim()).toBe(proseStep.value);
    });

    it("still renders a short single-word note value as a pill", () => {
      const rows = element.shadowRoot?.querySelectorAll(".step-row");
      const filterRow = rows?.[2];
      expect(filterRow?.querySelector(".step-note-value")).toBeNull();
      expect(filterRow?.querySelector(".pill")?.textContent?.trim()).toBe("Paper");
    });

    it("treats a note value as long once it contains a space, even if short", async () => {
      const shortPhraseStep: IBrewStep = {
        id: "s5",
        label: "Filter",
        kind: "note",
        value: "Metal disc",
      };
      element.config = { steps: [shortPhraseStep] };
      await element.updateComplete;

      const row = element.shadowRoot?.querySelector(".step-row");
      expect(row?.querySelector(".pill")).toBeNull();
      expect(row?.querySelector(".step-note-value")?.textContent?.trim()).toBe("Metal disc");
    });
  });

  describe("condensed collapsed view", () => {
    it("renders timeline and condensed cue when collapsed (startOpen = false)", async () => {
      const card = document.createElement("brew-steps-card") as BrewStepsCard;
      document.body.appendChild(card);
      card.config = baseConfig;
      await card.updateComplete;

      expect(card.shadowRoot?.querySelector(".timeline")).not.toBeNull();
      const cue = card.shadowRoot?.querySelector(".condensed-cue");
      expect(cue).not.toBeNull();
      expect(cue?.querySelector(".cue-label")?.textContent).toBe("Bloom");
      card.remove();
    });

    it("renders active step and countdown in condensed cue when elapsedSeconds is provided", async () => {
      const card = document.createElement("brew-steps-card") as BrewStepsCard;
      document.body.appendChild(card);
      card.config = progressConfig;
      card.elapsedSeconds = 40; // 10s into second step ("Pour", 45s) -> 35s left
      await card.updateComplete;

      const cue = card.shadowRoot?.querySelector(".condensed-cue");
      expect(cue?.querySelector(".cue-label")?.textContent).toBe("Pour");
      expect(cue?.querySelector(".pill")?.textContent?.trim()).toBe("00:35 left");
      card.remove();
    });
  });

  describe("elapsedSeconds progress view (read-only, non-editing)", () => {
    beforeEach(async () => {
      await mount();
      element.config = progressConfig;
      await element.updateComplete;
    });

    it("does not add step-status classes or a check icon when elapsedSeconds is null (Calculator/Saved Detail usage)", () => {
      const rows = element.shadowRoot?.querySelectorAll(".step-row");
      rows?.forEach((row) => {
        expect(row.classList.contains("step-done")).toBe(false);
        expect(row.classList.contains("step-active")).toBe(false);
        expect(row.classList.contains("step-upcoming")).toBe(false);
      });
      expect(element.shadowRoot?.querySelector(".step-check")).toBeNull();
      expect(element.shadowRoot?.querySelector(".timeline-progress")).toBeNull();
    });

    it("marks earlier timed rows done (with a check icon) and the current row active, at elapsed time within the second step's window", async () => {
      element.elapsedSeconds = 50;
      await element.updateComplete;

      const rows = element.shadowRoot?.querySelectorAll(".step-row");
      expect(rows?.[0]?.classList.contains("step-done")).toBe(true);
      expect(rows?.[0]?.querySelector(".step-check")).not.toBeNull();
      expect(rows?.[1]?.classList.contains("step-active")).toBe(true);
      expect(rows?.[1]?.querySelector(".step-check")).toBeNull();
      expect(rows?.[2]?.classList.contains("step-upcoming")).toBe(true);
    });

    it("shows the active row's pill as remaining time 'left' instead of its total duration", async () => {
      element.elapsedSeconds = 40;
      await element.updateComplete;

      // 40s elapsed, second step ("Pour", 45s) starts at 30s -> 10s in, 35s left.
      const rows = element.shadowRoot?.querySelectorAll(".step-row");
      expect(rows?.[1]?.querySelector(".pill")?.textContent?.trim()).toBe("00:35 left");
    });

    it("still shows the plain total duration for a done row's pill, not remaining time", async () => {
      element.elapsedSeconds = 50;
      await element.updateComplete;

      const rows = element.shadowRoot?.querySelectorAll(".step-row");
      expect(rows?.[0]?.querySelector(".pill")?.textContent?.trim()).toBe("00:30");
    });

    it("marks the whole remaining window's active step exactly at its start-second boundary, with full time left", async () => {
      element.elapsedSeconds = 30;
      await element.updateComplete;

      const rows = element.shadowRoot?.querySelectorAll(".step-row");
      expect(rows?.[0]?.classList.contains("step-done")).toBe(true);
      expect(rows?.[1]?.classList.contains("step-active")).toBe(true);
      expect(rows?.[1]?.querySelector(".pill")?.textContent?.trim()).toBe("00:45 left");
    });

    it("marks a trailing null-duration timed step active once reached, showing 'Now' rather than a countdown", async () => {
      element.elapsedSeconds = 200;
      await element.updateComplete;

      const rows = element.shadowRoot?.querySelectorAll(".step-row");
      expect(rows?.[0]?.classList.contains("step-done")).toBe(true);
      expect(rows?.[1]?.classList.contains("step-done")).toBe(true);
      expect(rows?.[2]?.classList.contains("step-active")).toBe(true);
      expect(rows?.[2]?.querySelector(".pill")?.textContent?.trim()).toBe("Now");
    });

    it("renders a timeline-progress marker once elapsedSeconds is set and there's at least one positive-duration timed step", async () => {
      element.elapsedSeconds = 10;
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".timeline-progress")).not.toBeNull();
    });

    it("renders no timeline-progress marker when there are no positive-duration timed steps, even with elapsedSeconds set", async () => {
      element.config = { steps: [baseSteps[2]] };
      element.elapsedSeconds = 10;
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".timeline")).toBeNull();
      expect(element.shadowRoot?.querySelector(".timeline-progress")).toBeNull();
    });

    it("ignores elapsedSeconds while editing - no step-status classes, check icon, 'left' pill, or timeline marker", async () => {
      element.elapsedSeconds = 40;
      element.editing = true;
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".step-row")).toBeNull();
      expect(element.shadowRoot?.querySelector(".step-check")).toBeNull();
      expect(element.shadowRoot?.querySelector(".timeline-progress")).toBeNull();
    });
  });

  describe("edit mode rendering", () => {
    beforeEach(async () => {
      await mount({ editing: true });
    });

    it("renders a label select and no read-only pills", () => {
      const editRows = element.shadowRoot?.querySelectorAll(".edit-row");
      expect(editRows).toHaveLength(3);
      expect(element.shadowRoot?.querySelector(".step-row")).toBeNull();
      editRows?.forEach((row) => expect(row.querySelector(".label-select")).not.toBeNull());
    });

    it("renders a number input for a timed row's value", () => {
      const editRows = element.shadowRoot?.querySelectorAll(".edit-row");
      const bloomInput = editRows?.[0]?.querySelector<HTMLInputElement>(".value-input");
      expect(bloomInput?.type).toBe("number");
      expect(bloomInput?.value).toBe("30");
    });

    it("renders a text input for a note row's value", () => {
      const editRows = element.shadowRoot?.querySelectorAll(".edit-row");
      const filterInput = editRows?.[2]?.querySelector<HTMLInputElement>(".value-input");
      expect(filterInput?.type).toBe("text");
      expect(filterInput?.value).toBe("Paper");
    });

    it("renders a remove control and an add-step control", () => {
      const removeButtons = element.shadowRoot?.querySelectorAll("brew-icon-button[icon='delete']");
      expect(removeButtons).toHaveLength(3);
      const addButton = Array.from(element.shadowRoot?.querySelectorAll("brew-button") ?? []).find(
        (button) => button.textContent?.includes("Add step"),
      );
      expect(addButton).not.toBeUndefined();
    });

    it("renders a drag handle for each row", () => {
      const dragHandles = element.shadowRoot?.querySelectorAll("brew-icon-button.drag-handle");
      expect(dragHandles).toHaveLength(3);
    });

    it("renders a 'Reset to preset' action alongside 'Add step'", () => {
      const resetButton = Array.from(
        element.shadowRoot?.querySelectorAll("brew-button") ?? [],
      ).find((button) => button.textContent?.includes("Reset to preset"));
      expect(resetButton).not.toBeUndefined();
    });

    it("does not render a 'Reset to preset' action outside edit mode", async () => {
      element.editing = false;
      await element.updateComplete;

      const resetButton = Array.from(
        element.shadowRoot?.querySelectorAll("brew-button") ?? [],
      ).find((button) => button.textContent?.includes("Reset to preset"));
      expect(resetButton).toBeUndefined();
    });

    it("expands automatically even when startOpen is false, since editing a collapsed card would hide its own controls", async () => {
      const collapsed = document.createElement("brew-steps-card") as BrewStepsCard;
      document.body.appendChild(collapsed);
      collapsed.config = baseConfig;
      await collapsed.updateComplete;
      expect(collapsed.shadowRoot?.querySelector(".body")).toBeNull();

      collapsed.editing = true;
      await collapsed.updateComplete;

      expect(collapsed.shadowRoot?.querySelector(".body")).not.toBeNull();
      collapsed.remove();
    });
  });

  describe("editing interactions", () => {
    beforeEach(async () => {
      await mount({ editing: true });
    });

    it("fires config-change with the row's value updated when a timed row's duration input changes", async () => {
      const input = element.shadowRoot?.querySelectorAll<HTMLInputElement>(".value-input")[0];
      if (!input) throw new Error("expected the Bloom row's duration input");
      const changed = waitForConfigChange();

      input.value = "45";
      input.dispatchEvent(new Event("input", { bubbles: true }));

      const event = await changed;
      expect(event.detail.steps[0]).toMatchObject({ id: "s1", seconds: 45 });
      expect(event.detail.steps[1]).toEqual(baseSteps[1]);
      expect(event.detail.steps[2]).toEqual(baseSteps[2]);
    });

    it("fires config-change with the row's value updated when a note row's text input changes", async () => {
      const input = element.shadowRoot?.querySelectorAll<HTMLInputElement>(".value-input")[2];
      if (!input) throw new Error("expected the Filter row's text input");
      const changed = waitForConfigChange();

      input.value = "Cloth";
      input.dispatchEvent(new Event("input", { bubbles: true }));

      const event = await changed;
      expect(event.detail.steps[2]).toMatchObject({ id: "s3", value: "Cloth" });
    });

    it("fires config-change with an updated label when an existing label is chosen from the select", async () => {
      const select = element.shadowRoot?.querySelectorAll<HTMLSelectElement>(".label-select")[2];
      if (!select) throw new Error("expected the Filter row's label select");
      // "Steep" comes from other presets (Aeropress/Clever Dripper/French
      // Press all include it), so it's guaranteed to be a known option.
      expect(knownStepLabelsSignal.value).toContain("Steep");
      const changed = waitForConfigChange();

      select.value = "Steep";
      select.dispatchEvent(new Event("change", { bubbles: true }));

      const event = await changed;
      expect(event.detail.steps[2]).toMatchObject({ id: "s3", label: "Steep" });
    });

    it("fires config-change toggling a timed row to a note row, clearing seconds and seeding an empty value", async () => {
      const toggle = element.shadowRoot?.querySelectorAll<HTMLButtonElement>(".kind-toggle")[0];
      if (!toggle) throw new Error("expected the Bloom row's kind toggle");
      const changed = waitForConfigChange();

      toggle.click();

      const event = await changed;
      expect(event.detail.steps[0]).toMatchObject({ id: "s1", kind: "note", value: "" });
      expect(event.detail.steps[0]?.seconds).toBeUndefined();
    });

    it("fires config-change toggling a note row to a timed row, defaulting to 30 seconds", async () => {
      const toggle = element.shadowRoot?.querySelectorAll<HTMLButtonElement>(".kind-toggle")[2];
      if (!toggle) throw new Error("expected the Filter row's kind toggle");
      const changed = waitForConfigChange();

      toggle.click();

      const event = await changed;
      expect(event.detail.steps[2]).toMatchObject({ id: "s3", kind: "timed", seconds: 30 });
      expect(event.detail.steps[2]?.value).toBeUndefined();
    });

    it("fires config-change with the row removed when its remove control is activated", async () => {
      const removeButtons = element.shadowRoot?.querySelectorAll("brew-icon-button[icon='delete']");
      const filterRemove = removeButtons?.[2];
      if (!filterRemove) throw new Error("expected the Filter row's remove control");
      const changed = waitForConfigChange();

      filterRemove.dispatchEvent(new CustomEvent("icon-click", { bubbles: true, composed: true }));

      const event = await changed;
      expect(event.detail.steps).toHaveLength(2);
      expect(event.detail.steps.map((step) => step.id)).toEqual(["s1", "s2"]);
    });

    it("fires config-change with a new blank note row appended when '+ Add step' is activated", async () => {
      const addButton = Array.from(element.shadowRoot?.querySelectorAll("brew-button") ?? []).find(
        (button) => button.textContent?.includes("Add step"),
      );
      const innerButton = addButton?.shadowRoot?.querySelector("button");
      if (!innerButton) throw new Error("expected the Add step button");
      const changed = waitForConfigChange();

      innerButton.click();

      const event = await changed;
      expect(event.detail.steps).toHaveLength(4);
      expect(event.detail.steps[3]).toMatchObject({ label: "", kind: "note", value: "" });
      expect(typeof event.detail.steps[3]?.id).toBe("string");
    });

    it("choosing 'Add custom…' reveals a draft field and, once confirmed, persists the label and fires config-change", async () => {
      const select = element.shadowRoot?.querySelectorAll<HTMLSelectElement>(".label-select")[2];
      if (!select) throw new Error("expected the Filter row's label select");

      select.value = "__add_custom__";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      await element.updateComplete;

      const draftField = element.shadowRoot?.querySelector("brew-text-field");
      expect(draftField).not.toBeNull();

      draftField?.dispatchEvent(
        new CustomEvent<string>("value-change", { detail: "Rest", bubbles: true, composed: true }),
      );
      await element.updateComplete;

      const addButton = Array.from(
        element.shadowRoot?.querySelectorAll(".custom-label-actions brew-button") ?? [],
      ).find((button) => button.textContent?.trim() === "Add");
      const innerAdd = addButton?.shadowRoot?.querySelector("button");
      if (!innerAdd) throw new Error("expected the custom-label Add button");
      const changed = waitForConfigChange();

      innerAdd.click();

      const event = await changed;
      expect(event.detail.steps[2]).toMatchObject({ id: "s3", label: "Rest" });
      expect(customStepLabelsSignal.value).toContain("Rest");
      // The draft UI closes back down once confirmed.
      await element.updateComplete;
      expect(element.shadowRoot?.querySelector("brew-text-field")).toBeNull();
    });

    it("fires reset-to-preset with no payload when 'Reset to preset' is activated, without calling config-change", async () => {
      const resetButton = Array.from(
        element.shadowRoot?.querySelectorAll("brew-button") ?? [],
      ).find((button) => button.textContent?.includes("Reset to preset"));
      const innerButton = resetButton?.shadowRoot?.querySelector("button");
      if (!innerButton) throw new Error("expected the Reset to preset button");

      let configChangeFired = false;
      element.addEventListener("config-change", () => {
        configChangeFired = true;
      });
      const resetEvent = new Promise<CustomEvent>((resolve) => {
        element.addEventListener("reset-to-preset", (event) => resolve(event as CustomEvent), {
          once: true,
        });
      });

      innerButton.click();

      const event = await resetEvent;
      expect(event.detail).toBeNull();
      expect(configChangeFired).toBe(false);
    });

    it("cancelling the custom-label draft hides it without firing config-change", async () => {
      const select = element.shadowRoot?.querySelectorAll<HTMLSelectElement>(".label-select")[2];
      if (!select) throw new Error("expected the Filter row's label select");
      select.value = "__add_custom__";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      await element.updateComplete;

      const cancelButton = Array.from(
        element.shadowRoot?.querySelectorAll(".custom-label-actions brew-button") ?? [],
      ).find((button) => button.textContent?.trim() === "Cancel");
      const innerCancel = cancelButton?.shadowRoot?.querySelector("button");
      let fired = false;
      element.addEventListener("config-change", () => {
        fired = true;
      });

      innerCancel?.click();
      await element.updateComplete;

      expect(fired).toBe(false);
      expect(element.shadowRoot?.querySelector("brew-text-field")).toBeNull();
    });
  });

  describe("drag-to-reorder", () => {
    beforeEach(async () => {
      await mount({ editing: true });
    });

    const dragHandles = (): NodeListOf<Element> =>
      element.shadowRoot!.querySelectorAll(".edit-row brew-icon-button.drag-handle");

    const editRowFor = (stepId: string): HTMLElement => {
      const row = element.shadowRoot?.querySelector<HTMLElement>(
        `.edit-row[data-step-id="${stepId}"]`,
      );
      if (!row) throw new Error(`expected an edit row for step ${stepId}`);
      return row;
    };

    it("has a data-step-id on every edit row matching its step", () => {
      const rows = element.shadowRoot?.querySelectorAll<HTMLElement>(".edit-row");
      expect(rows?.length).toBe(3);
      expect(Array.from(rows ?? []).map((row) => row.dataset.stepId)).toEqual(["s1", "s2", "s3"]);
    });

    describe("keyboard", () => {
      it("fires config-change with the first two steps swapped when ArrowDown is pressed on the first row's drag handle", async () => {
        const handle = dragHandles()[0];
        if (!handle) throw new Error("expected the Bloom row's drag handle");
        const changed = waitForConfigChange();

        handle.dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, composed: true }),
        );

        const event = await changed;
        expect(event.detail.steps.map((step) => step.id)).toEqual(["s2", "s1", "s3"]);
      });

      it("fires config-change moving a middle row up one position when ArrowUp is pressed on its drag handle", async () => {
        const handle = dragHandles()[1];
        if (!handle) throw new Error("expected the Plunge row's drag handle");
        const changed = waitForConfigChange();

        handle.dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, composed: true }),
        );

        const event = await changed;
        expect(event.detail.steps.map((step) => step.id)).toEqual(["s2", "s1", "s3"]);
      });

      it("fires config-change moving the last row up one position when ArrowUp is pressed on its drag handle", async () => {
        const handle = dragHandles()[2];
        if (!handle) throw new Error("expected the Filter row's drag handle");
        const changed = waitForConfigChange();

        handle.dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, composed: true }),
        );

        const event = await changed;
        expect(event.detail.steps.map((step) => step.id)).toEqual(["s1", "s3", "s2"]);
      });

      it("does not fire config-change when ArrowUp is pressed on the first row (already at the top)", async () => {
        const handle = dragHandles()[0];
        if (!handle) throw new Error("expected the Bloom row's drag handle");
        let fired = false;
        element.addEventListener("config-change", () => {
          fired = true;
        });

        handle.dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, composed: true }),
        );
        await element.updateComplete;

        expect(fired).toBe(false);
      });

      it("does not fire config-change when ArrowDown is pressed on the last row (already at the bottom)", async () => {
        const handle = dragHandles()[2];
        if (!handle) throw new Error("expected the Filter row's drag handle");
        let fired = false;
        element.addEventListener("config-change", () => {
          fired = true;
        });

        handle.dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, composed: true }),
        );
        await element.updateComplete;

        expect(fired).toBe(false);
      });

      it("does not fire config-change for an unrelated key", async () => {
        const handle = dragHandles()[0];
        if (!handle) throw new Error("expected the Bloom row's drag handle");
        let fired = false;
        element.addEventListener("config-change", () => {
          fired = true;
        });

        handle.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", bubbles: true, composed: true }),
        );
        await element.updateComplete;

        expect(fired).toBe(false);
      });
    });

    describe("pointer drag", () => {
      afterEach(() => {
        // @ts-expect-error - restoring the stub set by individual tests.
        delete document.elementFromPoint;
      });

      it("fires config-change reordering the dragged row to sit where the row the pointer moved over was", async () => {
        const handle = dragHandles()[0];
        if (!handle) throw new Error("expected the Bloom row's drag handle");
        const filterRow = editRowFor("s3");
        document.elementFromPoint = () => filterRow;
        const changed = waitForConfigChange();

        handle.dispatchEvent(
          new PointerEvent("pointerdown", { pointerId: 1, bubbles: true, composed: true }),
        );
        handle.dispatchEvent(
          new PointerEvent("pointermove", {
            pointerId: 1,
            clientX: 10,
            clientY: 100,
            bubbles: true,
            composed: true,
          }),
        );
        handle.dispatchEvent(
          new PointerEvent("pointerup", { pointerId: 1, bubbles: true, composed: true }),
        );

        const event = await changed;
        expect(event.detail.steps.map((step) => step.id)).toEqual(["s2", "s3", "s1"]);
      });

      it("does not fire config-change when the drag ends without the order actually changing", async () => {
        const handle = dragHandles()[0];
        if (!handle) throw new Error("expected the Bloom row's drag handle");
        let fired = false;
        element.addEventListener("config-change", () => {
          fired = true;
        });

        handle.dispatchEvent(
          new PointerEvent("pointerdown", { pointerId: 1, bubbles: true, composed: true }),
        );
        handle.dispatchEvent(
          new PointerEvent("pointerup", { pointerId: 1, bubbles: true, composed: true }),
        );
        await element.updateComplete;

        expect(fired).toBe(false);
      });

      it("does not reorder when the pointer moves over the row already being dragged", async () => {
        const handle = dragHandles()[0];
        if (!handle) throw new Error("expected the Bloom row's drag handle");
        const bloomRow = editRowFor("s1");
        document.elementFromPoint = () => bloomRow;
        let fired = false;
        element.addEventListener("config-change", () => {
          fired = true;
        });

        handle.dispatchEvent(
          new PointerEvent("pointerdown", { pointerId: 1, bubbles: true, composed: true }),
        );
        handle.dispatchEvent(
          new PointerEvent("pointermove", {
            pointerId: 1,
            clientX: 10,
            clientY: 10,
            bubbles: true,
            composed: true,
          }),
        );
        handle.dispatchEvent(
          new PointerEvent("pointerup", { pointerId: 1, bubbles: true, composed: true }),
        );
        await element.updateComplete;

        expect(fired).toBe(false);
      });

      it("resolves the row under the pointer via elementFromPoint even when it returns a descendant of the row", async () => {
        const handle = dragHandles()[0];
        if (!handle) throw new Error("expected the Bloom row's drag handle");
        const filterRow = editRowFor("s3");
        const descendant = filterRow.querySelector(".label-select");
        if (!descendant) throw new Error("expected a descendant of the Filter row");
        document.elementFromPoint = () => descendant;
        const changed = waitForConfigChange();

        handle.dispatchEvent(
          new PointerEvent("pointerdown", { pointerId: 1, bubbles: true, composed: true }),
        );
        handle.dispatchEvent(
          new PointerEvent("pointermove", {
            pointerId: 1,
            clientX: 10,
            clientY: 100,
            bubbles: true,
            composed: true,
          }),
        );
        handle.dispatchEvent(
          new PointerEvent("pointerup", { pointerId: 1, bubbles: true, composed: true }),
        );

        const event = await changed;
        expect(event.detail.steps.map((step) => step.id)).toEqual(["s2", "s3", "s1"]);
      });
    });
  });
});
