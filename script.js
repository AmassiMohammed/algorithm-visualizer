/* ═══════════════════════════════════════════════════════════
   AlgoViz — script.js  (v2)
   Tabs: Sortierung | Suche | Pathfinding | Graph
   ═══════════════════════════════════════════════════════════ */

// ── STATE ─────────────────────────────────────────────────────────
let array         = [];
let isRunning     = false;
let stopFlag      = false;
let currentTab    = 'sorting';
let currentSort   = 'bubble';
let currentSearch = 'linear';
let currentPath   = 'dijkstra';
let currentGraph  = 'bfs';
let comparisons   = 0;
let steps         = 0;

// Pause/Resume support
let pauseResolve  = null;   // called when user resumes
let isPaused      = false;

// Saved generator state for "Weitermachen"
let savedGenerator = null;

// ── DOM ───────────────────────────────────────────────────────────
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
const statComparisons = document.getElementById('statComparisons');
const statSteps       = document.getElementById('statSteps');
const statAlgo        = document.getElementById('statAlgo');
const descTitle       = document.getElementById('descTitle');
const descText        = document.getElementById('descText');
const statusDot       = document.getElementById('statusDot');
const statusMsg       = document.getElementById('statusMsg');
const stopDialog      = document.getElementById('stopDialog');
const dialogContinue  = document.getElementById('dialogContinue');
const dialogRestart   = document.getElementById('dialogRestart');
const dialogCancel    = document.getElementById('dialogCancel');

// ── DESCRIPTIONS ──────────────────────────────────────────────────
const descriptions = {
  bubble:   { title: 'Bubble Sort',       text: 'Bubble Sort vergleicht benachbarte Elemente und tauscht sie, wenn sie in der falschen Reihenfolge sind. Dieser Vorgang wiederholt sich, bis alles sortiert ist. O(n²) im Durchschnitt.' },
  merge:    { title: 'Merge Sort',         text: 'Merge Sort teilt das Array rekursiv in Hälften, bis nur einzelne Elemente übrig sind. Dann werden die Teile sortiert zusammengeführt. Sehr effizient: O(n log n) immer.' },
  quick:    { title: 'Quick Sort',         text: 'Quick Sort wählt ein Pivot-Element und ordnet kleinere Werte links, größere rechts davon. Dann wird rekursiv auf beide Seiten angewendet. O(n log n) im Durchschnitt.' },
  linear:   { title: 'Lineare Suche',      text: 'Geht jeden Knoten von links nach rechts durch und vergleicht ihn mit dem Zielwert. Einfach aber O(n) — funktioniert auch auf unsortierten Arrays.' },
  binary:   { title: 'Binäre Suche',       text: 'Nur auf sortierten Arrays. Vergleicht den Zielwert mit der Mitte und halbiert den Bereich jedes Mal. Sehr effizient: O(log n) — bei 1000 Elementen nur ~10 Schritte!' },
  dijkstra: { title: 'Dijkstra',           text: 'Dijkstra findet den kürzesten Pfad vom Start zu allen anderen Zellen. Er wählt immer die Zelle mit der kleinsten bekannten Distanz aus der Warteschlange. Garantiert den kürzesten Weg.' },
  astar:    { title: 'A* Search',          text: 'A* kombiniert Dijkstra mit einer Heuristik (Manhattan-Distanz zum Ziel). Dadurch sucht er zielgerichteter und ist oft schneller als reines Dijkstra.' },
  bfs:      { title: 'BFS — Breitensuche', text: 'Breadth-First Search erkundet alle Nachbarn eines Knotens bevor es tiefer geht. Verwendet eine Queue (FIFO). Findet immer den kürzesten Pfad (ungewichtet). Gut für Level-by-Level Erkundung.' },
  dfs:      { title: 'DFS — Tiefensuche',  text: 'Depth-First Search geht so tief wie möglich in einen Pfad bevor es zurückgeht. Verwendet einen Stack (LIFO). Sehr speichereffizient, garantiert aber nicht den kürzesten Pfad.' },
};

// ── HELPERS ───────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));
const getDelay = () => parseInt(speedSlider.value);

function resetStats() {
  comparisons = 0; steps = 0;
  statComparisons.textContent = '0';
  statSteps.textContent = '0';
}
function updateStats() {
  statComparisons.textContent = comparisons;
  statSteps.textContent = steps;
}
function setStatus(msg, type = '') {
  statusMsg.textContent = msg;
  statusDot.className = 'status-dot ' + type;
}
function setUIRunning(running) {
  isRunning = running;
  btnStart.classList.toggle('hidden', running);
  btnStop.classList.toggle('hidden', !running);
  [btnGenerate, btnAdd, btnDelete, btnReset].forEach(b => { if (b) b.disabled = running; });
}

