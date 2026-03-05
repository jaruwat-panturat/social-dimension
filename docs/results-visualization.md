# Results Visualization Specification

## Overview
After a session closes, facilitators can view results in two different formats:
1. **2D Matrix View** - Sociometric tables showing who selected whom
2. **Network Graph** - Visual representation of relationships

## Page 1: 2D Matrix View

### Purpose
Show detailed selection data in tabular format for each question.

### Structure

**One matrix per question:**

```
Question: "Who would you go to for advice?"

           | Alice | Bob | Carol | David | Emma
-----------|-------|-----|-------|-------|------
Alice      |   -   |  1  |   2   |   3   |  -
Bob        |   2   |  -  |   1   |   3   |  -
Carol      |   1   |  3  |   -   |   2   |  -
David      |   -   |  2  |   1   |   -   |  3
Emma       |   1   |  -  |   3   |   2   |  -
-----------|-------|-----|-------|-------|------
1st (×3)   |   2   |  1  |   2   |   0   |  0
2nd (×2)   |   1   |  1  |   1   |   2   |  0
3rd (×1)   |   0   |  1  |   1   |   2   |  1
-----------|-------|-----|-------|-------|------
TOTAL PTS  |   8   |  6  |   9   |   6   |  1
```

**Legend:**
- Rows: Who answered (selector)
- Columns: Who was selected
- Cell values: Ranking (1 = 1st choice, 2 = 2nd choice, 3 = 3rd choice)
- `-` = Not selected
- Diagonal: Self (cannot select themselves)

**Summary Rows:**
- **1st (×3)**: Count of 1st place selections (each worth 3 points)
- **2nd (×2)**: Count of 2nd place selections (each worth 2 points)
- **3rd (×1)**: Count of 3rd place selections (each worth 1 point)
- **TOTAL PTS**: Weighted sum = (1st × 3) + (2nd × 2) + (3rd × 1)

**Example Calculation (Alice column):**
- Carol selected Alice as 1st (row Carol shows "1" in Alice column)
- Emma selected Alice as 1st (row Emma shows "1" in Alice column)
- Bob selected Alice as 2nd (row Bob shows "2" in Alice column)
- Count: 2 × 1st choice = 2 × 3 = 6 points
- Count: 1 × 2nd choice = 1 × 2 = 2 points
- Count: 0 × 3rd choice = 0 × 1 = 0 points
- **Total: 8 points**

### Visual Design
- Color coding in cells:
  - 1st choices (3pts): Dark green/gold
  - 2nd choices (2pts): Medium blue
  - 3rd choices (1pt): Light gray
  - Not selected: White/empty
- Summary rows highlighted with background color
- **TOTAL PTS row** prominently displayed (bold, larger font)
- Sortable by total points (highest first)
- Responsive on mobile (scrollable table)

### Data Display
- Show all questions in tabs or accordion
- Switch between questions easily
- Option to view all questions at once (scrollable)

## Page 2: Network Graph

### Purpose
Visualize social relationships as a network diagram showing connections between all participants.

### Structure

**Graph Elements:**

1. **Nodes (Participants)**
   - Circles/dots representing each participant
   - Size: Based on how many times they were selected (larger = more popular)
   - Label: Participant name
   - Color: Could indicate different metrics (centrality, role, etc.)

2. **Edges (Connections)**
   - Lines/arrows from selector to selected
   - Direction: Arrow points to selected person
   - **Line Style by Ranking:**
     - **1st choice (3 pts)**: Bold/thick solid line
     - **2nd choice (2 pts)**: Thin solid line
     - **3rd choice (1 pt)**: Dashed line
   - Color: Could vary by category or be uniform

3. **Layout**
   - Force-directed graph (nodes repel, connections attract)
   - Central nodes: Most selected people gravitate to center
   - Peripheral nodes: Less selected people on edges

### Interaction (if interactive)
- Click node: Highlight that person's connections
- Hover: Show selection details
- Zoom/pan: For large groups
- Filter: Show specific questions only
- Layout options: Force-directed, circular, hierarchical

