/* All presentation dependencies and math fonts are local. */
document.querySelectorAll('.math[data-tex]').forEach((element) => {
  katex.render(element.dataset.tex, element, {
    throwOnError: true,
    displayMode: element.tagName !== 'SPAN',
    strict: 'warn',
    output: 'htmlAndMathml',
  });
});

const params = new URLSearchParams(location.search);
const deck = new Reveal({
  width: 1600,
  height: 900,
  margin: 0.025,
  minScale: 0.15,
  maxScale: 2,
  center: false,
  hash: true,
  history: true,
  controls: true,
  controlsTutorial: false,
  controlsLayout: 'edges',
  progress: true,
  slideNumber: 'c/t',
  showSlideNumber: 'all',
  transition: 'fade',
  transitionSpeed: 'fast',
  backgroundTransition: 'none',
  view: 'slide',
  pdfMaxPagesPerSlide: 1,
  pdfSeparateFragments: false,
  showNotes: params.has('notes') ? 'separate-page' : false,
  totalTime: 1620,
  plugins: [RevealNotes, RevealHighlight],
});
window.deck = deck;
deck.initialize().then(() => {
  document.documentElement.classList.add('deck-ready');
  const onSlide = () => {
    const slide = deck.getCurrentSlide();
    document.title = `SOLAR · ${slide.dataset.name}`;
  };
  deck.on('slidechanged', onSlide);
  onSlide();
});
