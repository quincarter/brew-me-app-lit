# brew-product-link-card

A tappable card row for a paid/affiliate product recommendation on a brew
guide's detail screen - e.g. gear worth buying. Visually similar to
`brew-link-card`, but always renders an "Affiliate link" badge next to the
title and defaults to a shopping icon, since these are monetized links and
must be clearly distinguished from editorial "further reading" links.
Always renders as an `<a>` that opens in a new tab with
`rel="noopener noreferrer"`.

## Usage

```html
<brew-product-link-card
  href="https://amzn.to/example"
  label="Nitro Cold Brew Kegs — Royal Brew"
  description="A home nitro cold brew kegging system"
></brew-product-link-card>
```

## Properties

| Property      | Attribute     | Type     | Default          | Description                                 |
| ------------- | ------------- | -------- | ---------------- | -------------------------------------------- |
| `href`        | `href`        | `String` | `""`              | The product link's URL.                     |
| `label`       | `label`       | `String` | `""`              | Product/title text.                         |
| `description` | `description` | `String` | `""`              | Supporting text under the title.            |
| `icon`        | `icon`        | `String` | `"shopping_bag"`  | Material Symbols name for the leading icon. |
