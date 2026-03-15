/* ═══════════════════════════════════════════════════════════
   AlgoViz — script.js
   Algorithmen: Bubble Sort, Merge Sort, Quick Sort,
                Lineare Suche, Binäre Suche
   ═══════════════════════════════════════════════════════════ */

// ── STATE ─────────────────────────────────────────────────────────
let array        = [];           // Das aktuelle Array
let isRunning    = false;        // Läuft gerade eine Animation?
let stopFlag     = false;        // Soll die Animation gestoppt werden?
let currentTab   = 'sorting';    // Aktiver Tab
let currentSort  = 'bubble';     // Ausgewählter Sortieralgorithmus
let currentSearch= 'linear';     // Ausgewählter Suchalgorithmus
let comparisons  = 0;            // Zähler: Vergleiche
let steps        = 0;            // Zähler: Schritte

// ── DOM REFERENCES ────────────────────────────────────────────────
const nodesRow        = document.getElementById('nodesRow');
const btnGenerate     = document.getElementById('btnGenerate');
const btnAdd          = document.getElementById('btnAdd');
const btnDelete       = document.getElementById('btnDelete');
const btnReset        = document.getElementById('btnReset');
const btnStart        = document.getElementById('btnStart');
const btnStop         = document.getElementById('btnStop');
const inputAdd        = document.getElementById('inputAdd');
const inputDelete     = document.getElementById('inputDelete');
const searchTarget    = document.getElementById('searchTarget');
const speedSlider     = document.getElementById('speedSlider');
const speedLabel      = document.getElementById('speedLabel');
const sortSection     = document.getElementById('sortSection');
const searchSection   = document.getElementById('searchSection');
const statComparisons = document.getElementById('statComparisons');
const statSteps       = document.getElementById('statSteps');
const statAlgo        = document.getElementById('statAlgo');
const descTitle       = document.getElementById('descTitle');
const descText        = document.getElementById('descText');
const statusDot       = document.getElementById('statusDot');
const statusMsg       = document.getElementById('statusMsg');

// ── ALGORITHM DESCRIPTIONS ────────────────────────────────────────
const descriptions = {
  bubble:  {
    title: 'Bubble Sort',
    text:  'Bubble Sort vergleicht benachbarte Elemente und tauscht sie, wenn sie in der falschen Reihenfolge sind. Dieser Vorgang wird wiederholt, bis das gesamte Array sortiert ist. Die größten Elemente "blubbern" wie Blasen nach oben.'
  },
  merge:   {
    title: 'Merge Sort',
    text:  'Merge Sort teilt das Array rekursiv in Hälften, bis nur noch einzelne Elemente übrig sind. Danach werden die Teile sortiert wieder zusammengeführt (gemergt). Sehr effizient mit O(n log n) – auch im schlechtesten Fall.'
  },
  quick:   {
    title: 'Quick Sort',
    text:  'Quick Sort wählt ein Pivot-Element und ordnet alle kleineren Werte links, alle größeren rechts davon an. Dann wird dasselbe rekursiv auf beide Seiten angewendet. Im Durchschnitt sehr schnell mit O(n log n).'
  },
  linear:  {
    title: 'Lineare Suche',
    text:  'Die Lineare Suche geht jeden Knoten von links nach rechts durch und vergleicht ihn mit dem Zielwert. Einfach aber langsam – im schlimmsten Fall müssen alle n Elemente geprüft werden. Funktioniert auf unsortierten Arrays.'
  },
  binary:  {
    title: 'Binäre Suche',
    text:  'Die Binäre Suche funktioniert nur auf sortierten Arrays. Sie vergleicht den Zielwert mit der Mitte des Suchbereichs und halbiert den Bereich jedes Mal. Sehr effizient mit O(log n) – bei 1000 Elementen nur ~10 Schritte!'
  }
};

// ── HELPERS ───────────────────────────────────────────────────────

/** Wartet ms Millisekunden (für Animationen) */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Gibt die aktuelle Verzögerung aus dem Slider zurück */
const getDelay = () => parseInt(speedSlider.value);

/** Setzt Vergleiche und Schritte zurück */
function resetStats() {
  comparisons = 0;
  steps       = 0;
  statComparisons.textContent = '0';
  statSteps.textContent       = '0';
}

