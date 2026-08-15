# brew-list-row

A tappable row with a leading avatar or icon, a headline, optional
supporting text, and a trailing chevron. Renders as an `<a>` so the app
router can intercept navigation.

## Usage

```html
<!-- with an initial avatar (saved brews list) -->
<brew-list-row
  headline="V60 · 1:16"
  supporting="30g coffee · 480g water · 16.2oz"
  leading-initial="V"
  href="/saved/1"
></brew-list-row>

<!-- with an icon circle (brewing tools list) -->
<brew-list-row
  headline="Pour-over Timer"
  supporting="Guided brew countdown"
  .leading-icon="${TIMER_ICON_SVG}"
  href="/timer"
></brew-list-row>

<!-- with a custom SVG icon circle (set as a property, not an attribute) -->
<brew-list-row
  headline="Take the tour"
  supporting="Replay the BrewMe walkthrough"
  .leadingIcon="${EXPLORE_ICON_SVG}"
  href="/more"
></brew-list-row>
```

## Properties

| Property         | Attribute         | Type                          | Default                                    | Description                                                                                                                                          |
| ---------------- | ----------------- | ----------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `headline`       | `headline`        | `String`                      | `""`                                       | Primary row text.                                                                                                                                    |
| `supporting`     | `supporting`      | `String`                      | `""`                                       | Optional secondary line.                                                                                                                             |
| `leadingIcon`    | `leading-icon`    | `String \| SVGTemplateResult` | `""`                                       | Icon circle content: a Material Symbols name (`leading-icon="timer"`) or a custom SVG icon set as a property (`.leadingIcon="${EXPLORE_ICON_SVG}"`). |
| `leadingInitial` | `leading-initial` | `String`                      | `""`                                       | Single character for an avatar (takes priority over `leadingIcon`).                                                                                  |
| `leadingBg`      | `leading-bg`      | `String`                      | `var(--brew-color-secondary-container)`    | Background color for the leading element.                                                                                                            |
| `leadingFg`      | `leading-fg`      | `String`                      | `var(--brew-color-on-secondary-container)` | Foreground color for the leading element.                                                                                                            |
| `href`           | `href`            | `String`                      | `""`                                       | Navigation target.                                                                                                                                   |
| `rating`         | `rating`          | `Number`                      | `0`                                        | Optional 1-5 star rating; renders a compact read-only indicator below the supporting text when > 0.                                                  |
| `replayable`     | `replayable`      | `Boolean`                     | `false`                                    | Shows a trailing "replay" quick action (before the chevron) for "Brew again"; fires `replay-click` instead of navigating.                            |

## Events

| Event          | Type          | Description                                                                                                              |
| -------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `replay-click` | `CustomEvent` | Fired when `replayable` is set and its trailing replay icon button is tapped. Row navigation is suppressed for this tap. |