// ── STOP DIALOG ───────────────────────────────────────────────────
function showStopDialog() {
  stopDialog.classList.remove('hidden');
}
function hideStopDialog() {
  stopDialog.classList.add('hidden');
}

// "Weitermachen" — resume the paused async function
dialogContinue.addEventListener('click', () => {
  hideStopDialog();
  if (pauseResolve) {
    isPaused = false;
    stopFlag = false;
    setUIRunning(true);
    setStatus('Läuft…', 'running');
    pauseResolve();   // unblocks the await in the algorithm
    pauseResolve = null;
  }
});

// "Von Anfang" — restart from scratch
dialogRestart.addEventListener('click', () => {
  hideStopDialog();
  isPaused = false;
  pauseResolve = null;
  savedGenerator = null;
  if (currentTab === 'sorting' || currentTab === 'searching') {
    renderNodes();
    resetStats();
  } else if (currentTab === 'pathfinding') {
    buildGrid(false);
    renderGrid();
    resetStats();
  } else if (currentTab === 'graph') {
    resetGraphColors();
    drawGraph();
    resetStats();
  }
  setStatus('Zurückgesetzt. Drücke Starten.', '');
});

// "Abbrechen" — just close dialog, stay paused
dialogCancel.addEventListener('click', () => {
  hideStopDialog();
  // stay in paused state — user can press Start to continue or Stop again
});

// Stop button: pause execution and show dialog
btnStop.addEventListener('click', () => {
  if (!isRunning) return;
  isPaused = true;
  stopFlag = true;   // breaks out of the inner sleep loop
  setUIRunning(false);
  setStatus('Pausiert.', '');
  showStopDialog();
});

/** Called inside algorithms instead of plain sleep — respects pause */
async function animDelay() {
  await sleep(getDelay());
  // If paused, block until resumed or cancelled
  if (isPaused) {
    await new Promise(resolve => { pauseResolve = resolve; });
  }
}

// ── TAB SWITCHING ─────────────────────────────────────────────────
function switchTab(tab) {
  if (isRunning) return;
  currentTab = tab;

  // Nav
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));

  // Sidebar sections
  const show = id => document.getElementById(id)?.classList.remove('hidden');
  const hide = id => document.getElementById(id)?.classList.add('hidden');

  ['arraySection','sortSection','searchSection','pathSection','graphSection'].forEach(hide);
  ['vizAreaNodes','vizAreaPath','vizAreaGraph'].forEach(hide);

  // Legend groups
  document.querySelectorAll('.node-leg').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.path-leg').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.graph-leg').forEach(el => el.classList.add('hidden'));

  if (tab === 'sorting') {
    show('arraySection'); show('sortSection'); show('vizAreaNodes');
    document.querySelectorAll('.node-leg').forEach(el => el.classList.remove('hidden'));
  } else if (tab === 'searching') {
    show('arraySection'); show('searchSection'); show('vizAreaNodes');
    document.querySelectorAll('.node-leg').forEach(el => el.classList.remove('hidden'));
  } else if (tab === 'pathfinding') {
    show('pathSection'); show('vizAreaPath');
    document.querySelectorAll('.path-leg').forEach(el => el.classList.remove('hidden'));
    if (gridCells.length === 0) { buildGrid(); renderGrid(); }
  } else if (tab === 'graph') {
    show('graphSection'); show('vizAreaGraph');
    document.querySelectorAll('.graph-leg').forEach(el => el.classList.remove('hidden'));
    resizeCanvas();
    if (graphNodes.length === 0) generateGraph();
    drawGraph();
  }

  resetStats();
  stopFlag = false; isPaused = false; pauseResolve = null;
  updateDescription();
  setStatus('Bereit.');
}

function updateDescription() {
  const key  = currentTab === 'sorting' ? currentSort
             : currentTab === 'searching' ? currentSearch
             : currentTab === 'pathfinding' ? currentPath
             : currentGraph;
  const info = descriptions[key] || {};
  descTitle.textContent = info.title || '';
  descText.textContent  = info.text  || '';
  statAlgo.textContent  = info.title || '—';
}