/** Aktualisiert die Statistik-Anzeige */
function updateStats() {
  statComparisons.textContent = comparisons;
  statSteps.textContent       = steps;
}

/** Setzt den Status-Text und den farbigen Punkt */
function setStatus(msg, type = '') {
  statusMsg.textContent = msg;
  statusDot.className   = 'status-dot ' + type;
}

/** Aktiviert / deaktiviert die UI-Buttons während einer Animation */
function setUIRunning(running) {
  isRunning = running;
  btnStart.classList.toggle('hidden', running);
  btnStop.classList.toggle('hidden', !running);
  btnGenerate.disabled = running;
  btnAdd.disabled      = running;
  btnDelete.disabled   = running;
  btnReset.disabled    = running;
}

// ── ARRAY MANAGEMENT ──────────────────────────────────────────────

/**
 * Generiert ein zufälliges Array mit 8 Elementen (10–99)
 */
function generateArray() {
  stopExecution();
  array = Array.from({ length: 8 }, () => Math.floor(Math.random() * 90) + 10);
  renderNodes();
  resetStats();
  setStatus('Zufälliges Array generiert.');
}

/**
 * Rendert alle Knoten im Visualisierungsbereich
 * @param {Object} states - Map von index → CSS-Klasse (z.B. { 2: 'comparing', 5: 'sorted' })
 */
function renderNodes(states = {}) {
  nodesRow.innerHTML = '';

  array.forEach((val, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'node-wrap';
    wrap.style.animationDelay = (i * 0.04) + 's';

    // Pivot label
    if (states[i] === 'pivot') wrap.classList.add('has-pivot');

    const circle = document.createElement('div');
    circle.className = 'node';
    if (states[i]) circle.classList.add(states[i]);
    circle.textContent = val;
    circle.id = 'node-' + i;

    const indexLabel = document.createElement('span');
    indexLabel.className = 'node-index';
    indexLabel.textContent = i;

    wrap.appendChild(circle);
    wrap.appendChild(indexLabel);
    nodesRow.appendChild(wrap);
  });
}

/**
 * Aktualisiert den Zustand einzelner Knoten ohne komplett neu zu rendern
 * @param {Object} states - Map von index → CSS-Klasse
 */
function updateNodeStates(states = {}) {
  document.querySelectorAll('.node').forEach((node, i) => {
    // Alle State-Klassen entfernen
    node.classList.remove('comparing', 'swapping', 'sorted', 'found', 'pivot', 'active', 'checked');
    // Neue Klasse setzen
    if (states[i]) node.classList.add(states[i]);
    // Pivot-Label auf dem Wrapper
    const wrap = node.parentElement;
    if (wrap) wrap.classList.toggle('has-pivot', states[i] === 'pivot');
  });
}

/**
 * Fügt eine Zahl dem Array hinzu
 */
function addNumber() {
  const val = parseInt(inputAdd.value);
  if (isNaN(val) || val < 1 || val > 999) {
    setStatus('Bitte eine Zahl zwischen 1 und 999 eingeben.', 'error');
    return;
  }
  if (array.length >= 16) {
    setStatus('Maximale Array-Größe (16) erreicht.', 'error');
    return;
  }
  array.push(val);
  inputAdd.value = '';
  renderNodes();
  resetStats();
  setStatus(`${val} wurde hinzugefügt.`);
}

/**
 * Löscht eine Zahl aus dem Array (erstes Vorkommen)
 */
function deleteNumber() {
  const val = parseInt(inputDelete.value);
  if (isNaN(val)) {
    setStatus('Bitte eine Zahl eingeben.', 'error');
    return;
  }
  const idx = array.indexOf(val);
  if (idx === -1) {
    setStatus(`${val} wurde nicht gefunden.`, 'error');
    return;
  }
  array.splice(idx, 1);
  inputDelete.value = '';
  renderNodes();
  resetStats();
  setStatus(`${val} wurde gelöscht.`);
}

/**
 * Setzt das Array auf den Standardzustand zurück
 */
function resetArray() {
  stopExecution();
  array = [64, 34, 25, 12, 22, 11, 90, 47];
  renderNodes();
  resetStats();
  setStatus('Array zurückgesetzt.');
}

// ── STOP / TAB / ALGO SELECTION ───────────────────────────────────

