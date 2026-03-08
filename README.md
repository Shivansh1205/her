# How I Fell For You 💖

A romantic, choose-your-own-adventure interactive website built with vanilla HTML, CSS, and JavaScript.

## Quick Start

1. Open `index.html` in any modern browser — that's it!

> **Note:** The story works fully offline. Since browsers block `fetch()` on `file://`, the story data is also embedded inside `script.js` as a fallback.

## Project Structure

```
her/
├── index.html    ← open this in your browser
├── styles.css    ← all styling & animations
├── script.js     ← game engine & effects
├── story.json    ← editable story data
├── music.mp3     ← (optional) background music
└── README.md     ← you are here
```

## Customizing the Story

Edit **`story.json`** to change any text, add scenes, or alter the branching:

```json
{
  "scenes": {
    "scene1": {
      "text": "Your custom opening line here.",
      "typewriter": true,
      "buttons": [
        { "label": "Choice A", "nextScene": "scene2" },
        { "label": "Choice B", "nextScene": "otherScene" }
      ]
    }
  }
}
```

### Scene properties

| Property      | Type     | Description                                      |
|---------------|----------|--------------------------------------------------|
| `text`        | string   | Main dialogue text                                |
| `typewriter`  | boolean  | Enable typewriter animation                       |
| `revealText`  | string   | Secondary text typed after the main text          |
| `type`        | string   | `"finale"` or `"celebration"` for special scenes  |
| `lines`       | string[] | Array of lines revealed one-by-one (finale only)  |
| `proposal`    | string   | Proposal message shown after lines (finale only)  |
| `buttons`     | array    | Choices: `{ "label": "...", "nextScene": "..." }` |

> **Important:** If you edit `story.json`, also update the embedded fallback inside `script.js` → `getEmbeddedStory()` so the story works when opened via `file://`.

## Adding Background Music

Drop an MP3 file named **`music.mp3`** into the project folder. Click the 🎵 button in the bottom-right corner to play/pause.

## Features

- ✅ Typewriter text animation
- ✅ Smooth fade transitions between scenes
- ✅ Floating hearts background
- ✅ Confetti + hearts celebration on final screen
- ✅ Background music toggle
- ✅ Mobile responsive
- ✅ Editable story via JSON
- ✅ Works offline — no server needed
