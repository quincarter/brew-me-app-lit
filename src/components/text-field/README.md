# brew-text-field

An outlined, labeled text input modeled after Material 3 text fields. Used
throughout the Calculator and Saved Ratio Detail screens.

## Usage

```html
<brew-text-field
  label="Water (g)"
  type="number"
  .value="${water}"
  @value-change="${(e) => setWater(e.detail)}"
></brew-text-field>
```

## Properties

| Property     | Attribute     | Type                 | Default  | Description                              |
| ------------ | ------------- | -------------------- | -------- | ---------------------------------------- |
| `label`      | `label`       | `String`             | `""`     | Field label shown above the input.       |
| `type`       | `type`        | `"text" \| "number"` | `"text"` | Native input type.                       |
| `value`      | `value`       | `String`             | `""`     | Current field value.                     |
| `prefixText` | `prefix-text` | `String`             | `""`     | Optional leading text, e.g. `$` or `1:`. |
| `suffixText` | `suffix-text` | `String`             | `""`     | Optional trailing text, e.g. `:1`.       |
| `name`       | `name`        | `String`             | `""`     | Native input name.                       |

## Events

| Event          | Type                  | Description                        |
| -------------- | --------------------- | ---------------------------------- |
| `value-change` | `CustomEvent<string>` | Fired on input with the new value. |