// ── START BUTTON ──────────────────────────────────────────────────
async function startVisualization() {
  if (isRunning) return;

  // If paused (dialog was cancelled), resume
  if (isPaused && pauseResolve) {
    isPaused = false;
    stopFlag = false;
    setUIRunning(true);
    setStatus('Läuft…', 'running');
    pauseResolve();
    pauseResolve = null;
    return;
  }

  stopFlag = false; isPaused = false;
  resetStats();
  setUIRunning(true);
  setStatus('Läuft…', 'running');

  if (currentTab === 'sorting') {
    if (array.length === 0) { setStatus('Array ist leer!', 'error'); setUIRunning(false); return; }
    if      (currentSort === 'bubble') await bubbleSort();
    else if (currentSort === 'merge')  await mergeSortStart();
    else if (currentSort === 'quick')  await quickSortStart();
  } else if (currentTab === 'searching') {
    if (array.length === 0) { setStatus('Array ist leer!', 'error'); setUIRunning(false); return; }
    const target = parseInt(searchTarget.value);
    if (isNaN(target)) { setStatus('Bitte Zahl eingeben!', 'error'); setUIRunning(false); return; }
    if      (currentSearch === 'linear') await linearSearch(target);
    else if (currentSearch === 'binary') await binarySearch(target);
  } else if (currentTab === 'pathfinding') {
    await startPathfinding();
  } else if (currentTab === 'graph') {
    await startGraphTraversal();
  }

  if (!stopFlag && !isPaused) setUIRunning(false);
}

btnStart.addEventListener('click', startVisualization);

/* ═══════════════════════════════════════════════════════════
   ARRAY MANAGEMENT
   ═══════════════════════════════════════════════════════════ */
function generateArray() {
  if (isRunning) return;
  array = Array.from({ length: 8 }, () => Math.floor(Math.random() * 90) + 10);
  renderNodes(); resetStats(); setStatus('Zufälliges Array generiert.');
}
function renderNodes(states = {}) {
  nodesRow.innerHTML = '';
  array.forEach((val, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'node-wrap';
    wrap.style.animationDelay = (i * 0.04) + 's';
    if (states[i] === 'pivot') wrap.classList.add('has-pivot');
    const circle = document.createElement('div');
    circle.className = 'node' + (states[i] ? ' ' + states[i] : '');
    circle.textContent = val;
    circle.id = 'node-' + i;
    const idx = document.createElement('span');
    idx.className = 'node-index'; idx.textContent = i;
    wrap.appendChild(circle); wrap.appendChild(idx);
    nodesRow.appendChild(wrap);
  });
}
function updateNodeStates(states = {}) {
  document.querySelectorAll('.node').forEach((node, i) => {
    node.classList.remove('comparing','swapping','sorted','found','pivot','active','checked');
    if (states[i]) node.classList.add(states[i]);
    const wrap = node.parentElement;
    if (wrap) wrap.classList.toggle('has-pivot', states[i] === 'pivot');
  });
}
function addNumber() {
  const val = parseInt(inputAdd.value);
  if (isNaN(val) || val < 1 || val > 999) { setStatus('Zahl zwischen 1–999 eingeben.','error'); return; }
  if (array.length >= 16) { setStatus('Max. 16 Elemente erreicht.','error'); return; }
  array.push(val); inputAdd.value = ''; renderNodes(); resetStats(); setStatus(`${val} hinzugefügt.`);
}
function deleteNumber() {
  const val = parseInt(inputDelete.value);
  const idx = array.indexOf(val);
  if (idx === -1) { setStatus(`${val} nicht gefunden.`, 'error'); return; }
  array.splice(idx, 1); inputDelete.value = ''; renderNodes(); resetStats(); setStatus(`${val} gelöscht.`);
}
function resetArray() {
  if (isRunning) return;
  array = [64,34,25,12,22,11,90,47]; renderNodes(); resetStats(); setStatus('Array zurückgesetzt.');
}

btnGenerate.addEventListener('click', generateArray);
btnReset.addEventListener('click', resetArray);
btnAdd.addEventListener('click', addNumber);
inputAdd.addEventListener('keydown', e => { if (e.key === 'Enter') addNumber(); });
btnDelete.addEventListener('click', deleteNumber);
inputDelete.addEventListener('keydown', e => { if (e.key === 'Enter') deleteNumber(); });

/* ═══════════════════════════════════════════════════════════
   BUBBLE SORT
   ═══════════════════════════════════════════════════════════ */
