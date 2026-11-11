# SOLAR — methodology slides

Open `index.html` in a browser to view the ten slides offline. All presentation dependencies and math fonts are included. Source links open the paper on arXiv.

For speaker view, serve this folder over HTTP:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Then visit http://localhost:8000.

Keys: **← / →** navigate, **Esc** overview, **S** speaker notes, **F** fullscreen, **B** blank screen.

For PDF export, use Chromium/Chrome at `http://localhost:8000/?print-pdf`, print in landscape with no margins and background graphics enabled. Add `&notes` for speaker notes on separate pages.

Edit `index.html` for slide content and notes, `theme.css` for appearance, and `deck.js` for presentation options. Designed for 1600 × 900 (16:9).

Based on Huang et al., *SOLAR: AI-Powered Speed-of-Light Performance Analysis*, arXiv:2606.26383v1. Diagrams are redrawn; the buffer illustration is conceptual. Figure 2 values and Figure 4b's contraction-order results are attributed to the paper. Calculations and qualifications are in speaker notes.
