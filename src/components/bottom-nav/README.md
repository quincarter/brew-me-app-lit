# brew-bottom-nav

The persistent 4-tab bottom navigation (Home / Calculate / Saved / More)
shown on every BrewMe screen, matching the source design's repeated nav
block. Each tab is a plain `<a>` so the app router's global click handling
navigates without any extra wiring.

## Usage

```html
<brew-bottom-nav active="home"></brew-bottom-nav>
```

Leave `active` empty (or omit it) on screens that don't map to any of the
four tabs (e.g. a guide detail page) - the bar renders with nothing
highlighted there.

## Properties

| Property | Attribute | Type                                               | Default | Description                     |
| -------- | --------- | -------------------------------------------------- | ------- | ------------------------------- |
| `active` | `active`  | `"home" \| "calculate" \| "saved" \| "more" \| ""` | `""`    | Which tab shows the active pill |
