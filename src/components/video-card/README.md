# brew-video-card

A "lite" YouTube embed used on the brew guide detail screens. It renders
only the poster image up front and swaps in the real iframe when the user
activates it, so YouTube's player scripts and cookies never load unless
someone actually wants to watch. The embed uses `youtube-nocookie.com`, and
a "Watch on YouTube" link is always available as a fallback.

## Usage

```html
<brew-video-card
  youtube-id="ikt-X5x7yoc"
  video-title="The Chemex"
  channel="James Hoffmann"
></brew-video-card>
```

## Properties

| Property     | Attribute     | Type     | Default | Description                                                             |
| ------------ | ------------- | -------- | ------- | ----------------------------------------------------------------------- |
| `youtubeId`  | `youtube-id`  | `String` | `""`    | The YouTube video ID (the part after `youtu.be/`).                      |
| `videoTitle` | `video-title` | `String` | `""`    | Video title. Named `videoTitle` to avoid shadowing `HTMLElement.title`. |
| `channel`    | `channel`     | `String` | `""`    | Creator name shown beneath the title.                                   |
