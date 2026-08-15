# brew-espresso-calculator

The espresso-specific input cluster shown on the Calculator screen in place
of `brew-ratio-form` when "Espresso Shot" is selected: a dose-in (g) field,
a coffee:water ratio field, and a dose-out / shot yield (g) field - a
dose-in/ratio/dose-out model instead of pour-over's water/cup-size/ratio
one, since a real double shot is ~18g in, not "6oz of water" at 1:2.

Also renders a static "Dial it in" troubleshooting card and a link to the
Espresso Recipes screen (`/more/espresso-recipes`) for browsing named shot
styles/profiles - neither needs props, they're identical on every render.

It's a _controlled_ component, the same contract as `brew-ratio-form`: it
renders whatever `doseIn`/`ratio`/`doseOut` it's given and fires a
`*-change` event per field, but doesn't do the dose-in/ratio/dose-out
linking math itself. The consumer owns that (see
`espresso-calculator.store.ts`'s
`setEspressoDoseIn`/`setEspressoRatio`/`setEspressoDoseOut`), so a global
ephemeral store can drive the markup.

## Usage

```html
<brew-espresso-calculator
  dose-in="${doseIn}"
  ratio="${ratio}"
  dose-out="${doseOut}"
  @dose-in-change="${(e) => setEspressoDoseIn(e.detail)}"
  @ratio-change="${(e) => setEspressoRatio(e.detail)}"
  @dose-out-change="${(e) => setEspressoDoseOut(e.detail)}"
></brew-espresso-calculator>
```

## Properties

| Property  | Attribute  | Type     | Default | Description                                    |
| --------- | ---------- | -------- | ------- | ---------------------------------------------- |
| `doseIn`  | `dose-in`  | `Number` | `18`    | Current dose-in (g) field value.               |
| `ratio`   | `ratio`    | `Number` | `2`     | Current ratio field value (the `N` in `1:N`).  |
| `doseOut` | `dose-out` | `Number` | `36`    | Current dose-out / shot yield (g) field value. |

## Events

| Event             | Type                  | Description                                  |
| ----------------- | --------------------- | -------------------------------------------- |
| `dose-in-change`  | `CustomEvent<string>` | Fired with the new dose-in (g) field value.  |
| `ratio-change`    | `CustomEvent<string>` | Fired with the new ratio field value.        |
| `dose-out-change` | `CustomEvent<string>` | Fired with the new dose-out (g) field value. |
