# brew-button

A Material-style button with `filled`, `outlined`, and `text` variants.
Renders as an `<a>` instead of a `<button>` when `href` is set, so the app
router (which intercepts same-origin anchor clicks) can navigate without any
extra wiring.

## Usage

```html
<brew-button variant="filled">Save ratio</brew-button>
<brew-button variant="outlined" full-width>Reset</brew-button>
<brew-button variant="filled" href="/calculate">Go to Calculator</brew-button>
<brew-button variant="outlined" tone="danger">Delete all data</brew-button>
```

## Properties

| Property    | Attribute    | Type                               | Default    | Description                                      |
| ----------- | ------------ | ---------------------------------- | ---------- | ------------------------------------------------ |
| `variant`   | `variant`    | `"filled" \| "outlined" \| "text"` | `"filled"` | Visual style of the button.                      |
| `tone`      | `tone`       | `"brand" \| "danger"`              | `"brand"`  | `"danger"` swaps in the error color scheme.      |
| `disabled`  | `disabled`   | `Boolean`                          | `false`    | Disables the button (ignored when `href` is set) |
| `fullWidth` | `full-width` | `Boolean`                          | `false`    | Stretches the button to 100% width.              |
| `href`      | `href`       | `String`                           | `""`       | When set, renders as a navigable `<a>`.          |

## Events

| Event          | Type          | Description                                                   |
| -------------- | ------------- | ------------------------------------------------------------- |
| `button-click` | `CustomEvent` | Fired on activation, only when not disabled and no `href` set |

## Slots

| Name | Description         |
| ---- | ------------------- |
|      | The button's label. |
