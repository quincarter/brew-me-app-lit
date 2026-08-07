# brew-type-picker

A chip grid for choosing a brew type, with a built-in "+ Add brew type"
affordance for types that aren't in the stock list. Used by both the
post-creation Save sheet and the Saved Ratio Detail edit flow so adding a
custom type works identically in both places.

It's a *controlled* component: it doesn't own the brew-type list or persist
new types itself. The consumer passes in the full list to render (typically
`allBrewTypesSignal.value`, stock + custom, from `brew-types.store.ts`) and
reacts to `type-select`/`type-add` to update its own "selected" state and
persist new types via `addCustomBrewType`.

## Usage

```html
<brew-type-picker
  .types="${allBrewTypesSignal.value}"
  selected="${pending}"
  @type-select="${(e) => selectPendingBrewType(e.detail)}"
  @type-add="${(e) => {
    const added = addCustomBrewType(e.detail);
    if (added) selectPendingBrewType(added);
  }}"
></brew-type-picker>
```

## Properties

| Property   | Attribute  | Type       | Default | Description                              |
| ---------- | ---------- | ---------- | ------- | ------------------------------------------ |
| `types`    | -          | `string[]` | `[]`    | Full list of brew type chips to render.    |
| `selected` | `selected` | `String`   | `""`    | Name of the currently selected type.       |

## Events

| Event         | Type                  | Description                                              |
| ------------- | --------------------- | ----------------------------------------------------------- |
| `type-select` | `CustomEvent<string>` | Fired with the tapped type's name.                          |
| `type-add`    | `CustomEvent<string>` | Fired with the trimmed name once "Add" is confirmed.        |