async function bubbleSort() {
  const arr = [...array];
  const n = arr.length;
  const sortedSet = new Set();

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (stopFlag) return;
      comparisons++; steps++; updateStats();
      const s = {}; sortedSet.forEach(k => s[k]='sorted'); s[j]='comparing'; s[j+1]='comparing';
      updateNodeStates(s);
      setStatus(`Vergleiche [${j}]=${arr[j]}  ↔  [${j+1}]=${arr[j+1]}`);
      await animDelay(); if (stopFlag) return;

      if (arr[j] > arr[j+1]) {
        [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
        array = [...arr]; steps++; updateStats();
        const sw = {}; sortedSet.forEach(k => sw[k]='sorted'); sw[j]='swapping'; sw[j+1]='swapping';
        renderNodes(sw); setStatus(`Tausche ${arr[j+1]} ↔ ${arr[j]}`);
        await animDelay(); if (stopFlag) return;
      }
    }
    sortedSet.add(n-1-i);
    const s2 = {}; sortedSet.forEach(k => s2[k]='sorted'); updateNodeStates(s2);
  }
  sortedSet.add(0);
  const fin = {}; arr.forEach((_,i) => fin[i]='sorted'); updateNodeStates(fin);
  setStatus('✓ Vollständig sortiert!', 'done');
}

/* ═══════════════════════════════════════════════════════════
   MERGE SORT
   ═══════════════════════════════════════════════════════════ */
async function mergeSortStart() {
  const arr = [...array];
  await mergeSort(arr, 0, arr.length - 1);
  if (!stopFlag) {
    array = [...arr];
    const fin = {}; arr.forEach((_,i) => fin[i]='sorted'); renderNodes(fin);
    setStatus('✓ Vollständig sortiert!', 'done');
  }
}
async function mergeSort(arr, l, r) {
  if (l >= r || stopFlag) return;
  const m = Math.floor((l+r)/2);
  await mergeSort(arr, l, m);
  await mergeSort(arr, m+1, r);
  await merge(arr, l, m, r);
}
async function merge(arr, l, m, r) {
  if (stopFlag) return;
  const left = arr.slice(l, m+1), right = arr.slice(m+1, r+1);
  let i=0, j=0, k=l;
  while (i<left.length && j<right.length) {
    if (stopFlag) return;
    comparisons++; steps++; updateStats();
    updateNodeStates({ [l+i]:'comparing', [m+1+j]:'comparing' });
    setStatus(`Merge: Vergleiche ${left[i]} ↔ ${right[j]}`);
    await animDelay(); if (stopFlag) return;
    arr[k++] = left[i] <= right[j] ? left[i++] : right[j++];
    array = [...arr]; renderNodes({ [k-1]:'swapping' }); await sleep(getDelay()*.5);
  }
  while (i<left.length)  { if(stopFlag)return; arr[k++]=left[i++];  array=[...arr]; steps++; updateStats(); renderNodes({[k-1]:'comparing'}); await sleep(getDelay()*.3); }
  while (j<right.length) { if(stopFlag)return; arr[k++]=right[j++]; array=[...arr]; steps++; updateStats(); renderNodes({[k-1]:'comparing'}); await sleep(getDelay()*.3); }
}

/* ═══════════════════════════════════════════════════════════
   QUICK SORT
   ═══════════════════════════════════════════════════════════ */
async function quickSortStart() {
  const arr = [...array];
  await quickSort(arr, 0, arr.length-1);
  if (!stopFlag) {
    array=[...arr]; const fin={}; arr.forEach((_,i)=>fin[i]='sorted'); renderNodes(fin);
    setStatus('✓ Vollständig sortiert!', 'done');
  }
}
async function quickSort(arr, low, high) {
  if (low<high && !stopFlag) {
    const pi = await partition(arr, low, high);
    if (stopFlag) return;
    await quickSort(arr, low, pi-1);
    await quickSort(arr, pi+1, high);
  }
}
async function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low-1;
  updateNodeStates({[high]:'pivot'}); setStatus(`Pivot: ${pivot} (Index ${high})`);
  await animDelay();
  for (let j=low; j<high; j++) {
    if (stopFlag) return i+1;
    comparisons++; steps++; updateStats();
    updateNodeStates({[high]:'pivot',[j]:'comparing'}); setStatus(`Vergleiche ${arr[j]} mit Pivot ${pivot}`);
    await animDelay(); if (stopFlag) return i+1;
    if (arr[j]<pivot) {
      i++; [arr[i],arr[j]]=[arr[j],arr[i]]; array=[...arr]; steps++; updateStats();
      renderNodes({[high]:'pivot',[i]:'swapping',[j]:'swapping'}); setStatus(`Tausche ${arr[i]} ↔ ${arr[j]}`);
      await animDelay(); if (stopFlag) return i+1;
    }
  }
  [arr[i+1],arr[high]]=[arr[high],arr[i+1]]; array=[...arr]; steps++; updateStats();
  renderNodes({[i+1]:'sorted'}); setStatus(`Pivot ${pivot} → finale Position ${i+1}`);
  await animDelay();
  return i+1;
}

