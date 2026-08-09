# brew-switch

A Material-style on/off toggle track for boolean settings, e.g. the
dark-mode row on the Settings screen.

## Usage

```html
<brew-switch
  ?checked="${isDark}"
  aria-label="Dark mode"
  @change="${(e) => setDarkTheme(e.detail)}"
></brew-switch>
```

## Properties

| Property        | Attribute    | Type      | Default | Description                      |
| --------------- | ------------ | --------- | ------- | -------------------------------- |
| `checked`       | `checked`    | `Boolean` | `false` | Current on/off state.            |
| `ariaLabelText` | `aria-label` | `String`  | `""`    | Accessible label for the toggle. |

## Events

| Event    | Type                   | Description                                     |
| -------- | ---------------------- | ----------------------------------------------- |
| `change` | `CustomEvent<boolean>` | Fired with the new checked state on activation. |
