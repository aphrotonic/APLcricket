# CricketIQ AI Web Application - Implementation Plan

We will build **CricketIQ AI**, a premium, interactive web application that visualizes a 5-agent cricket intelligence pipeline (Planner → Data Retrieval → Analytics → Prediction → Gemma Explanation). The app will allow users to query preloaded match data (like the legendary India vs Pakistan T20 World Cup 2022 match) and watch the five agents process the query in real-time, displaying beautiful visualizations of win probability, momentum, and matchups.

## Design & Experience Goals
1. **Rich Aesthetics**: A dark-themed, premium interface utilizing glassmorphism (`backdrop-filter`), glowing neon accents (cyan, emerald, and purple), custom fonts, and smooth micro-animations.
2. **Interactive Visualizations**: 
   - A dynamic **Win Probability Curve** and **Momentum Chart** using HTML5 Canvas or SVG.
   - An interactive **Matchup matrix** and **Phase breakdown** panel.
3. **Pipeline Animation**: Visual step-by-step agent execution flow with progress rings, typing effects, and active state highlights for each agent as it "thinks."
4. **Zero-Configuration Execution**: Fully self-contained in Vanilla JS/CSS/HTML for instant loading and zero build errors.

---

## Proposed Changes

We will create the following files in the project workspace `c:\Users\Aditya\Documents\vscode\google event`:

### [NEW] [index.html](file:///c:/Users/Aditya/Documents/vscode/google%20event/index.html)
- Main application shell.
- Header with branding and match selector.
- Main dashboard divided into two columns:
  - **Left Column**: Live chat interface, prompt suggestions, and the **5-Agent Pipeline Visualizer** (displaying real-time execution states).
  - **Right Column**: Interactive Match Intelligence Center showing match metadata, phase-wise runs/wickets, player stats, and interactive charts.
- Accessible heading hierarchy, semantic HTML5 elements, and unique test IDs.

### [NEW] [index.css](file:///c:/Users/Aditya/Documents/vscode/google%20event/index.css)
- Custom CSS design system with variables for colors (`--bg-primary`, `--bg-card`, `--accent-cyan`, `--accent-emerald`, `--accent-purple`, `--text-main`, etc.).
- Responsive grid and flex layouts.
- Glassmorphic card styling (`background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.08);`).
- Smooth animations for pipeline steps (pulsing glow, typing cursor, fade-in transitions).
- Scrollbar styles and custom charts styling.

### [NEW] [app.js](file:///c:/Users/Aditya/Documents/vscode/google%20event/app.js)
- Match data store (preloaded structured JSON for India vs Pakistan T20 WC 2022, including full ball-by-ball details, player metrics, and win probability series).
- Execution pipeline logic:
  - **Planner Agent**: Decomposes the user query into a custom execution plan.
  - **Data Retrieval Agent**: Filters and retrieves structured JSON sub-elements.
  - **Analytics Agent**: Computes phase statistics, momentum shifts, and bowler matchups.
  - **Prediction Agent**: Calculates the highest-leverage counterfactual delta and projects next-match weaknesses.
  - **Explanation Agent**: Formulates a sharp, cricket-literate final response.
- State machine driving the UI transitions and animations during query execution.
- SVG/Canvas rendering functions for the interactive charts.

### [NEW] [matchData.js](file:///c:/Users/Aditya/Documents/vscode/google%20event/matchData.js)
- Contains detailed, structured JSON match data following the specified data contract:
  - `match_id`, `teams`, `venue`, `format`, `innings[]`, `deliveries[]`, and `player_stats[]`.
  - Realistic win probability and momentum values for each delivery to drive the charts.

---

## Verification Plan

### Manual Verification
1. Open `index.html` in a web browser using a local static file server.
2. Select a preloaded match (e.g., India vs Pakistan 2022).
3. Test suggested queries (e.g., "Why did Pakistan lose?", "Why did Babar underperform?", "What if Kohli got out in the 19th over?").
4. Verify that the 5-agent pipeline executes sequentially with animations and that the right-side dashboard displays updated, correct analytics, charts, and predictions.
5. Check responsiveness on mobile and desktop viewports.