/* ═══════════════════════════════════════════════════════════
   LINEAR SEARCH
   ═══════════════════════════════════════════════════════════ */
async function linearSearch(target) {
  for (let i=0; i<array.length; i++) {
    if (stopFlag) return;
    comparisons++; steps++; updateStats();
    const s={}; for(let k=0;k<i;k++) s[k]='checked'; s[i]='active';
    updateNodeStates(s); setStatus(`Prüfe [${i}] = ${array[i]}`,'running');
    await animDelay(); if (stopFlag) return;
    if (array[i]===target) {
      const f={}; for(let k=0;k<i;k++) f[k]='checked'; f[i]='found';
      updateNodeStates(f); setStatus(`✓ ${target} gefunden an Index ${i}!`,'found-st'); return;
    }
  }
  const nf={}; array.forEach((_,i)=>nf[i]='checked'); updateNodeStates(nf);
  setStatus(`✗ ${target} nicht gefunden.`,'error');
}

/* ═══════════════════════════════════════════════════════════
   BINARY SEARCH
   ═══════════════════════════════════════════════════════════ */
async function binarySearch(target) {
  array.sort((a,b)=>a-b); renderNodes(); setStatus('Array sortiert. Suche…','running');
  await animDelay();
  let left=0, right=array.length-1;
  while (left<=right) {
    if (stopFlag) return;
    const mid=Math.floor((left+right)/2);
    comparisons++; steps++; updateStats();
    const s={};
    for(let k=0;k<left;k++) s[k]='checked';
    for(let k=right+1;k<array.length;k++) s[k]='checked';
    for(let k=left;k<=right;k++) s[k]='comparing';
    s[mid]='active'; updateNodeStates(s);
    setStatus(`Bereich [${left}..${right}], Mitte=${mid} (${array[mid]})`);
    await animDelay(); if (stopFlag) return;
    if (array[mid]===target) {
      const f={}; for(let k=0;k<left;k++) f[k]='checked'; for(let k=right+1;k<array.length;k++) f[k]='checked'; f[mid]='found';
      updateNodeStates(f); setStatus(`✓ ${target} gefunden an Index ${mid}!`,'found-st'); return;
    } else if (array[mid]<target) { left=mid+1; setStatus(`${array[mid]} < ${target} → rechts weiter`); }
    else { right=mid-1; setStatus(`${array[mid]} > ${target} → links weiter`); }
    await sleep(getDelay()*.5);
  }
  const nf={}; array.forEach((_,i)=>nf[i]='checked'); updateNodeStates(nf);
  setStatus(`✗ ${target} nicht gefunden.`,'error');
}

/* ═══════════════════════════════════════════════════════════
   PATHFINDING
   ═══════════════════════════════════════════════════════════ */
const ROWS=20, COLS=42;
let gridCells=[], isMouseDown=false, dragMode=null;
let startPos={r:10,c:4}, endPos={r:10,c:37};

const gridContainer = document.getElementById('gridContainer');

