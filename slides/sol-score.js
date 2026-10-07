// SVG keeps the explanatory graph crisp in the browser and in PDF exports.
export function solScore(runtime, baseline, sol) {
  if (![runtime, baseline, sol].every(Number.isFinite) || baseline <= sol || runtime < sol) {
    throw new RangeError('SOL scoring requires finite runtimes, baseline > SOL, and candidate >= SOL.');
  }
  const headroom = baseline - sol;
  return headroom / (runtime - sol + headroom);
}

export function initializeScoreChart(root = document) {
  const container = root.querySelector('#sol-score-chart');
  if (!container) return;
  const baseline = 100;
  const sol = 50;
  const x = runtime => 90 + (runtime - 50) / 350 * 1140;
  const y = score => 288 - score * 258;
  const curve = Array.from({ length: 351 }, (_, i) => {
    const runtime = 50 + i;
    return `${i === 0 ? 'M' : 'L'}${x(runtime).toFixed(2)},${y(solScore(runtime, baseline, sol)).toFixed(2)}`;
  }).join(' ');
  const yTicks = [0, .25, .5, .75, 1].map(value => `
    <line x1="90" y1="${y(value)}" x2="1230" y2="${y(value)}" stroke="#d9dfdf"/>
    <text x="72" y="${y(value) + 7}" text-anchor="end">${value}</text>`).join('');
  const xTicks = [50, 100, 150, 200, 250, 300, 350, 400].map(value => `
    <line x1="${x(value)}" y1="288" x2="${x(value)}" y2="294" stroke="#555"/>
    <text x="${x(value)}" y="316" text-anchor="middle">${value}</text>`).join('');
  container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 354" role="img" aria-labelledby="sol-chart-title sol-chart-desc">
    <title id="sol-chart-title">SOL Score versus candidate runtime</title>
    <desc id="sol-chart-desc">With SOL runtime 50 and baseline 100, the score is 50 divided by runtime. It is 1 at SOL, 0.5 at baseline, and approaches zero as runtime increases.</desc>
    <g font-family="Arial, sans-serif" font-size="21" fill="#333">
      <rect x="90" y="30" width="1140" height="129" fill="#edf7f4"/>
      <rect x="90" y="159" width="1140" height="129" fill="#fff4e3"/>
      ${yTicks}${xTicks}
      <line x1="90" y1="30" x2="90" y2="288" stroke="#555" stroke-width="2"/>
      <line x1="90" y1="288" x2="1230" y2="288" stroke="#555" stroke-width="2"/>
      <line x1="${x(100)}" y1="30" x2="${x(100)}" y2="288" stroke="#007e72" stroke-dasharray="6 5"/>
      <line x1="90" y1="159" x2="1230" y2="159" stroke="#007e72" stroke-dasharray="6 5"/>
      <path d="${curve}" fill="none" stroke="#007e72" stroke-width="4"/>
      <circle cx="${x(50)}" cy="${y(1)}" r="6" fill="#007e72"/>
      <circle cx="${x(100)}" cy="${y(.5)}" r="6" fill="#007e72"/>
      <text x="115" y="51" font-weight="bold">At SOL: S = 1</text>
      <text x="${x(100) + 17}" y="147" font-weight="bold">Baseline: S = 0.5</text>
      <text x="690" y="68" fill="#006557">0.5 &lt; S &lt; 1: faster than baseline</text>
      <text x="690" y="192" fill="#895200">0 &lt; S &lt; 0.5: slower than baseline</text>
      <text x="972" y="278" font-size="19">S approaches 0</text>
      <text x="660" y="348" text-anchor="middle">Candidate runtime T_K (common units)</text>
      <text transform="translate(24,160) rotate(-90)" text-anchor="middle">SOL Score S</text>
      <line id="score-candidate-line" x1="${x(100)}" y1="${y(.5)}" x2="${x(100)}" y2="288" stroke="#c62059" stroke-width="2" stroke-dasharray="4 4"/>
      <circle id="score-candidate-point" cx="${x(100)}" cy="${y(.5)}" r="8" fill="#c62059" stroke="white" stroke-width="2"/>
    </g>
  </svg>`;
  const slider = root.querySelector('#candidate-runtime');
  const update = runtime => {
    const score = solScore(runtime, baseline, sol);
    slider.value = String(runtime);
    root.querySelector('#candidate-runtime-output').textContent = String(runtime);
    root.querySelector('#candidate-score-output').textContent = `S = ${score.toFixed(3)}`;
    const status = runtime === sol ? 'Reaches the SOL bound' : runtime === baseline ? 'Matches the baseline' : runtime < baseline ? 'Faster than baseline, with headroom remaining' : 'Slower than the baseline';
    root.querySelector('#candidate-score-description').textContent = status;
    const point = root.querySelector('#score-candidate-point');
    point.setAttribute('cx', x(runtime));
    point.setAttribute('cy', y(score));
    const line = root.querySelector('#score-candidate-line');
    line.setAttribute('x1', x(runtime));
    line.setAttribute('x2', x(runtime));
    line.setAttribute('y1', y(score));
    root.querySelector('#score-scale-marker').style.left = `${score * 100}%`;
    slider.setAttribute('aria-valuetext', `${runtime} runtime units, SOL score ${score.toFixed(3)}. ${status}.`);
  };
  slider.addEventListener('input', () => update(Number(slider.value)));
  slider.addEventListener('keydown', event => {
    // Keep native range adjustment, but release focus before Reveal handles
    // navigation (Reveal ignores all shortcuts while an input is focused).
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.stopPropagation();
    } else if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Escape', 'n', 'p'].includes(event.key)) {
      slider.blur();
      event.preventDefault();
    }
  });
  root.querySelectorAll('[data-score-runtime]').forEach(button => {
    button.addEventListener('click', () => update(Number(button.dataset.scoreRuntime)));
    button.addEventListener('keydown', event => {
      // Space/Enter activate the preset. Arrow keys remain slide navigation.
      if (event.key === ' ' || event.key === 'Enter') event.stopPropagation();
    });
  });
  update(100);
}