/** Stoppt die laufende Animation */
function stopExecution() {
  stopFlag = true;
  setUIRunning(false);
  setStatus('Gestoppt.', '');
}

/** Wechselt zwischen Sortierung- und Suche-Tab */
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  sortSection.classList.toggle('hidden', tab !== 'sorting');
  searchSection.classList.toggle('hidden', tab !== 'searching');
  stopExecution();
  renderNodes();
  resetStats();
  updateDescription();
}

/** Aktualisiert die Algorithmenbeschreibung */
function updateDescription() {
  const key  = currentTab === 'sorting' ? currentSort : currentSearch;
  const info = descriptions[key];
  descTitle.textContent = info.title;
  descText.textContent  = info.text;
  statAlgo.textContent  = info.title;
}

// ── START ─────────────────────────────────────────────────────────

/** Startet den ausgewählten Algorithmus */
async function startVisualization() {
  if (array.length === 0) { setStatus('Das Array ist leer!', 'error'); return; }
  stopFlag = false;
  resetStats();
  setUIRunning(true);
  setStatus('Läuft…', 'running');

  if (currentTab === 'sorting') {
    if      (currentSort === 'bubble') await bubbleSort();
    else if (currentSort === 'merge')  await mergeSortStart();
    else if (currentSort === 'quick')  await quickSortStart();
  } else {
    const target = parseInt(searchTarget.value);
    if (isNaN(target)) { setStatus('Bitte eine Zahl eingeben!', 'error'); setUIRunning(false); return; }
    if (currentSearch === 'linear') await linearSearch(target);
    else                             await binarySearch(target);
  }

  if (!stopFlag) setUIRunning(false);
}

/* ═══════════════════════════════════════════════════════════
   BUBBLE SORT
   ═══════════════════════════════════════════════════════════ */
async function bubbleSort() {
  const arr = [...array];
  const n   = arr.length;
  const sortedIndices = new Set();

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (stopFlag) return;

      // ① Vergleich anzeigen
      comparisons++;
      steps++;
      updateStats();
      const stateCompare = {};
      sortedIndices.forEach(k => stateCompare[k] = 'sorted');
      stateCompare[j]   = 'comparing';
      stateCompare[j+1] = 'comparing';
      updateNodeStates(stateCompare);
      setStatus(`Vergleiche Index ${j} (${arr[j]}) mit Index ${j+1} (${arr[j+1]})`);
      await sleep(getDelay());
      if (stopFlag) return;

      // ② Tausch wenn nötig
      if (arr[j] > arr[j+1]) {
        [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
        array = [...arr];
        steps++;
        updateStats();
        const stateSwap = {};
        sortedIndices.forEach(k => stateSwap[k] = 'sorted');
        stateSwap[j]   = 'swapping';
        stateSwap[j+1] = 'swapping';
        renderNodes(stateSwap);
        setStatus(`Tausche ${arr[j+1]} ↔ ${arr[j]}`);
        await sleep(getDelay());
        if (stopFlag) return;
      }
    }

    // ③ Letztes Element dieser Runde ist an seiner Position
    sortedIndices.add(n - 1 - i);
    const stateDone = {};
    sortedIndices.forEach(k => stateDone[k] = 'sorted');
    updateNodeStates(stateDone);
  }

  // Alle sortiert
  sortedIndices.add(0);
  const finalState = {};
  arr.forEach((_, i) => finalState[i] = 'sorted');
  updateNodeStates(finalState);
  setStatus('✓ Array ist vollständig sortiert!', 'done');
}

/* ═══════════════════════════════════════════════════════════
   MERGE SORT
   ═══════════════════════════════════════════════════════════ */
async function mergeSortStart() {
  const arr = [...array];
  await mergeSort(arr, 0, arr.length - 1);
  if (!stopFlag) {
    array = [...arr];
    const finalState = {};
    arr.forEach((_, i) => finalState[i] = 'sorted');
    renderNodes(finalState);
    setStatus('✓ Array ist vollständig sortiert!', 'done');
  }
}

async function mergeSort(arr, l, r) {
  if (l >= r || stopFlag) return;
  const m = Math.floor((l + r) / 2);
  await mergeSort(arr, l, m);
  await mergeSort(arr, m + 1, r);
  await merge(arr, l, m, r);
}