function buildGrid(keepWalls=false) {
  const oldWalls = keepWalls ? gridCells.map(r=>r.map(c=>c.wall)) : null;
  gridCells=[];
  for(let r=0;r<ROWS;r++) {
    gridCells[r]=[];
    for(let c=0;c<COLS;c++)
      gridCells[r][c]={ r,c, wall: oldWalls?oldWalls[r][c]:false,
        visited:false, path:false, dist:Infinity, prev:null, f:0,g:0,h:0 };
  }
}
function renderGrid() {
  gridContainer.style.gridTemplateColumns=`repeat(${COLS},24px)`;
  gridContainer.innerHTML='';
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) {
    const cell=document.createElement('div');
    cell.className='cell'; cell.dataset.r=r; cell.dataset.c=c;
    applyCellClass(cell,r,c);
    cell.addEventListener('mousedown', e=>onCellDown(e,r,c));
    cell.addEventListener('mouseenter', ()=>onCellEnter(r,c));
    cell.addEventListener('mouseup', ()=>isMouseDown=false);
    gridContainer.appendChild(cell);
  }
  document.addEventListener('mouseup',()=>{ isMouseDown=false; dragMode=null; });
}
function getCellEl(r,c) { return gridContainer.querySelector(`[data-r="${r}"][data-c="${c}"]`); }
function applyCellClass(el,r,c) {
  el.className='cell'; el.textContent='';
  if(r===startPos.r&&c===startPos.c){el.classList.add('start');el.textContent='S';return;}
  if(r===endPos.r  &&c===endPos.c)  {el.classList.add('end');  el.textContent='E';return;}
  if(gridCells[r][c].path)    el.classList.add('path');
  else if(gridCells[r][c].visited) el.classList.add('visited');
  else if(gridCells[r][c].wall)    el.classList.add('wall');
}
function onCellDown(e,r,c) {
  e.preventDefault(); isMouseDown=true;
  if(r===startPos.r&&c===startPos.c){dragMode='start';return;}
  if(r===endPos.r  &&c===endPos.c)  {dragMode='end';  return;}
  dragMode='wall'; gridCells[r][c].wall=!gridCells[r][c].wall;
  applyCellClass(getCellEl(r,c),r,c);
}
function onCellEnter(r,c) {
  if(!isMouseDown) return;
  if(dragMode==='start') {
    const old=getCellEl(startPos.r,startPos.c); startPos={r,c};
    applyCellClass(old,+old.dataset.r,+old.dataset.c); applyCellClass(getCellEl(r,c),r,c);
  } else if(dragMode==='end') {
    const old=getCellEl(endPos.r,endPos.c); endPos={r,c};
    applyCellClass(old,+old.dataset.r,+old.dataset.c); applyCellClass(getCellEl(r,c),r,c);
  } else if(dragMode==='wall') {
    if((r===startPos.r&&c===startPos.c)||(r===endPos.r&&c===endPos.c)) return;
    gridCells[r][c].wall=true; applyCellClass(getCellEl(r,c),r,c);
  }
}

async function startPathfinding() {
  // Reset visited/path
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) {
    gridCells[r][c].visited=false; gridCells[r][c].path=false;
    gridCells[r][c].dist=Infinity; gridCells[r][c].prev=null;
    gridCells[r][c].f=0; gridCells[r][c].g=0; gridCells[r][c].h=0;
    const el=getCellEl(r,c); if(el) applyCellClass(el,r,c);
  }
  setStatus('Suche Pfad…','running');

  let visitOrder=[], path=[];
  if(currentPath==='dijkstra') ({visitOrder,path}=runDijkstra());
  else                          ({visitOrder,path}=runAstar());

  // Animate visited cells
  for(let i=0;i<visitOrder.length;i++) {
    if(stopFlag) return;
    const {r,c}=visitOrder[i];
    if((r===startPos.r&&c===startPos.c)||(r===endPos.r&&c===endPos.c)) continue;
    gridCells[r][c].visited=true; applyCellClass(getCellEl(r,c),r,c);
    comparisons++; steps++; updateStats();
    await sleep(Math.max(10,getDelay()*.1));
  }
  if(path.length===0){setStatus('✗ Kein Pfad gefunden!','error'); return;}

  // Animate path
  for(const {r,c} of path) {
    if(stopFlag) return;
    if((r===startPos.r&&c===startPos.c)||(r===endPos.r&&c===endPos.c)) continue;
    gridCells[r][c].path=true; applyCellClass(getCellEl(r,c),r,c);
    await sleep(Math.max(20,getDelay()*.3));
  }
  setStatus(`✓ Pfad gefunden! Länge: ${path.length} Schritte.`,'done');
}

