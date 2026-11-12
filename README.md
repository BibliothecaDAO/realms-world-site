## History of Lost Worlds proof

Run `pnpm install` and `pnpm exec playwright install chromium` once, then run:

```bash
pnpm proof:lore
```

The command starts the real Vite app on an available local port, opens the
chronicle from the Scroll archive, and checks chapter navigation, direct links,
keyboard access, illustration dialogs and focus restoration at desktop and
mobile widths, including narrow and short-screen hero layouts. The mobile run uses
reduced motion. Google Fonts requests are blocked to verify that the chronicle's
bundled brand fonts load independently. It saves chapter screenshots,
reading transcripts and a result file in `artifacts/lore-proof/`, then closes its
browser and server. Set `LORE_PROOF_DIR` to retain evidence in another directory.
The proof also checks every rendered word, with the world notes expanded, at
15 widths from 320 to 1920 pixels. `text-layout.json` records split words,
overflow and clipping; origins and chapter-index screenshots cover representative
mobile, tablet and desktop layouts. Dialog text is checked while each artwork is open.

Review the captured text and screenshots together for narrative continuity and
readability. The chronicle is static: it has no separate loading, empty or error
content states. Existing content tests run with `node --test tests/*.test.mjs`;
`pnpm build` checks the production build.

| Feature | How to reach it |
| --- | --- |
| Chronicle | `/scroll` → **A History of Lost Worlds**, or `/scroll/history-of-lost-worlds` |
| Origins and four ages | **Enter the chronicle**, then an age in the chapter index; direct links use `#story`, `#blitz`, `#frontier`, `#eternum` and `#dominion` |
| Full illustrations | Select a chapter illustration; close with **Close** or **Escape** |
| Allegory and world notes | **Allegory** and **The world** in the page navigation; expand the notes with a click or **Enter** |
| Sources | **Sources** in the page navigation |
| Keyboard reading | **Tab** to **Skip to the story**, then **Enter**; chapter links and dialogs restore focus |

## Contributing Your Game to Realms World

Welcome developers! We'd love to feature your game on the Realms World site. Follow this guide to add your game to our showcase.

### Prerequisites

- Your game should be built on or integrated with the Realms ecosystem
- Have all required assets ready (images, screenshots)
- Basic knowledge of Git and GitHub

### Step-by-Step Guide

#### 1. Fork and Clone the Repository

```bash
# Fork the repository on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/realms-world-site.git
cd realms-world-site
```

#### 2. Add Your Game Assets

Create a folder for your game in `public/games/` with your game's slug name:

```bash
mkdir -p public/games/your-game-name/screenshots
```

Add the following assets:

- `cover.png` or `cover.webp` - Your game's cover image (recommended: 16:9 aspect ratio)
- `screenshots/` folder - Add numbered screenshots (1.png, 2.png, etc.)

#### 3. Update the Games Data File

Edit `src/data/games.ts` to add your game information:

```typescript
{
  id: 14, // Use the next available ID
  slug: "your-game-slug", // URL-friendly name (lowercase, hyphens)
  title: "Your Game Title",
  image: "/games/your-game-slug/cover.png",
  backgroundImage: "/games/your-game-slug/cover.png",
  backgroundImages: [
    "/games/your-game-slug/screenshots/1.png",
    "/games/your-game-slug/screenshots/2.png",
    // Add more screenshots as needed
  ],
  genre: ["Genre1", "Genre2"], // e.g., ["Strategy", "PvP", "RPG"]
  description: "A compelling description of your game...",
  status: "development", // Options: "mainnet" | "testnet" | "development"
  isLive: true, // Is the game currently playable?
  studio: "Your Studio Name",

  // Optional fields:
  players: 1000, // Current player count
  tvl: 500000, // Total Value Locked in USD
  whitepaper: "https://your-whitepaper-url.com",
  video: "https://www.youtube.com/embed/VIDEO_ID", // YouTube embed URL

  links: {
    homepage: "https://your-game.com",
    discord: "https://discord.gg/your-invite",
    twitter: "https://twitter.com/your-handle",
    telegram: "https://t.me/your-channel",
    github: "https://github.com/your-repo"
  }
}
```

#### 4. Game Data Structure Reference

| Field              | Type                                    | Required | Description                            |
| ------------------ | --------------------------------------- | -------- | -------------------------------------- |
| `id`               | number                                  | Yes      | Unique identifier (use next available) |
| `slug`             | string                                  | Yes      | URL-friendly name for routing          |
| `title`            | string                                  | Yes      | Display name of your game              |
| `image`            | string                                  | Yes      | Path to cover image                    |
| `backgroundImage`  | string                                  | Yes      | Path to background image               |
| `backgroundImages` | string[]                                | No       | Array of screenshot paths              |
| `genre`            | string[]                                | No       | Array of genre tags                    |
| `description`      | string                                  | Yes      | Game description (2-3 sentences)       |
| `status`           | "mainnet" \| "testnet" \| "development" | Yes      | Current deployment status              |
| `isLive`           | boolean                                 | Yes      | Is the game playable?                  |
| `studio`           | string                                  | Yes      | Studio/developer name                  |
| `whitepaper`       | string                                  | No       | Link to documentation                  |
| `players`          | number                                  | No       | Active player count                    |
| `tvl`              | number                                  | No       | Total value locked (USD)               |
| `video`            | string                                  | No       | YouTube embed URL                      |
| `links`            | object                                  | No       | Social and web links                   |

#### 5. Image Guidelines

- **Cover Image**: 16:9 aspect ratio recommended, min 1200x675px
- **Screenshots**: Same aspect ratio for consistency
- **File Formats**: Use `.webp` for better compression or `.png` for transparency
- **File Size**: Keep images under 500KB each for optimal loading

#### 6. Test Locally

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Visit http://localhost:5173 to see your game
```

#### 7. Submit Your PR

1. Commit your changes:

```bash
git add .
git commit -m "Add [Your Game Name] to games showcase"
```

2. Push to your fork:

```bash
git push origin main
```

3. Create a Pull Request on GitHub with:
   - Clear title: "Add [Game Name] to showcase"
   - Description including:
     - Brief game overview
     - Link to live game (if available)
     - Any special requirements or notes

### PR Checklist

Before submitting, ensure:

- [ ] All images are properly sized and optimized
- [ ] Game data includes all required fields
- [ ] Links are working and correct
- [ ] Description is clear and compelling
- [ ] Status accurately reflects game state
- [ ] Code follows existing formatting

### Need Help?

- Join our [Discord](https://discord.gg/realmsworld) for support
- Check existing games in `src/data/games.ts` for examples
- Open an issue if you encounter problems

We're excited to showcase your game in the Realms ecosystem! 🎮

---
