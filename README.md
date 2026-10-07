# LlamaSOL slides

Reveal.js presentations for the LlamaSOL project. The current deck reviews
[SOL-ExecBench](https://arxiv.org/abs/2603.19173) and explores extending its ideas
to end-to-end inference in llama.cpp.

Styled with Josh Dzielak's [Robot Lung theme](https://revealjs-themes.dzello.com/robot-lung),
using local Roboto fonts, pink accents, and no decorative frame.
Research PDFs and original working notes remain outside this repository.

## Publish and update

GitHub Actions builds the deck and deploys `dist/` to GitHub Pages on every push
to `main`. Pull requests run the build without publishing. In the repository's
**Settings → Pages**, the publishing source must be **GitHub Actions**.

Edit the slides, preview locally, then commit and push:

```sh
git add slides/
git commit -m "Update presentation"
git push
```

Add new sections to the current deck as the project develops. For separate future
decks, add distinct HTML entry points and configure Vite's multi-page build;
keep this deck's URL stable for existing links.

Only `dist/` is deployed. Slide content, speaker notes, and bundled assets are
part of the published presentation.

## Run

Requires Node.js 22.12+ (Node 24 LTS recommended) and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:5173. Edits reload automatically.

## Author

- `slides/deck.md`: slide content. A line containing `---` starts a new slide,
  and `--` starts a vertical slide.
- `slides/theme.css`: typography and presentation styling.
- `slides/themes/robot-lung.css`: vendored upstream theme, with remote font imports
  replaced by local Fontsource packages. Its MIT license is in
  `slides/public/licenses/robot-lung.txt`. The optional decorative frame is omitted.
- `slides/main.js`: Reveal configuration and plugins. Canvas: 1280 × 720 (16:9).
- `slides/public/assets/`: figures and images, referenced as `assets/filename.png`.

Use `Notes:` on its own line to start speaker notes. Put source references in the
notes of the relevant slide. Use fenced code blocks for syntax highlighting,
`$...$` for inline math, and `$$...$$` for display math. HTML can be embedded in
Markdown for custom layouts. Keep LaTeX equations on their own lines when practical.
For Reveal fragment syntax, see the [Markdown documentation](https://revealjs.com/markdown/).

Obsidian wiki links, callouts, and Excalidraw embeds in the source notes need conversion
when incorporated into slides. The referenced Excalidraw drawing is not included here.

## Present and export

- Arrow keys / Space: navigate. Esc: overview. F: fullscreen. S: speaker view.
- Right / Left switches main sections. Down / Up navigates vertical slides
  within a section and reveals fragments. Space advances through the deck.
- Ctrl+Shift+F: search. ?: keyboard shortcuts.
- Open http://localhost:5173/?print-pdf in Chrome/Chromium, then print to PDF with
  landscape orientation, no margins, background graphics enabled, and browser
  headers/footers disabled. Inspect the preview before saving.
- `npm run build` creates a standalone static site in `dist/`.
- `npm run preview` serves that build locally, normally at http://localhost:4173.

Reveal.js, code highlighting, KaTeX, and fonts are bundled locally so the built
presentation does not require CDN access. Serve `dist/` over HTTP rather than
opening its HTML with `file://`. Keep paths relative when adding assets so the
deck works when hosted under a subdirectory.

Dependencies are pinned in `package.json` and `package-lock.json`.

The SOL Score section includes an interactive SVG plot, implemented in
`slides/sol-score.js`. Drag the runtime slider or use its presets to move the
candidate along the curve and the 0–1 score scale. It uses the paper's Figure 5
example (SOL = 50, baseline = 100) and requires no external plotting service.
Printed output preserves the current graph state and hides the slider buttons.