function getNeighbors(r,c) {
  return [[0,1],[1,0],[0,-1],[-1,0]].map(([dr,dc])=>({r:r+dr,c:c+dc}))
    .filter(({r,c})=>r>=0&&r<ROWS&&c>=0&&c<COLS&&!gridCells[r][c].wall);
}
function tracePath(node) {
  const path=[]; let cur=node;
  while(cur){path.unshift({r:cur.r,c:cur.c});cur=cur.prev;}
  return path;
}
function runDijkstra() {
  const start=gridCells[startPos.r][startPos.c]; start.dist=0;
  const unvisited=[];
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) unvisited.push(gridCells[r][c]);
  const visitOrder=[];
  while(unvisited.length){
    unvisited.sort((a,b)=>a.dist-b.dist);
    const cur=unvisited.shift();
    if(cur.dist===Infinity) break;
    cur.visited=true; visitOrder.push(cur);
    if(cur.r===endPos.r&&cur.c===endPos.c) return{visitOrder,path:tracePath(cur)};
    for(const nb of getNeighbors(cur.r,cur.c)){
      const n=gridCells[nb.r][nb.c];
      if(!n.visited&&cur.dist+1<n.dist){n.dist=cur.dist+1;n.prev=cur;}
    }
  }
  return{visitOrder,path:[]};
}
function heuristic(r1,c1,r2,c2){return Math.abs(r1-r2)+Math.abs(c1-c2);}
function runAstar() {
  const start=gridCells[startPos.r][startPos.c];
  const end  =gridCells[endPos.r][endPos.c];
  start.g=0; start.h=heuristic(start.r,start.c,end.r,end.c); start.f=start.h;
  const open=[start]; const closed=new Set(); const visitOrder=[];
  while(open.length){
    open.sort((a,b)=>a.f-b.f); const cur=open.shift();
    if(closed.has(cur)) continue; closed.add(cur); visitOrder.push(cur);
    if(cur.r===end.r&&cur.c===end.c) return{visitOrder,path:tracePath(cur)};
    for(const nb of getNeighbors(cur.r,cur.c)){
      const n=gridCells[nb.r][nb.c]; if(closed.has(n)) continue;
      const g=cur.g+1;
      if(g<n.g||n.g===0){n.g=g;n.h=heuristic(n.r,n.c,end.r,end.c);n.f=n.g+n.h;n.prev=cur;open.push(n);}
    }
  }
  return{visitOrder,path:[]};
}

document.getElementById('btnClearWalls').addEventListener('click',()=>{buildGrid(false);renderGrid();});
document.getElementById('btnPathReset').addEventListener('click',()=>{buildGrid(false);renderGrid();resetStats();setStatus('Grid zurückgesetzt.');});

/* ═══════════════════════════════════════════════════════════
   GRAPH TRAVERSAL
   ═══════════════════════════════════════════════════════════ */
const graphCanvas = document.getElementById('graphCanvas');
const ctx = graphCanvas.getContext('2d');
let graphNodes=[], graphEdges=[], graphStartNode=0;

function resizeCanvas() {
  const rect=graphCanvas.parentElement.getBoundingClientRect();
  graphCanvas.width =rect.width  || 700;
  graphCanvas.height=rect.height || 340;
}

function generateGraph() {
  resizeCanvas();
  const W=graphCanvas.width, H=graphCanvas.height;
  const count=12;
  graphNodes=[]; graphEdges=[];
  for(let i=0;i<count;i++){
    const angle=(i/count)*Math.PI*2;
    graphNodes.push({
      id:i, label:String.fromCharCode(65+i), state:'unvisited',
      x:W/2+Math.cos(angle)*(Math.min(W,H)*0.33)+(Math.random()-.5)*50,
      y:H/2+Math.sin(angle)*(Math.min(W,H)*0.28)+(Math.random()-.5)*40,
    });
  }
  // Spanning tree
  const inTree=new Set([0]);
  while(inTree.size<count){
    const a=[...inTree][Math.floor(Math.random()*inTree.size)];
    const b=Math.floor(Math.random()*count);
    if(!inTree.has(b)){graphEdges.push([a,b]);inTree.add(b);}
  }
  // Extra edges
  for(let k=0;k<9;k++){
    const a=Math.floor(Math.random()*count), b=Math.floor(Math.random()*count);
    if(a!==b&&!graphEdges.some(([x,y])=>(x===a&&y===b)||(x===b&&y===a))) graphEdges.push([a,b]);
  }
  graphStartNode=0; resetGraphColors(); graphNodes[0].state='start';
}

function resetGraphColors() {
  graphNodes.forEach((n,i)=>n.state=i===graphStartNode?'start':'unvisited');
}

function drawGraph() {
  if(!graphCanvas.width) return;
  ctx.clearRect(0,0,graphCanvas.width,graphCanvas.height);

  // Edges
  graphEdges.forEach(([a,b])=>{
    const na=graphNodes[a],nb=graphNodes[b];
    ctx.beginPath(); ctx.moveTo(na.x,na.y); ctx.lineTo(nb.x,nb.y);
    ctx.strokeStyle='#2a3348'; ctx.lineWidth=2; ctx.stroke();
  });

  // Nodes
  const colors={ unvisited:'#1e2535', start:'#10b981', visiting:'#3b82f6', visited:'#a855f7' };
  const textColors={ unvisited:'#7e8eac', start:'#0e1117', visiting:'#fff', visited:'#fff' };
  graphNodes.forEach(n=>{
    ctx.beginPath(); ctx.arc(n.x,n.y,22,0,Math.PI*2);
    ctx.fillStyle=colors[n.state]||colors.unvisited; ctx.fill();
    ctx.strokeStyle='#0e1117'; ctx.lineWidth=3; ctx.stroke();
    ctx.fillStyle=textColors[n.state]||textColors.unvisited;
    ctx.font='700 13px "DM Mono", monospace';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(n.label,n.x,n.y);
  });
}

