import Reveal from 'reveal.js';
import Markdown from 'reveal.js/plugin/markdown';
import Highlight from 'reveal.js/plugin/highlight';
import Notes from 'reveal.js/plugin/notes';
import Search from 'reveal.js/plugin/search';
import renderMathInElement from 'katex/contrib/auto-render';

import 'reveal.js/reveal.css';
import '@fontsource/roboto/latin-700.css';
import '@fontsource/roboto-slab/latin-300.css';
import '@fontsource/roboto-slab/latin-400.css';
import '@fontsource/roboto-slab/latin-700.css';
import './themes/robot-lung.css';
import 'reveal.js/plugin/highlight/monokai.css';
import 'katex/dist/katex.min.css';
import './theme.css';
import markdown from './deck.md?raw';
import { initializeScoreChart } from './sol-score.js';

// Reveal's Markdown plugin reads textContent, not the textarea's value.
document.querySelector('#slide-source').textContent = markdown;

const deck = new Reveal({
  width: 1280,
  height: 720,
  margin: 0.08,
  hash: true,
  slideNumber: 'c/t',
  transition: 'slide',
  controls: true,
  progress: true,
  center: true,
  pdfSeparateFragments: false,
  markdown: { animateLists: true },
  keyboard: {
    37: () => deck.left({ skipFragments: true }),
    39: () => deck.right({ skipFragments: true }),
  },
  plugins: [Markdown, Highlight, Notes, Search],
});

await deck.initialize();
initializeScoreChart();
deck.on('slidechanged', event => {
  // A control on a hidden slide must not keep swallowing keyboard shortcuts.
  const focused = document.activeElement;
  if (event.previousSlide?.contains(focused)) focused.blur();
});
renderMathInElement(deck.getSlidesElement(), {
  delimiters: [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false },
    { left: '\\[', right: '\\]', display: true },
    { left: '\\(', right: '\\)', display: false },
  ],
  throwOnError: false,
});
deck.layout();

// Markdown edits rebuild the deck while the URL hash preserves the current slide.
if (import.meta.hot) {
  import.meta.hot.accept('./deck.md?raw', () => window.location.reload());
}
