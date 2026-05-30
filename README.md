# ⚛️ STEM WORKSHOP (Model 1956-V)
### *Tactile Atomic Computational Atelier — Solo Student Project*

```
     _______________________________________________________________
    |  [I]     [II]    [III]    [IV]     [V]     [VI]    [VII]  [VIII]  |
    | MATRIX  SOLVER   CHEM   PLOTTER  STATS   CIRCUIT   GEOM  FOURIER  |
    |~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|
    |  [IX]    [X]     [XI]    [XII]   [XIII]                       |
    | GRAPH   SOLAR    DOSE    LEAK   CARBON                        |
    |_______________________________________________________________|
                   ||  ATELIER VIEWPORT CABINET CHASSIS  ||
```

Welcome to the **STEM Workshop**, an individual solo student project meticulously designed to merge the classic visual craftsmanship of 1950s physical engineering offices, blueprint schematics, and wooden slide rules with high-precision client-side scientific computation.

This workspace houses **13 advanced computational apparatuses** consolidated inside a responsive memory-light **Atelier cabinet drawer chassis** which renders a single selected workbench at a fluid 60 frames per second. All math, synthesis, and physical evaluations are calculated completely locally on the client's browser, using local storage cache mechanics, keyless open-source APIs, and Web Audio synthesizers.

---

## 🎨 Visual Design System & Theme

The interface implements a premium, tactile draft-atelier aesthetic modeled after 1950s physics textbooks and patent submissions:
- **Ledger Blueprint Color Grid**: Curated HSL color palette featuring deep navy `#1D3557` (draftsman ink), soft cream `#FFFDF0` (ledger parchment paper), and sharp red `#E63946` (mechanical error flags).
- **Typewriter Typography**: Features structured monospaced fonts (Cutive Mono, Inconsolata) mimicking classic physical typewriters and computer terminal tape logs.
- **Double Borders & Stamped Tickets**: Visual cards feature double navy frames, dashed blueprints, notched diner-style tickets, and custom stamped certificates.
- **Custom Context Menu**: Right-clicking anywhere triggers an overlay menu styled as a physical diner ticket with calibration options.

---

## ⚙️ The 13 STEM Computational Apparatuses

### 1. Matrix & Linear Algebra Workbench (`matrix-lab`)
- **Physics/Math**: Solves linear systems of equations $Ax = b$, matrix multiplications, transposes, determinants, inverses, and eigenvalues.
- **Mechanics**: Implements Gaussian Elimination with detailed row-operation ledgers, and power method iteration for numerical eigenvalues.
- **Visuals**: Displays input cells inside retro solid navy brackets styled after physical brackets.

### 2. Scientific Equation Solver (`equation-solver`)
- **Physics/Math**: Performs multi-variable unit-aware calculations across physical formulas (Ideal Gas Law $PV = nRT$, Ohm's Law $V = IR$, Newtonian Kinematics $v^2 = u^2 + 2as$, Einstein's Mass-Energy $E = mc^2$, etc.).
- **Mechanics**: Solves dynamically for any selected isolated variable using algebraic inversion, automatically updating unit conversions.

### 3. Chemical Stoichiometry Balancer (`chem-balancer`)
- **Chemistry**: Balances complex chemical formulas (e.g., $C_6H_{12}O_6 + O_2 \rightarrow CO_2 + H_2O$) via atomic conservation systems.
- **Mechanics**: Solves a matrix of elemental conservation equations using algebraic null-space calculation and reduces coefficients to integer ratios.

### 4. Numerical Methods Playground (`numerical-playground`)
- **Calculus/Algorithms**: Visualizes numerical root-finding algorithms (Bisection Method, Newton-Raphson, Secant Method).
- **Mechanics**: Evaluates functions step-by-step with iterations, and plots the convergence path on an interactive Cartesian chart.

### 5. Statistical Data Explorer (`stats-explorer`)
- **Statistics**: Analyzes raw lists of numbers and paired datasets to calculate standard deviations, variances, medians, skewness, and linear regression equations.
- **Visuals**: Renders SVG Box-and-Whisker plots and regression line scatter plots.