graphCanvas.addEventListener('click', e=>{
  if(isRunning) return;
  const rect=graphCanvas.getBoundingClientRect();
  const mx=(e.clientX-rect.left)*(graphCanvas.width/rect.width);
  const my=(e.clientY-rect.top)*(graphCanvas.height/rect.height);
  graphNodes.forEach((n,i)=>{
    if(Math.hypot(n.x-mx,n.y-my)<24){
      graphStartNode=i; resetGraphColors(); n.state='start'; drawGraph();
    }
  });
});

async function startGraphTraversal() {
  resetGraphColors(); graphNodes[graphStartNode].state='start'; drawGraph();
  const adj=Array.from({length:graphNodes.length},()=>[]);
  graphEdges.forEach(([a,b])=>{adj[a].push(b);adj[b].push(a);});
  if(currentGraph==='bfs') await graphBFS(adj);
  else                     await graphDFS(adj);
  if(!stopFlag) setStatus('✓ Graph vollständig traversiert!','done');
}

async function graphBFS(adj) {
  const visited=new Set([graphStartNode]), queue=[graphStartNode];
  let count=0;
  while(queue.length&&!stopFlag){
    const u=queue.shift();
    graphNodes[u].state='visiting'; drawGraph();
    setStatus(`BFS: Besuche Knoten ${graphNodes[u].label} | Queue: [${queue.map(i=>graphNodes[i].label).join(',')}]`,'running');
    await animDelay(); if(stopFlag) return;
    graphNodes[u].state='visited'; steps++; comparisons++; count++; updateStats(); drawGraph();
    for(const v of adj[u]) { if(!visited.has(v)){visited.add(v);queue.push(v);} }
    await sleep(getDelay()*.3);
  }
}

async function graphDFS(adj) {
  const visited=new Set(), stack=[graphStartNode];
  let count=0;
  while(stack.length&&!stopFlag){
    const u=stack.pop();
    if(visited.has(u)) continue;
    visited.add(u);
    graphNodes[u].state='visiting'; drawGraph();
    setStatus(`DFS: Besuche Knoten ${graphNodes[u].label} | Stack: [${stack.map(i=>graphNodes[i].label).join(',')}]`,'running');
    await animDelay(); if(stopFlag) return;
    graphNodes[u].state='visited'; steps++; comparisons++; count++; updateStats(); drawGraph();
    for(const v of [...adj[u]].reverse()) { if(!visited.has(v)) stack.push(v); }
    await sleep(getDelay()*.3);
  }
}

document.getElementById('btnGraphGenerate').addEventListener('click',()=>{
  if(isRunning) return;
  generateGraph(); drawGraph(); resetStats(); setStatus('Neuer Graph generiert.');
});

/* ═══════════════════════════════════════════════════════════
   ALGO SELECTION EVENTS
   ═══════════════════════════════════════════════════════════ */
document.querySelectorAll('.algo-item[data-algo]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.algo-item[data-algo]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); currentSort=btn.dataset.algo;
    renderNodes(); resetStats(); updateDescription();
  });
});
document.querySelectorAll('.algo-item[data-search]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.algo-item[data-search]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); currentSearch=btn.dataset.search;
    renderNodes(); resetStats(); updateDescription();
  });
});
document.querySelectorAll('.algo-item[data-path]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.algo-item[data-path]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); currentPath=btn.dataset.path; updateDescription();
  });
});
document.querySelectorAll('.algo-item[data-graph]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.algo-item[data-graph]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); currentGraph=btn.dataset.graph;
    resetGraphColors(); drawGraph(); resetStats(); updateDescription();
  });
});

/* ═══════════════════════════════════════════════════════════
   TABS + SPEED
   ═══════════════════════════════════════════════════════════ */
document.querySelectorAll('.tab').forEach(btn=>{
  btn.addEventListener('click',()=>switchTab(btn.dataset.tab));
});
speedSlider.addEventListener('input',()=>{ speedLabel.textContent=speedSlider.value+'ms'; });

/* ═══════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════ */
function init() {
  array=[64,34,25,12,22,11,90,47]; renderNodes();
  updateDescription();
  setStatus('Bereit. Wähle einen Algorithmus und drücke Starten.');
}
init();