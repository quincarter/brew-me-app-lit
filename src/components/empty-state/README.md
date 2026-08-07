# brew-empty-state

The shared "nothing here yet" card: the sleepy `tired-guy` illustration, a
cheeky one-line message, and an optional filled CTA button. Extracted so the
wording and imaging for "no data yet" screens stay identical instead of
drifting per-view - used on the home screen's recent ratios section and the
Saved Ratios list.

## Usage

```html
<!-- Defaults already match the home/saved copy - no props needed -->
<brew-empty-state></brew-empty-state>

<!-- Override for a different empty scenario -->
<brew-empty-state
  message="No timers run yet - start one to see it here."
  cta-label="Start a timer"
  cta-href="/timer"
></brew-empty-state>
```

## Properties

| Property   | Attribute    | Type     | Default                                                      | Description                                             |
| ---------- | ------------ | -------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| `image`    | `image`      | `String` | `"/tired-guy.png"`                                            | Illustration shown above the message.                    |
| `message`  | `message`    | `String` | `"No coffee brews yet! Head over to Calculate to add some!"`  | The cheeky empty-state copy.                              |
| `ctaLabel` | `cta-label`  | `String` | `"Calculate a brew"`                                           | CTA button label. Omit both CTA props to hide the button. |
| `ctaHref`  | `cta-href`   | `String` | `"/calculate"`                                                 | CTA button destination.                                   |