async function merge(arr, l, m, r) {
  if (stopFlag) return;

  const left  = arr.slice(l, m + 1);
  const right = arr.slice(m + 1, r + 1);
  let i = 0, j = 0, k = l;

  while (i < left.length && j < right.length) {
    if (stopFlag) return;
    comparisons++;
    steps++;
    updateStats();

    // Vergleiche linkes und rechtes Element
    const state = {};
    state[l + i] = 'comparing';
    state[m + 1 + j] = 'comparing';
    updateNodeStates(state);
    setStatus(`Merge: Vergleiche ${left[i]} mit ${right[j]}`);
    await sleep(getDelay());
    if (stopFlag) return;

    if (left[i] <= right[j]) {
      arr[k++] = left[i++];
    } else {
      arr[k++] = right[j++];
    }
    array = [...arr];

    // Zeige getauschte Position
    const swapState = {};
    swapState[k - 1] = 'swapping';
    renderNodes(swapState);
    await sleep(getDelay() * .6);
  }

  while (i < left.length)  { if (stopFlag) return; arr[k++] = left[i++];  array = [...arr]; steps++; updateStats(); renderNodes({ [k-1]: 'comparing' }); await sleep(getDelay() * .4); }
  while (j < right.length) { if (stopFlag) return; arr[k++] = right[j++]; array = [...arr]; steps++; updateStats(); renderNodes({ [k-1]: 'comparing' }); await sleep(getDelay() * .4); }
}

/* ═══════════════════════════════════════════════════════════
   QUICK SORT
   ═══════════════════════════════════════════════════════════ */
async function quickSortStart() {
  const arr = [...array];
  await quickSort(arr, 0, arr.length - 1);
  if (!stopFlag) {
    array = [...arr];
    const finalState = {};
    arr.forEach((_, i) => finalState[i] = 'sorted');
    renderNodes(finalState);
    setStatus('✓ Array ist vollständig sortiert!', 'done');
  }
}

async function quickSort(arr, low, high) {
  if (low < high && !stopFlag) {
    const pi = await partition(arr, low, high);
    if (stopFlag) return;
    await quickSort(arr, low, pi - 1);
    await quickSort(arr, pi + 1, high);
  }
}

async function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;

  // Pivot hervorheben
  const pivotState = { [high]: 'pivot' };
  updateNodeStates(pivotState);
  setStatus(`Pivot: ${pivot} (Index ${high})`);
  await sleep(getDelay());

  for (let j = low; j < high; j++) {
    if (stopFlag) return i + 1;
    comparisons++;
    steps++;
    updateStats();

    // Vergleich mit Pivot
    const cState = { [high]: 'pivot', [j]: 'comparing' };
    updateNodeStates(cState);
    setStatus(`Vergleiche ${arr[j]} mit Pivot ${pivot}`);
    await sleep(getDelay());
    if (stopFlag) return i + 1;

    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      array = [...arr];
      steps++;
      updateStats();

      const sState = { [high]: 'pivot', [i]: 'swapping', [j]: 'swapping' };
      renderNodes(sState);
      setStatus(`Tausche ${arr[i]} ↔ ${arr[j]}`);
      await sleep(getDelay());
      if (stopFlag) return i + 1;
    }
  }

  // Pivot an seine finale Position
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  array = [...arr];
  steps++;
  updateStats();

  const doneState = {};
  doneState[i + 1] = 'sorted';
  renderNodes(doneState);
  setStatus(`Pivot ${pivot} ist jetzt an Position ${i + 1}`);
  await sleep(getDelay());

  return i + 1;
}

/* ═══════════════════════════════════════════════════════════
   LINEARE SUCHE
   ═══════════════════════════════════════════════════════════ */
