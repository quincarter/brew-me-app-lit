# brew-ratio-form

The water:coffee ratio input cluster - a ratio field, a linked Water (g) /
Cup size (oz) row, and a live "coffee needed" result box. Shared by the
Calculator screen and the Saved Ratio Detail screen's edit mode so both
inputs look and behave identically.

It's a _controlled_ component: it renders whatever `ratio`/`water`/`oz`/
`coffee` it's given and fires a `*-change` event per field, but doesn't do
the water/oz/ratio linking math itself. The consumer owns that (see
`calculator.store.ts`'s `setRatio`/`setWater`/`setOz`, and
`saved-detail-page.ts`'s local equivalents for editing an existing brew), so
both a global ephemeral store and a component-local `@state` can drive the
same markup.

## Usage

```html
<brew-ratio-form
  ratio="${ratio}"
  water="${water}"
  oz="${oz}"
  .coffee="${coffee}"
  @ratio-change="${(e) => setRatio(e.detail)}"
  @water-change="${(e) => setWater(e.detail)}"
  @oz-change="${(e) => setOz(e.detail)}"
></brew-ratio-form>
```

## Properties

| Property | Attribute | Type             | Default | Description                                               |
| -------- | --------- | ---------------- | ------- | --------------------------------------------------------- |
| `ratio`  | `ratio`   | `String`         | `"16"`  | Current ratio field value (the `N` in `N:1`).             |
| `water`  | `water`   | `String`         | `""`    | Current water (g) field value.                            |
| `oz`     | `oz`      | `String`         | `""`    | Current cup size (oz) field value.                        |
| `coffee` | -         | `number \| null` | `null`  | Computed coffee amount; hides the result box when `null`. |

## Events

| Event          | Type                  | Description                                   |
| -------------- | --------------------- | --------------------------------------------- |
| `ratio-change` | `CustomEvent<string>` | Fired with the new ratio field value.         |
| `water-change` | `CustomEvent<string>` | Fired with the new water (g) field value.     |
| `oz-change`    | `CustomEvent<string>` | Fired with the new cup size (oz) field value. |
