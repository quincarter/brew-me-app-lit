# brew-bottom-nav

The persistent 3-tab bottom navigation (Calculate / Saved / More) shown on
every BrewMe screen, matching the source design's repeated nav block. Each
tab is a plain `<a>` so the app router's global click handling navigates
without any extra wiring.

## Usage

```html
<brew-bottom-nav active="calculate"></brew-bottom-nav>
```

Leave `active` empty (or omit it) on screens that aren't one of the three
tabs, e.g. Home - the design shows the bar with nothing highlighted there.

## Properties

| Property | Attribute | Type                                     | Default | Description                     |
| -------- | --------- | ---------------------------------------- | ------- | ------------------------------- |
| `active` | `active`  | `"calculate" \| "saved" \| "more" \| ""` | `""`    | Which tab shows the active pill |