async function linearSearch(target) {
  setStatus(`Suche nach ${target}…`, 'running');

  for (let i = 0; i < array.length; i++) {
    if (stopFlag) return;
    comparisons++;
    steps++;
    updateStats();

    // Aktuellen Knoten hervorheben
    const state = {};
    for (let k = 0; k < i; k++) state[k] = 'checked';
    state[i] = 'active';
    updateNodeStates(state);
    setStatus(`Prüfe Index ${i}: Wert = ${array[i]}`, 'running');
    await sleep(getDelay());
    if (stopFlag) return;

    if (array[i] === target) {
      const foundState = {};
      for (let k = 0; k < i; k++) foundState[k] = 'checked';
      foundState[i] = 'found';
      updateNodeStates(foundState);
      setStatus(`✓ ${target} gefunden an Index ${i}!`, 'found-st');
      return;
    }
  }

  // Nicht gefunden
  const nfState = {};
  array.forEach((_, i) => nfState[i] = 'checked');
  updateNodeStates(nfState);
  setStatus(`✗ ${target} wurde nicht gefunden.`, 'error');
}

/* ═══════════════════════════════════════════════════════════
   BINÄRE SUCHE
   ═══════════════════════════════════════════════════════════ */
async function binarySearch(target) {
  // Binäre Suche benötigt ein sortiertes Array
  const sortedArr = [...array].sort((a, b) => a - b);
  array = [...sortedArr];
  renderNodes();
  setStatus(`Array sortiert. Suche nach ${target}…`, 'running');
  await sleep(getDelay());

  let left  = 0;
  let right = array.length - 1;

  while (left <= right) {
    if (stopFlag) return;

    const mid = Math.floor((left + right) / 2);
    comparisons++;
    steps++;
    updateStats();

    // Bereich und Mitte anzeigen
    const state = {};
    for (let k = 0; k < left;         k++) state[k] = 'checked';
    for (let k = right + 1; k < array.length; k++) state[k] = 'checked';
    for (let k = left; k <= right; k++)   state[k] = 'comparing';
    state[mid] = 'active';
    updateNodeStates(state);
    setStatus(`Bereich [${left}..${right}], Mitte = Index ${mid} (${array[mid]})`);
    await sleep(getDelay());
    if (stopFlag) return;

    if (array[mid] === target) {
      const foundState = {};
      for (let k = 0; k < left;         k++) foundState[k] = 'checked';
      for (let k = right + 1; k < array.length; k++) foundState[k] = 'checked';
      foundState[mid] = 'found';
      updateNodeStates(foundState);
      setStatus(`✓ ${target} gefunden an Index ${mid}!`, 'found-st');
      return;
    } else if (array[mid] < target) {
      left = mid + 1;
      setStatus(`${array[mid]} < ${target} → Suche rechts weiter`);
    } else {
      right = mid - 1;
      setStatus(`${array[mid]} > ${target} → Suche links weiter`);
    }
    await sleep(getDelay() * .6);
  }

  // Nicht gefunden
  const nfState = {};
  array.forEach((_, i) => nfState[i] = 'checked');
  updateNodeStates(nfState);
  setStatus(`✗ ${target} wurde nicht gefunden.`, 'error');
}

// ── EVENT LISTENERS ───────────────────────────────────────────────

// Header Tabs
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Array Controls
btnGenerate.addEventListener('click', generateArray);
btnReset.addEventListener('click', resetArray);
btnAdd.addEventListener('click', addNumber);
inputAdd.addEventListener('keydown', e => { if (e.key === 'Enter') addNumber(); });
btnDelete.addEventListener('click', deleteNumber);
inputDelete.addEventListener('keydown', e => { if (e.key === 'Enter') deleteNumber(); });

// Sort Algo Selection
document.querySelectorAll('.algo-item[data-algo]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.algo-item[data-algo]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSort = btn.dataset.algo;
    stopExecution();
    renderNodes();
    resetStats();
    updateDescription();
  });
});

// Search Algo Selection
document.querySelectorAll('.algo-item[data-search]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.algo-item[data-search]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSearch = btn.dataset.search;
    stopExecution();
    renderNodes();
    resetStats();
    updateDescription();
  });
});

// Start / Stop
btnStart.addEventListener('click', startVisualization);
btnStop.addEventListener('click', stopExecution);

// Speed Slider
speedSlider.addEventListener('input', () => {
  speedLabel.textContent = speedSlider.value + 'ms';
});

// ── INIT ──────────────────────────────────────────────────────────

/** Initialisierung beim Laden der Seite */
function init() {
  array = [64, 34, 25, 12, 22, 11, 90, 47];
  renderNodes();
  updateDescription();
  setStatus('Bereit. Wähle einen Algorithmus und starte die Visualisierung.');
}

init();