### Aggregation Options
- **All questions combined**: Show total relationship strength across all questions
- **Per question**: Filter to show one question at a time
- **Point weighting**: 1st choice = 3 points, 2nd = 2 points, 3rd = 1 point (consistent with matrix scoring)

### Visual Design
```
Example visualization:

         Emma (1)
            ┆ (dashed - 3rd choice)
            ┆
    Alice (8) ══► Bob (6)    (bold - 1st choice)
       ▲  ─►      │
       │    ─►    │ (thin - 2nd choice)
       │      ─►  ▼
    David (6) ◄══ Carol (9)  (bold - 1st choice)

Legend:
══► Bold solid line = 1st choice (3 points)
─► Thin solid line = 2nd choice (2 points)
┆► Dashed line = 3rd choice (1 point)
Numbers in () = total points received
```

### Implementation Options

**Option A: Static SVG**
- Pre-rendered on backend
- Fast loading
- No interaction
- Export-friendly

**Option B: Canvas-based (D3.js, Vis.js)**
- Interactive
- Smooth animations
- Performance considerations for large groups

**Option C: WebGL (Sigma.js, Cytoscape.js)**
- Best for large networks (50+ participants)
- Highly interactive
- Complex implementation

**Recommendation for MVP:** Option B with D3.js or Recharts/Vis.js

## Navigation Between Views

```
Results Dashboard
├── Overview (summary stats)
├── Matrix View (Page 1)
│   ├── Question 1 Matrix
│   ├── Question 2 Matrix
│   └── ... all questions
└── Graph View (Page 2)
    ├── Combined graph (all questions)
    └── Per-question graphs (optional)
```

## Data Requirements

### For Matrix View
```javascript
{
  questionId: "uuid",
  questionText: "Who would you go to for advice?",
  participants: ["Alice", "Bob", "Carol", ...],
  selections: [
    {
      from: "Alice",
      to: ["Bob", "Carol", "David"], // ordered by rank
      ranks: [1, 2, 3]
    },
    // ... more selections
  ],
  summary: {
    "Alice": {
      firstCount: 2,   // selected as 1st choice 2 times
      secondCount: 1,  // selected as 2nd choice 1 time
      thirdCount: 0,   // selected as 3rd choice 0 times
      totalPoints: 8   // (2×3) + (1×2) + (0×1) = 8
    },
    "Bob": {
      firstCount: 1,
      secondCount: 1,
      thirdCount: 1,
      totalPoints: 6   // (1×3) + (1×2) + (1×1) = 6
    },
    "Carol": {
      firstCount: 2,
      secondCount: 1,
      thirdCount: 1,
      totalPoints: 9   // (2×3) + (1×2) + (1×1) = 9
    },
    // ... more participants
  }
}
```

### For Graph View
```javascript
{
  nodes: [
    { id: "alice", name: "Alice", totalSelections: 4 },
    { id: "bob", name: "Bob", totalSelections: 6 },
    // ...
  ],
  edges: [
    {
      from: "alice",
      to: "bob",
      weight: 3,      // 1st choice = 3 points
      rank: 1,        // 1 = bold line, 2 = thin line, 3 = dashed line
      lineStyle: "bold",  // "bold" | "thin" | "dashed"
      questionId: "uuid"
    },
    {
      from: "alice",
      to: "carol",
      weight: 2,
      rank: 2,
      lineStyle: "thin",
      questionId: "uuid"
    },
    {
      from: "alice",
      to: "david",
      weight: 1,
      rank: 3,
      lineStyle: "dashed",
      questionId: "uuid"
    },
    // ...
  ]
}
```

## Performance Considerations

- 10 participants = 10x10 matrix = manageable
- 50 participants = 50x50 matrix = challenging on mobile
- Consider pagination or zoom for large groups
- Generate graph on backend for large datasets
- Cache results after session closes (immutable)

## Accessibility

- Matrix: Keyboard navigation, screen reader friendly table
- Graph: Text-based alternative view for screen readers
- Color: Not the only indicator (use patterns/shapes too)
- Contrast: WCAG AA compliance