### 6. Circuit Simulator & Boolean Algebra Compiler (`logic-gate-simulator`)
- **Digital Logic**: Build logic gate networks by connecting nodes with interactive wiring.
- **Components**: Up to 4 input toggle switches ($A, B, C, D$), 7 gates (AND, OR, NOT, NAND, NOR, XOR, XNOR), and LED status indicators.
- **Boolean Solver**: Enter expressions like `(A AND B) OR NOT C` to automatically compile a monospaced 16-row Truth Table or generate a matching logic circuit.

### 7. Geometry Lab & Euclidean Measurement Grid (`geometry-lab`)
- **Geometry**: Grid-snapped coordinate drafting canvas.
- **Mechanics**: Place points, lines, circles, and polygons to instantly compute Euclidean distances, Cartesian slopes, midpoints, polygon area (via the Shoelace formula), and line intersections.

### 8. Fourier Waveform Studio (`fourier-waveform-studio`)
- **Signal Processing**: Additive harmonic synthesizer combining terms of $A \cdot \sin(2\pi f t + \phi)$.
- **Mechanics**: Side-by-side plots of the resulting wave in the Time Domain and its FFT Frequency Spectrum.
- **Synthesizer**: Synthesizes custom waves using the Web Audio API with strict gain-limiting limits ($0.08$) to prevent speaker clipping on mobile. Includes presets for square, triangle, and sawtooth harmonics.

### 9. Graph Visualizer & Traversal Animator (`graph-algorithm-visualizer`)
- **Graph Theory**: Plot vertices and weighted edges on a coordinate grid.
- **Algorithms**: Animates step-by-step pathfindings for DFS, BFS, Dijkstra's Shortest Path, A* Search, and Kruskal's Minimum Spanning Tree (MST). Shows visited sets, open queues, and final path paths.

### 10. Solar ROI & Payback Calculator (`solar-roi-calculator`)
- **Green Technology**: Financial-energy solar system payoff model.
- **API Integration**: Translates addresses to latitudes/longitudes using the Nominatim OpenStreetMap API, then fetches average daily irradiance (kWh/m²) from the Open-Meteo API.
- **Math Model**: Implements a localized PVWatts physical model to calculate annual generation, CO2 offset, yearly utility savings, and 25-year financial ROI.

### 11. Pediatric Liquid Medication Dosing Assistant (`pediatric-dose-helper`)
- **Clinical Math**: Calculates precise liquid medication amounts (mL) based on child's weight (lbs/kg) and mg/kg concentrations.
- **Safety Flags**: Caps maximum single and 24-hour dosages using official pediatric clinical constraints (e.g., Ibuprofen capped at 400mg per dose). Includes measuring syringe recommendations and dosage timer logs.

### 12. Household Water Leak Cost Estimator (`leak-cost-calculator`)
- **Eco Utility**: Converts dripping faucet drip counts (drips/min) or pipe diameter drops into tangible utility metrics.
- **Equivalences**: Compares lost gallons to real-world analogies (e.g., "Wastes equal to 12 swimming pools" or "fills 800 standard baths"), and lists common leak fixes.

### 13. Carbon-Aware Travel Planner (`carbon-travel-planner`)
- **Decarbonization**: Side-by-side trip CO2 footprint comparison across aircraft, train, bus, and gasoline or electric cars.
- **API Integration**: Fetches real-time carbon intensity of electricity grids via the CO2Signal/ElectricityMap API to dynamically compute electric train emissions. Adjusts flights using the radiative forcing index ($\times 1.9$).

---

## 🛠️ Architecture & Space-Saving Design

To support 13 distinct interactive laboratories without causing memory leaks, canvas conflicts, or browser lagging:
1. **Atelier Switcher Chassis**: `App.tsx` maintains a single active state hook. Only the currently selected apparatus component is rendered in the DOM.
2. **Global Integration Switcher**: A global callback `window.changeSTEMApparatus(id)` is declared so that any link or CTA button on the landing pages, context menus, or footer immediately loads the module and scrolls smoothly down to the workspace viewport `#workshop-cabinet`.
3. **CORS & Keyless Operations**: Integrates fully open-source APIs (Nominatim, Open-Meteo) that do not require private authorization keys, ensuring 100% functionality straight out of the box.

---

## ⚙️ Development & Verification Commands

To launch the dev server:
```bash
npm run dev
```

To run complete static type safety verification:
```bash
npx tsc --noEmit
```

To compile a production bundle:
```bash
npm run build
```
