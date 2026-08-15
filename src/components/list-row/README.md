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

<!-- with a Material Symbols icon circle (name as a plain attribute) -->
<brew-list-row
  headline="Settings"
  supporting="Brew types, dark mode, refresh, data"
  leading-icon="settings"
  href="/more/settings"
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

| Property              | Attribute               | Type                          | Default                                    | Description                                                                                                                                                                                                               |
| --------------------- | ----------------------- | ----------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `headline`            | `headline`              | `String`                      | `""`                                       | Primary row text.                                                                                                                                                                                                         |
| `supporting`          | `supporting`            | `String`                      | `""`                                       | Optional secondary line.                                                                                                                                                                                                  |
| `leadingIcon`         | `leading-icon`          | `String \| SVGTemplateResult` | `""`                                       | Icon circle content: a Material Symbols name (`leading-icon="timer"`) or a custom SVG icon set as a property (`.leadingIcon="${EXPLORE_ICON_SVG}"`).                                                                      |
| `leadingInitial`      | `leading-initial`       | `String`                      | `""`                                       | Single character for an avatar (takes priority over `leadingIcon`).                                                                                                                                                       |
| `leadingBg`           | `leading-bg`            | `String`                      | `var(--brew-color-secondary-container)`    | Background color for the leading element.                                                                                                                                                                                 |
| `leadingFg`           | `leading-fg`            | `String`                      | `var(--brew-color-on-secondary-container)` | Foreground color for the leading element.                                                                                                                                                                                 |
| `href`                | `href`                  | `String`                      | `""`                                       | Navigation target.                                                                                                                                                                                                        |
| `rating`              | `rating`                | `Number`                      | `0`                                        | Optional 1-5 star rating; renders a compact read-only indicator below the supporting text when > 0.                                                                                                                       |
| `replayable`          | `replayable`            | `Boolean`                     | `false`                                    | Shows a trailing "replay" quick action (before the chevron) for "Brew again"; fires `replay-click` instead of navigating.                                                                                                 |
| `trailingActionIcon`  | -                       | `SVGTemplateResult \| null`   | `null`                                     | A custom trailing quick action icon (before the chevron, set as a property) for rows with no navigation target - fires `trailing-action-click` instead of navigating. Takes priority over `replayable` when both are set. |
| `trailingActionLabel` | `trailing-action-label` | `String`                      | `""`                                       | `aria-label` for the `trailingActionIcon` button.                                                                                                                                                                         |
| `hasRecipeSource`     | `has-recipe-source`     | `Boolean`                     | `false`                                    | Shows a small, subtle book icon badge next to the headline for a brew loaded from a curated recipe (`recipeSource` set) - icon-only, labeled "Loaded from a recipe" for accessibility.                                    |

## Events

| Event                   | Type          | Description                                                                                                               |
| ----------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `replay-click`          | `CustomEvent` | Fired when `replayable` is set and its trailing replay icon button is tapped. Row navigation is suppressed for this tap.  |
| `trailing-action-click` | `CustomEvent` | Fired when `trailingActionIcon` is set and its trailing icon button is tapped. Row navigation is suppressed for this tap. |

```html
<!-- with a distinct trailing action for a row with nowhere to navigate (e.g. a curated-recipe browse list) -->
<brew-list-row
  headline="Double"
  supporting="1:2 · 18g in · 28s"
  leading-initial="D"
  .trailingActionIcon="${LOCAL_CAFE_ICON_SVG}"
  trailing-action-label="Brew now"
  @trailing-action-click="${() => brewEspressoRecipeNow(style)}"
></brew-list-row>

<!-- with the recipe-source indicator (saved brews list, for a brew loaded from a curated recipe) -->
<brew-list-row
  headline="V60 · 1:16"
  supporting="30g coffee · 480g water · 16.2oz"
  leading-initial="V"
  href="/saved/1"
  ?has-recipe-source="${Boolean(brew.recipeSource)}"
></brew-list-row>
```
