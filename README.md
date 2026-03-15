# AlgoViz — Algorithm Visualizer

A modern, interactive web application for visualizing algorithms step by step.  
Built with pure **HTML**, **CSS**, and **Vanilla JavaScript** — no frameworks.

---

## Live Preview

Open `index.html` directly in any modern browser. No server or installation required.

---

## Features

- **4 algorithm categories** with a total of 9 algorithms
- **Node-based visualization** — every number is displayed as a circle (not a bar)
- **Step-by-step animation** with controllable speed
- **Stop / Continue / Restart** dialog during any running animation
- **Live statistics** — comparisons and steps counted in real time
- **Algorithm descriptions** shown for every selected algorithm
- **Responsive design** — works on desktop and mobile

---

## Algorithms

### Sorting
| Algorithm     | Time Complexity (avg) | Space  |
|---------------|----------------------|--------|
| Bubble Sort   | O(n²)                | O(1)   |
| Merge Sort    | O(n log n)           | O(n)   |
| Quick Sort    | O(n log n)           | O(log n)|

### Searching
| Algorithm      | Time Complexity | Requires sorted array |
|----------------|-----------------|-----------------------|
| Linear Search  | O(n)            | No                    |
| Binary Search  | O(log n)        | Yes (auto-sorted)     |

### Pathfinding (Grid 20 × 42)
| Algorithm  | Description                                      |
|------------|--------------------------------------------------|
| Dijkstra   | Guarantees the shortest path                     |
| A* Search  | Uses Manhattan heuristic — faster than Dijkstra  |

### Graph Traversal
| Algorithm | Strategy       | Data Structure |
|-----------|---------------|----------------|
| BFS       | Level by level | Queue (FIFO)   |
| DFS       | Deep first     | Stack (LIFO)   |

---

## Node Color States

| Color  | Meaning              |
|--------|----------------------|
| 🟡 Amber  | Currently comparing  |
| 🔴 Red    | Being swapped        |
| 🟢 Green  | Sorted / Start node  |
| 🩵 Teal   | Found (search)       |
| 🟣 Purple | Pivot (Quick Sort)   |
| 🔵 Blue   | Active (searching)   |
| ⬜ Gray   | Already checked      |

---

## User Interactions

### Array (Sorting & Search tabs)
- **Generate** — creates a random array of 8 elements
- **Add** — manually add a number (1–999)
- **Delete** — remove first occurrence of a number
- **Reset** — restores the default array

### Pathfinding Grid
- **Click / Drag** on cells to draw walls
- **Drag S** to move the start position
- **Drag E** to move the end position
- **Clear Walls** — removes all walls, keeps start/end
- **Reset Grid** — full grid reset

### Graph
- **Click a node** to set it as the start point
- **New Graph** — generates a new random graph

### Animation Controls
- **Start** — begins the selected algorithm
- **Stop** — pauses and opens the dialog:
  - ▶ **Continue** — resumes exactly where it stopped
  - 🔄 **From Start** — resets and restarts
  - **Cancel** — closes dialog, stays paused
- **Speed Slider** — controls delay from 50ms (fast) to 1500ms (slow)

---

## Project Structure

```
algoviz/
├── index.html    # Structure and layout (4 tabs, sidebar, dialog)
├── styles.css    # Dark theme, node states, grid, canvas styles
└── script.js     # All algorithm logic and animation
```

### Key Functions in `script.js`

```
generateArray()       — creates random array
renderNodes()         — renders all nodes with color states
updateNodeStates()    — updates individual node colors without re-render
bubbleSort()          — Bubble Sort with async/await animation
mergeSortStart()      — Merge Sort wrapper
quickSortStart()      — Quick Sort wrapper
linearSearch()        — Linear Search animation
binarySearch()        — Binary Search (auto-sorts first)
startPathfinding()    — runs Dijkstra or A* on the grid
runDijkstra()         — Dijkstra algorithm (synchronous, returns visit order)
runAstar()            — A* algorithm (synchronous, returns visit order)
startGraphTraversal() — runs BFS or DFS on the graph
graphBFS()            — Breadth-First Search with animation
graphDFS()            — Depth-First Search with animation
generateGraph()       — creates random connected graph
drawGraph()           — renders graph on canvas
animDelay()           — sleep helper that respects pause/resume
switchTab()           — switches between the 4 tabs
```

---

## Technologies Used

- **HTML5** — semantic structure
- **CSS3** — custom properties, animations, grid layout, keyframes
- **Vanilla JavaScript (ES2020)** — async/await, Promises, Canvas API
- **Google Fonts** — Outfit (UI) + DM Mono (numbers/code)

---

## How to Run

1. Download or clone the project
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari)
3. No build step, no dependencies, no server needed

```bash
# Optional: serve locally with Python
python -m http.server 8080
# Then open http://localhost:8080
```

---

## Author

**Mohammed Amassi**  
Computer Science Student — FH Technikum Wien  
GitHub: [github.com/AmassiMohammed](https://github.com/AmassiMohammed)

---

## License

This project was created for educational and portfolio purposes.  
Feel free to use, modify, and share it.