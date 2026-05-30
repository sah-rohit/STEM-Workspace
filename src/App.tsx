import { useState, useEffect } from 'react';
import './App.css';
import Navigation from './sections/Navigation';
import Hero from './sections/Hero';
import Footer from './sections/Footer';

// Existing 5 STEM modules
import MatrixLab from './sections/MatrixLab';
import EquationSolver from './sections/EquationSolver';
import ChemBalancer from './sections/ChemBalancer';
import NumericalPlayground from './sections/NumericalPlayground';
import StatExplorer from './sections/StatExplorer';

// New 8 STEM modules
import CircuitSimulator from './sections/CircuitSimulator';
import GeometryLab from './sections/GeometryLab';
import FourierWaveformStudio from './sections/FourierWaveformStudio';
import GraphVisualizer from './sections/GraphVisualizer';
import SolarROICalculator from './sections/SolarROICalculator';
import PediatricDoseHelper from './sections/PediatricDoseHelper';
import LeakCostCalculator from './sections/LeakCostCalculator';
import CarbonTravelPlanner from './sections/CarbonTravelPlanner';

import { Terminal, Shield, FileText, Gift, Award, AlertTriangle, Check, Info, X, Atom, Compass, Globe, Sun, Droplet, Shield as ShieldIcon } from 'lucide-react';

// Declare global typescript bindings for the atomic alert system
declare global {
  interface Window {
    showAtelierAlert: (title: string, message: string, type?: 'alert' | 'warning') => void;
    showAtelierConfirm: (title: string, message: string, onConfirm: () => void) => void;
    showAtelierToast: (message: string, type?: 'info' | 'success' | 'warning') => void;
    openStudentManifesto: (tab: 'about' | 'privacy' | 'terms' | 'pricing' | 'open-source') => void;
    changeSTEMApparatus: (id: string) => void;
    goSTEMHome: () => void;
  }
}

// 13 apparatus metadata mapping
const APPARATUS_LIST = [
  { 
    id: 'matrix-lab', 
    name: 'I. Matrix Workbench', 
    component: MatrixLab, 
    desc: 'Linear Algebra & System Solver',
    discipline: 'ALGEBRA & CALCULUS',
    icon: '⚙️',
    formula: 'Ax = b  ➔  Gauss-Jordan Elimination',
    features: [
      'Editable 2x2 to 4x4 matrix inputs grid',
      'Step-by-step row operation printing ledger',
      'Calculates Matrix Add, Multiply, Transpose, Determinant, and Inverses',
      'Numerical Eigenvalues solver via power iteration method',
      'Cache matrix state in local browser memory'
    ],
    longDesc: 'A complete linear algebra and vector space modeling workbench. Input coefficients directly to solve linear system matrices or calculate transposes and determinants with step-by-step operations.'
  },
  { 
    id: 'equation-solver', 
    name: 'II. Equation Solver', 
    component: EquationSolver, 
    desc: 'Unit-Aware Scientific Formula Solver',
    discipline: 'ALGEBRA & CALCULUS',
    icon: '⚡',
    formula: 'PV = nRT  |  V = IR  |  E = mc²',
    features: [
      '10+ pre-calibrated physics and engineering equations',
      'Solves dynamically for any selected unknown isolated variable',
      'Integrated unit conversion library (Metric / Imperial)',
      'Algebraic symbol checker with error red-flags',
      'Persistent coefficient state storage'
    ],
    longDesc: 'A physical formula solver designed to calculate thermodynamics, kinematics, mass-energy equivalency, and Ohm\'s electrical laws. Dynamically shifts variables to solve for any isolated symbol.'
  },
  { 
    id: 'chem-balancer', 
    name: 'III. Chem Balancer', 
    component: ChemBalancer, 
    desc: 'Chemical Stoichiometry Reactants Balancer',
    discipline: 'ALGEBRA & CALCULUS',
    icon: '🧪',
    formula: 'C₆H₁₂O₆ + 6O₂  ➔  6CO₂ + 6H₂O',
    features: [
      'Balanced equation calculator with step-by-step matrix fractions',
      'Matrix Null-Space stoichiometric solver algorithms',
      'Validates reactant and product atom density matrices',
      'Reduces stoichiometric ratios to minimal integer multipliers',
      'Supports complex compound formulations'
    ],
    longDesc: 'A chemical reaction balancer that models conservation of mass as a homogeneous linear system of chemical element coefficients, using fractional matrix nullspace solvers to balance atoms.'
  },
  { 
    id: 'numerical-playground', 
    name: 'IV. Numerical Plotter', 
    component: NumericalPlayground, 
    desc: 'Root Finder & Function Plotter',
    discipline: 'ALGEBRA & CALCULUS',
    icon: '📐',
    formula: 'x_{n+1} = x_n - f(x_n) / f\'(x_n)',
    features: [
      'Interactive functional parser with local root solver iterations',
      'Bisection Method, Newton-Raphson, and Secant convergence tracing',
      'Renders step-by-step numerical logs and derivative slopes',
      'Fluid interactive grid Cartesian SVG plotter',
      'Interactive zoom and custom bounds triggers'
    ],
    longDesc: 'A calculus root-finding laboratory. Plot arbitrary functions and trace bisection subdivisions or tangent convergence steps of numerical solvers, printed directly to typewriter logs.'
  },
  { 
    id: 'stats-explorer', 
    name: 'V. Statistics Explorer', 
    component: StatExplorer, 
    desc: 'Statistical Distribution Analyzer',
    discipline: 'ALGEBRA & CALCULUS',
    icon: '📊',
    formula: 'σ = √[ ∑(x_i - μ)² / N ]',
    features: [
      'Evaluates standard deviation, variance, and sample skewness',
      'Calculates linear regression equations and Pearson correlation',
      'Renders high-fidelity SVG Box-and-Whisker plots',
      'Renders dynamic regression lines and coordinate scatter points',
      'Import data matrix vectors via local JSON registers'
    ],
    longDesc: 'An analytic statistical calculator. Input arbitrary datasets or paired regression points to analyze standard deviation bounds, linear slope approximations, and box plots.'
  },
  { 
    id: 'logic-gate-simulator', 
    name: 'VI. Circuit Simulator', 
    component: CircuitSimulator, 
    desc: 'Logic Gate & Boolean Algebra Builder',
    discipline: 'PHYSICS & ENGINEERING',
    icon: '🔌',
    formula: 'Y = (A ∧ B) ∨ (¬C)  ➔  Truth Table',
    features: [
      'Connect AND, OR, NOT, NAND, NOR, XOR, XNOR logic gates',
      '4 interactive switch inputs (A, B, C, D) and outcome receiver LEDs',
      'Compiles absolute 16-row Truth Table for all binary variations',
      'Boolean algebraic compiler parses strings into circuit wires',
      'Trace digital propagation visually with red active currents'
    ],
    longDesc: 'A digital logic circuit lab. Wire gates interactively, toggle switches to propagate high/low voltages, or type Boolean formulas to compile truth tables and schematic graphs.'
  },
  { 
    id: 'geometry-lab', 
    name: 'VII. Geometry Lab', 
    component: GeometryLab, 
    desc: 'Analytic Geometry Snapping Canvas',
    discipline: 'PHYSICS & ENGINEERING',
    icon: 'Compass',
    formula: 'Area = 0.5 * | ∑(x_i y_{i+1} - x_{i+1} y_i) |',
    features: [
      'Snaps points to Cartesian integer coordinates',
      'Construct line segments, circles, and shoelace polygons',
      'Measures Euclidean distance, midpoints, and segment slope',
      'Measures circular area, circumference, and polygon boundaries',
      'Ray-casting polygon boundaries selection algorithms'
    ],
    longDesc: 'A Euclidean geometry drafting table. Snap points to integer axes, construct polygons, and measure midpoints, lengths, slopes, and Shoelace area metrics in real time.'
  },
  { 
    id: 'fourier-waveform-studio', 
    name: 'VIII. Fourier Studio', 
    component: FourierWaveformStudio, 
    desc: 'Fourier Waveform & Harmonic Synth',
    discipline: 'PHYSICS & ENGINEERING',
    icon: '📻',
    formula: 'y(t) = ∑ A_n * sin(n * 2πf_0 t)',
    features: [
      'Saves and sums up to 6 harmonic sine/cosine parameters',
      'Plots time-domain wave and FFT frequency spectrum side-by-side',
      'Web Audio API periodic synthesis with master volume limits',
      'Sine, Square, Sawtooth, and Triangle periodic wave presets',
      'Variable fundamental pitch frequencies selector range'
    ],
    longDesc: 'An additive acoustic synthesizer and wave analyzer. Combine harmonic coefficients to shape waveforms, visualize frequency spectrum bars, and listen to synthesized frequencies.'
  },
  { 
    id: 'graph-algorithm-visualizer', 
    name: 'IX. Graph Visualizer', 
    component: GraphVisualizer, 
    desc: 'Graph Traversals & Pathfinding Visualizer',
    discipline: 'PHYSICS & ENGINEERING',
    icon: '🌿',
    formula: 'dijkstra: d(v) = min[ d(v), d(u) + w(u,v) ]',
    features: [
      'Plot vertices and configure weighted edges on a grid canvas',
      'Animates Dijkstra\'s Shortest Path and Kruskal\'s MST solvers',
      'Animates Breadth-First (BFS) and Depth-First (DFS) traversals',
      'Displays space/time complexities (Big O notation)',
      'Step-by-step animation controls and typewriter descriptions'
    ],
    longDesc: 'An interactive graph theory laboratory. Construct node networks with weighted lines, run pathfinding algorithms step-by-step, and inspect search queues and MST trees.'
  },
  { 
    id: 'solar-roi-calculator', 
    name: 'X. Solar ROI Calculator', 
    component: SolarROICalculator, 
    desc: 'NASA POWER Geocoded Irradiance Model',
    discipline: 'ECO & UTILITY ESTIMATORS',
    icon: '☀️',
    formula: 'Yield(kWh) = Size * Irradiance * Eff * 365 * 0.85',
    features: [
      'Geocodes addresses to coordinates using free Nominatim API',
      'Fetches solar shortwave radiation sum from Open-Meteo API',
      'Solves PVWatts physical generation model with system derating',
      'Estimates yearly utility savings, payback period, and 25y ROI',
      'Canvas bar chart compare monthly yield vs bills consumption'
    ],
    longDesc: 'A financial solar calculator driven by open APIs. Enter an address to retrieve daily solar irradiance coordinates, solve annual energy production, and map payback periods.'
  },
  { 
    id: 'pediatric-dose-helper', 
    name: 'XI. Pediatric Dose Helper', 
    component: PediatricDoseHelper, 
    desc: 'Weight-Based Dosing Safety System',
    discipline: 'ECO & UTILITY ESTIMATORS',
    icon: '🌡️',
    formula: 'Dose(mL) = Weight(kg) * Dose(mg/kg) / Conc(mg/mL)',
    features: [
      'Converts lbs/kg patient weight to precise mg/mL dosages',
      'Acetaminophen, Ibuprofen, or custom concentration ratios',
      'Enforces safety flags when dose exceeds single or daily caps',
      'Calculates active patient weight dosing curve SVG charts',
      'Oral syringe sizes (1mL, 5mL) or medicine cup recommendations'
    ],
    longDesc: 'A pediatric dosing safety tool. Convert a child\'s weight to standard medication doses in mL, with safety caps to flag daily limit alerts.'
  },
  { 
    id: 'leak-cost-calculator', 
    name: 'XII. Leak Cost Estimator', 
    component: LeakCostCalculator, 
    desc: 'Utility Drip Cost & Water Conservation Calculator',
    discipline: 'ECO & UTILITY ESTIMATORS',
    icon: '💧',
    formula: 'Vol = drips/min * 0.05mL * 525600 min/year',
    features: [
      'Converts dripping rates to gallons or liters wasted annually',
      'Calculates water bills impact based on custom utility rates',
      'Wasted equivalents (e.g. Olympic pools, washing loads)',
      'Diagnostic plumbing checklists for household pipes leaks',
      'Custom sliders range drips frequency inputs'
    ],
    longDesc: 'Quantifies faucet leaks and plumbing surcharges. Convert simple drip frequencies to yearly water waste metrics compared to swimming pools or baths.'
  },
  { 
    id: 'carbon-travel-planner', 
    name: 'XIII. Carbon Travel Planner', 
    component: CarbonTravelPlanner, 
    desc: 'Radiative Forcing CO2 Trip Optimizer',
    discipline: 'ECO & UTILITY ESTIMATORS',
    icon: '🌱',
    formula: 'CO₂e = dist * (factor / occ) * (flight ? 1.9 : 1)',
    features: [
      'Compares car, transit bus, electric train, and aviation',
      'Applies high-altitude radiative forcing factors (x1.9 multiplier)',
      'Adjusts emissions proportionally based on passenger occupancy',
      'Estimates yearly tree absorption equivalents (tree-years)',
      'Interactive canvas vertical comparison bar chart'
    ],
    longDesc: 'Calculates the carbon footprint of trips across travel options. Includes flight atmospheric multipliers and grid calculations for trains.'
  }
];

function App() {
  // 1. Startup Boot Loader State
  const [isBooting, setIsBooting] = useState<boolean>(true);
  const [bootPercent, setBootPercent] = useState<number>(0);
  const [currentEq, setCurrentEq] = useState<string>('y = m * x + c');

  // 2. Custom Alert/Confirmation State
  const [alertConfig, setAlertConfig] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm' | 'warning';
    onConfirm?: () => void;
  } | null>(null);

  // 3. Custom Toast Notification State
  const [toastConfig, setToastConfig] = useState<{
    show: boolean;
    message: string;
    type: 'info' | 'success' | 'warning';
  } | null>(null);

  // 4. Custom Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
  }>({ show: false, x: 0, y: 0 });

  // 5. Manifesto Dialog State
  const [activeManifestoTab, setActiveManifestoTab] = useState<'about' | 'privacy' | 'terms' | 'pricing' | 'open-source' | null>(null);

  // 6. Selected Apparatus (Workspace Cabinet switcher)
  const [activeApparatus, setActiveApparatus] = useState<string>('matrix-lab');

  // 7. Navigation Routing Tab ('landing' = Hero + Showcase Directory, 'workspace' = Viewport Cabinet)
  const [currentTab, setCurrentTab] = useState<'landing' | 'workspace'>('landing');

  // Register window methods directly in render to ensure they are immediately bound and never stale!
  window.changeSTEMApparatus = (id) => {
    const match = APPARATUS_LIST.find(a => a.id === id);
    if (match) {
      setActiveApparatus(id);
      setCurrentTab('workspace'); // Swap tab view state to Cabinet Workspace
      localStorage.setItem('stem_active_app', id);
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        window.scrollTo(0, 0);
      }
    }
  };

  window.goSTEMHome = () => {
    setCurrentTab('landing'); // Swap tab view state to Landing Catalog Page
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  };

  // --- Run Diagnostic Boot logs & loader percent ---
  useEffect(() => {
    if (!isBooting) return;

    const equations = [
      "⚙️ ALIGNING DRAFT LEDGERS...",
      "⚙️ DETECTING ALGEBRAIC MATRIX COUPLINGS...",
      "📐 CALIBRATING COORDINATE PLOTTERS...",
      "🧪 BALANCING STOICHIOMETRIC REACTIONS...",
      "📐 SOLVING ROOT convergence INTERVALS...",
      "📊 PREPARING REGRESSION COEFFICIENTS...",
      "🔌 WIRING DIRECTED GATE SCHEMATICS...",
      "📐 MEASURING EUCLIDEAN MIDPOINTS & SLOPES...",
      "📻 SUMMING PERIODIC SINE HARMONICS...",
      "🌿 PLOTTING DIJKSTRA ROUTE PATHFINDERS...",
      "☀️ RETRIEVING SOLAR DAILY IRRADIANCE DATA...",
      "🌡️ VALIDATING MEDICATION MG/KG SAFETY CAPS...",
      "💧 ESTIMATING UTILITY SURCHARGE WASTE...",
      "🌱 COMPENSATING FLIGHT RADIATIVE FORCING...",
      "⚛️ SYSTEM CALIBRATION COMPLETED! launching..."
    ];

    let percent = 0;
    const interval = setInterval(() => {
      percent += 1;
      setBootPercent(percent);

      const eqIndex = Math.min(
        Math.floor((percent / 100) * equations.length),
        equations.length - 1
      );
      setCurrentEq(equations[eqIndex]);

      if (percent >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsBooting(false);
        }, 500);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [isBooting]);

  // --- Register global trigger hooks ---
  useEffect(() => {
    window.showAtelierAlert = (title, message, type = 'alert') => {
      setAlertConfig({
        show: true,
        title,
        message,
        type: type === 'warning' ? 'warning' : 'alert'
      });
    };

    window.showAtelierConfirm = (title, message, onConfirm) => {
      setAlertConfig({
        show: true,
        title,
        message,
        type: 'confirm',
        onConfirm
      });
    };

    let toastTimeout: any;
    window.showAtelierToast = (message, type = 'info') => {
      setToastConfig({
        show: true,
        message,
        type
      });
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        setToastConfig(null);
      }, 4000);
    };

    window.openStudentManifesto = (tab) => {
      setActiveManifestoTab(tab);
    };

    // Global click listener to close context menu
    const handleGlobalClick = () => {
      setContextMenu(prev => prev.show ? { ...prev, show: false } : prev);
    };
    window.addEventListener('click', handleGlobalClick);

    // Global contextmenu listener to trigger context menu anywhere with bounds protection
    const handleGlobalContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      
      const menuWidth = 220;
      const menuHeight = 240;
      let x = e.clientX;
      let y = e.clientY;
      
      if (x + menuWidth > window.innerWidth) {
        x = window.innerWidth - menuWidth - 10;
      }
      if (y + menuHeight > window.innerHeight) {
        y = window.innerHeight - menuHeight - 10;
      }
      
      setContextMenu({
        show: true,
        x,
        y
      });
    };
    window.addEventListener('contextmenu', handleGlobalContextMenu);

    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('contextmenu', handleGlobalContextMenu);
    };
  }, []);

  const handleContextAction = (action: string) => {
    setContextMenu(prev => ({ ...prev, show: false }));

    if (action === 'wipe') {
      window.showAtelierConfirm(
        "WIPE ALL APPARATUS COUNTERS",
        "This mechanical action will completely SHRED all cached matrices, equations, molar structures and ledger entries from your browser's localStorage. Proceed?",
        () => {
          localStorage.clear();
          window.showAtelierToast("All workspace caches successfully shredded!", "warning");
          setTimeout(() => {
            window.location.reload();
          }, 800);
        }
      );
    } 
    else if (action === 'randomize') {
      window.showAtelierToast(`Randomizing active apparatus inputs...`, "info");
      const activeContainer = document.getElementById('workshop-cabinet');
      if (activeContainer) {
        const presetBtns = Array.from(activeContainer.querySelectorAll('button')) as HTMLButtonElement[];
        const targetBtn = presetBtns.find(btn => 
          btn.innerText.toLowerCase().includes('random') || 
          btn.innerText.toLowerCase().includes('preset') ||
          btn.innerText.toLowerCase().includes('load') ||
          btn.innerText.toLowerCase().includes('demo')
        );
        if (targetBtn) {
          targetBtn.click();
        } else {
          window.showAtelierToast("No automatic randomizer preset button found for this apparatus.", "warning");
        }
      }
    } 
    else if (action === 'calibrate') {
      window.showAtelierToast("Re-calibrating Orbit Engine diagnostics...", "info");
      setBootPercent(0);
      setIsBooting(true);
    } 
    else if (action === 'export') {
      try {
        const state: Record<string, string | null> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('stem_') || key.startsWith('geometry_') || key.startsWith('fourier_') || key.startsWith('circuit_'))) {
            state[key] = localStorage.getItem(key);
          }
        }
        navigator.clipboard.writeText(JSON.stringify(state, null, 2));
        window.showAtelierToast("Workspace ledger state copied to clipboard!", "success");
      } catch (err) {
        window.showAtelierToast("Could not export workspace state.", "warning");
      }
    } 
    else if (action === 'diagnostic') {
      const diagReport = `STEM WORKSHOP DIAGNOSTIC REPORT\n` +
                         `===============================\n` +
                         `Registered Date:  ${new Date().toLocaleString()}\n` +
                         `System Target:    Solo Student Project Calibration\n` +
                         `Browser Protocol: ${navigator.userAgent}\n` +
                         `State Cache Size: ${JSON.stringify(localStorage).length} bytes\n` +
                         `Apparatus Status: OPERATIONAL & SECURED.`;
      navigator.clipboard.writeText(diagReport);
      window.showAtelierToast("Diagnostic report copied to clipboard!", "success");
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case '⚙️': return <Atom className="w-5 h-5 text-[#E63946]" />;
      case '⚡': return <Atom className="w-5 h-5 text-[#C5A059]" />;
      case '🧪': return <Atom className="w-5 h-5 text-[#E63946]" />;
      case '📐': return <Atom className="w-5 h-5 text-[#457B9D]" />;
      case '📊': return <Atom className="w-5 h-5 text-indigo-600" />;
      case '🔌': return <Terminal className="w-5 h-5 text-[#E63946]" />;
      case 'Compass': return <Compass className="w-5 h-5 text-[#C5A059]" />;
      case '📻': return <Atom className="w-5 h-5 text-[#457B9D]" />;
      case '🌿': return <Atom className="w-5 h-5 text-emerald-700" />;
      case '☀️': return <Sun className="w-5 h-5 text-amber-500" />;
      case '🌡️': return <ShieldIcon className="w-5 h-5 text-red-500" />;
      case '💧': return <Droplet className="w-5 h-5 text-blue-500" />;
      case '🌱': return <Globe className="w-5 h-5 text-emerald-700" />;
      default: return <Atom className="w-5 h-5 text-[#1D3557]" />;
    }
  };

  // High-fidelity blueprint simulations inside the Showcase Cards
  const renderPreview = (id: string) => {
    switch (id) {
      case 'matrix-lab':
        return (
          <div className="border-2 border-[#1D3557] bg-[#F5F1E8] p-4 flex flex-col justify-between h-56 relative select-none">
            <div className="border-b border-[#1D3557]/20 pb-1 mb-2 flex justify-between font-mono text-[8px] text-[#1D3557]/60">
              <span>SCHEMATIC: MAT-A01</span>
              <span>GAUSSIAN SOLVER</span>
            </div>
            <div className="flex-1 flex items-center justify-center gap-4">
              <div className="matrix-bracket p-3 font-mono text-[10px] text-[#1D3557] font-bold grid grid-cols-3 gap-1">
                <span>2</span> <span>-1</span> <span>0</span>
                <span>-1</span> <span>2</span> <span>-1</span>
                <span>0</span> <span>-1</span> <span>2</span>
              </div>
              <div className="text-[#E63946] font-display text-xs font-bold">➔</div>
              <div className="bg-white border border-[#1D3557]/15 p-2 font-mono text-[9px] text-[#1D3557]">
                <div>det(A) = 4</div>
                <div className="text-emerald-700">Eigenvalues:</div>
                <div>λ = [0.58, 2.0, 3.41]</div>
              </div>
            </div>
            <span className="font-body text-[8px] text-[#1D3557]/40 uppercase text-center mt-2">DETERMINANT COEFFICIENT SCHEME</span>
          </div>
        );
      case 'equation-solver':
        return (
          <div className="border-2 border-[#1D3557] bg-[#F5F1E8] p-4 flex flex-col justify-between h-56 relative overflow-hidden select-none">
            <div className="border-b border-[#1D3557]/20 pb-1 mb-2 flex justify-between font-mono text-[8px] text-[#1D3557]/60">
              <span>SCHEMATIC: THERMO-G02</span>
              <span>GAS SOLVER</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center relative">
              <svg className="w-24 h-24 text-[#1D3557]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="3 3" />
                <path d="M 20,80 A 40,40 0 1,1 80,80" stroke="currentColor" strokeWidth="4" fill="none" />
                <line x1="50" y1="50" x2="30" y2="25" stroke="#E63946" strokeWidth="3" strokeLinecap="round" className="animate-pulse" />
                <circle cx="50" cy="50" r="5" fill="#1D3557" />
                <text x="50" y="70" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="monospace" fill="#1D3557">PV = nRT</text>
              </svg>
              <div className="absolute bottom-1 right-2 bg-white border border-[#1D3557]/10 py-0.5 px-1.5 font-mono text-[8px]">
                P = 2.45 atm
              </div>
            </div>
            <span className="font-body text-[8px] text-[#1D3557]/40 uppercase text-center mt-1">THERMODYNAMIC COMPRESSION GAUGE</span>
          </div>
        );
      case 'chem-balancer':
        return (
          <div className="border-2 border-[#1D3557] bg-[#F5F1E8] p-4 flex flex-col justify-between h-56 relative select-none">
            <div className="border-b border-[#1D3557]/20 pb-1 mb-2 flex justify-between font-mono text-[8px] text-[#1D3557]/60">
              <span>SCHEMATIC: CHEM-B03</span>
              <span>MASS CONSERVATION</span>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center gap-3">
              <div className="flex gap-2 items-center">
                <div className="bg-white border border-[#1D3557]/20 px-2 py-1 font-mono text-[10px] text-[#1D3557] font-bold">
                  C₃H₈ + O₂
                </div>
                <div className="text-[#E63946] text-xs font-bold">➔</div>
                <div className="bg-white border border-[#1D3557]/20 px-2 py-1 font-mono text-[10px] text-[#1D3557] font-bold">
                  CO₂ + H₂O
                </div>
              </div>
              <div className="text-[9px] font-mono text-[#E63946] font-bold bg-[#FFFDF0] px-2 py-1 border border-[#E63946]">
                Balanced: 1 C₃H₈ + 5 O₂ ➔ 3 CO₂ + 4 H₂O
              </div>
            </div>
            <span className="font-body text-[8px] text-[#1D3557]/40 uppercase text-center mt-2">STOICHIOMETRIC BALANCING REGISTRY</span>
          </div>
        );
      case 'numerical-playground':
        return (
          <div className="border-2 border-[#1D3557] bg-[#F5F1E8] p-4 flex flex-col justify-between h-56 relative select-none">
            <div className="border-b border-[#1D3557]/20 pb-1 mb-2 flex justify-between font-mono text-[8px] text-[#1D3557]/60">
              <span>SCHEMATIC: CALC-R04</span>
              <span>ROOT CONVERGENCE</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <svg className="w-full h-24 text-[#1D3557]" viewBox="0 0 160 80">
                <line x1="10" y1="40" x2="150" y2="40" stroke="currentColor" strokeWidth="1" />
                <line x1="20" y1="10" x2="20" y2="70" stroke="currentColor" strokeWidth="1" />
                <path d="M 20,60 Q 80,50 140,10" stroke="#E63946" strokeWidth="2" fill="none" />
                <line x1="120" y1="40" x2="120" y2="20" stroke="currentColor" strokeDasharray="1 1" />
                <line x1="120" y1="20" x2="70" y2="40" stroke="#C5A059" strokeWidth="1.5" />
                <circle cx="70" cy="40" r="2.5" fill="#E63946" />
                <text x="75" y="36" fontSize="6" fontFamily="monospace">x₁</text>
                <text x="123" y="18" fontSize="6" fontFamily="monospace">f(x₀)</text>
              </svg>
            </div>
            <span className="font-body text-[8px] text-[#1D3557]/40 uppercase text-center mt-2">NEWTON-RAPHSON TANGENT SCHEMATIC</span>
          </div>
        );
      case 'stats-explorer':
        return (
          <div className="border-2 border-[#1D3557] bg-[#F5F1E8] p-4 flex flex-col justify-between h-56 relative select-none">
            <div className="border-b border-[#1D3557]/20 pb-1 mb-2 flex justify-between font-mono text-[8px] text-[#1D3557]/60">
              <span>SCHEMATIC: STAT-E05</span>
              <span>REGRESSION BOUNDS</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <svg className="w-full h-24 text-[#1D3557]" viewBox="0 0 160 80">
                <line x1="15" y1="70" x2="150" y2="70" stroke="currentColor" strokeWidth="1" />
                <line x1="15" y1="10" x2="15" y2="70" stroke="currentColor" strokeWidth="1" />
                <circle cx="30" cy="60" r="2" fill="#1D3557" />
                <circle cx="60" cy="48" r="2" fill="#1D3557" />
                <circle cx="90" cy="42" r="2" fill="#1D3557" />
                <circle cx="120" cy="24" r="2" fill="#1D3557" />
                <line x1="15" y1="65" x2="140" y2="18" stroke="#E63946" strokeWidth="1.5" />
                <text x="95" y="24" fontSize="6" fontFamily="monospace" fill="#E63946">r = 0.96</text>
              </svg>
            </div>
            <span className="font-body text-[8px] text-[#1D3557]/40 uppercase text-center mt-2">LEAST-SQUARES LINEAR ESTIMATOR</span>
          </div>
        );
      case 'logic-gate-simulator':
        return (
          <div className="border-2 border-[#1D3557] bg-[#F5F1E8] p-4 flex flex-col justify-between h-56 relative select-none">
            <div className="border-b border-[#1D3557]/20 pb-1 mb-2 flex justify-between font-mono text-[8px] text-[#1D3557]/60">
              <span>SCHEMATIC: GATE-L06</span>
              <span>PROPAGATION WIRE</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <svg className="w-full h-24 text-[#1D3557]" viewBox="0 0 160 80">
                <circle cx="20" cy="25" r="4" fill="#E63946" />
                <circle cx="20" cy="55" r="4" fill="#1D3557" />
                <text x="10" y="27" fontSize="6" fontFamily="monospace">A:1</text>
                <text x="10" y="57" fontSize="6" fontFamily="monospace">B:0</text>
                <rect x="60" y="30" width="30" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <text x="75" y="42" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">AND</text>
                <circle cx="130" cy="40" r="6" fill="#1D3557" stroke="currentColor" strokeWidth="1.5" />
                <text x="142" y="43" fontSize="6" fontFamily="monospace">OUT:0</text>
                <path d="M 24,25 C 40,25 40,35 60,35" stroke="#E63946" strokeWidth="1.5" fill="none" />
                <path d="M 24,55 C 40,55 40,45 60,45" stroke="#1D3557" strokeWidth="1" fill="none" />
                <line x1="90" y1="40" x2="124" y2="40" stroke="#1D3557" strokeWidth="1" />
              </svg>
            </div>
            <span className="font-body text-[8px] text-[#1D3557]/40 uppercase text-center mt-2">BINARY SCHEMATIC LOGIC MAPPING</span>
          </div>
        );
      case 'geometry-lab':
        return (
          <div className="border-2 border-[#1D3557] bg-[#F5F1E8] p-4 flex flex-col justify-between h-56 relative select-none">
            <div className="border-b border-[#1D3557]/20 pb-1 mb-2 flex justify-between font-mono text-[8px] text-[#1D3557]/60">
              <span>SCHEMATIC: GEOM-M07</span>
              <span>SHOELACE POLYGON</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <svg className="w-full h-24 text-[#1D3557]" viewBox="0 0 160 80">
                <line x1="80" y1="0" x2="80" y2="80" stroke="currentColor" strokeDasharray="1 3" strokeOpacity="0.3" />
                <line x1="0" y1="40" x2="160" y2="40" stroke="currentColor" strokeDasharray="1 3" strokeOpacity="0.3" />
                <polygon points="50,20 110,15 130,55 70,60" fill="rgba(230,57,70,0.06)" stroke="#1D3557" strokeWidth="1.5" />
                <circle cx="50" cy="20" r="2" fill="#E63946" />
                <circle cx="110" cy="15" r="2" fill="#E63946" />
                <circle cx="130" cy="55" r="2" fill="#E63946" />
                <circle cx="70" cy="60" r="2" fill="#E63946" />
                <text x="90" y="38" fontSize="6" fontFamily="monospace" fill="#E63946">Area = 24.50</text>
              </svg>
            </div>
            <span className="font-body text-[8px] text-[#1D3557]/40 uppercase text-center mt-2">DRAFT SEGMENT CARTESIAN SOLVER</span>
          </div>
        );
      case 'fourier-waveform-studio':
        return (
          <div className="border-2 border-[#1D3557] bg-[#F5F1E8] p-4 flex flex-col justify-between h-56 relative select-none">
            <div className="border-b border-[#1D3557]/20 pb-1 mb-2 flex justify-between font-mono text-[8px] text-[#1D3557]/60">
              <span>SCHEMATIC: WAVE-F08</span>
              <span>HARMONIC SUMMATION</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <svg className="w-full h-24 text-[#1D3557]" viewBox="0 0 160 80">
                <line x1="10" y1="40" x2="150" y2="40" stroke="currentColor" strokeWidth="1" />
                <path d="M 10,40 Q 25,10 40,40 T 70,40 T 100,40 T 130,40 T 150,40" stroke="#E63946" strokeWidth="1.5" fill="none" />
                <path d="M 10,40 L 40,15 L 40,65 L 75,65 L 75,15 L 110,15 L 110,65 L 145,65" stroke="currentColor" strokeWidth="0.8" strokeDasharray="1 1" fill="none" />
              </svg>
            </div>
            <span className="font-body text-[8px] text-[#1D3557]/40 uppercase text-center mt-2">ADDITIVE FOURIER HARMONICS SPECTRUM</span>
          </div>
        );
      case 'graph-algorithm-visualizer':
        return (
          <div className="border-2 border-[#1D3557] bg-[#F5F1E8] p-4 flex flex-col justify-between h-56 relative select-none">
            <div className="border-b border-[#1D3557]/20 pb-1 mb-2 flex justify-between font-mono text-[8px] text-[#1D3557]/60">
              <span>SCHEMATIC: ROUTE-D09</span>
              <span>DIJKSTRA SOLVER</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <svg className="w-full h-24 text-[#1D3557]" viewBox="0 0 160 80">
                <circle cx="30" cy="40" r="7" fill="#E63946" stroke="currentColor" strokeWidth="1" />
                <circle cx="80" cy="20" r="7" fill="#1D3557" stroke="currentColor" strokeWidth="1" />
                <circle cx="80" cy="60" r="7" fill="#1D3557" stroke="currentColor" strokeWidth="1" />
                <circle cx="130" cy="40" r="7" fill="#E63946" stroke="currentColor" strokeWidth="1" />
                <text x="30" y="43" fontSize="6" fontFamily="monospace" fill="#FFFDF0" textAnchor="middle">1</text>
                <text x="80" y="23" fontSize="6" fontFamily="monospace" fill="#FFFDF0" textAnchor="middle">2</text>
                <text x="80" y="63" fontSize="6" fontFamily="monospace" fill="#FFFDF0" textAnchor="middle">3</text>
                <text x="130" y="43" fontSize="6" fontFamily="monospace" fill="#FFFDF0" textAnchor="middle">4</text>
                <line x1="37" y1="38" x2="73" y2="22" stroke="currentColor" strokeWidth="1" />
                <line x1="37" y1="42" x2="73" y2="58" stroke="#E63946" strokeWidth="2.5" />
                <line x1="87" y1="22" x2="123" y2="38" stroke="currentColor" strokeWidth="1" />
                <line x1="87" y1="58" x2="123" y2="42" stroke="#E63946" strokeWidth="2.5" />
              </svg>
            </div>
            <span className="font-body text-[8px] text-[#1D3557]/40 uppercase text-center mt-2">MINIMUM EDGE WEIGHT Shortest PATH</span>
          </div>
        );
      case 'solar-roi-calculator':
        return (
          <div className="border-2 border-[#1D3557] bg-[#F5F1E8] p-4 flex flex-col justify-between h-56 relative select-none">
            <div className="border-b border-[#1D3557]/20 pb-1 mb-2 flex justify-between font-mono text-[8px] text-[#1D3557]/60">
              <span>SCHEMATIC: SOLAR-S10</span>
              <span>PVWATTS PAYBACK</span>
            </div>
            <div className="flex-1 flex items-center justify-between gap-2">
              <svg className="w-16 h-16 text-[#1D3557]" viewBox="0 0 40 40">
                <polygon points="5,20 20,5 35,20" fill="none" stroke="currentColor" strokeWidth="1" />
                <rect x="8" y="20" width="24" height="15" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="32" cy="8" r="4" fill="#C5A059" />
                <line x1="32" y1="2" x2="32" y2="0" stroke="#C5A059" />
                <line x1="32" y1="14" x2="32" y2="16" stroke="#C5A059" />
              </svg>
              <div className="flex-1 bg-white border border-[#1D3557]/15 p-1.5 font-mono text-[8px] text-[#1D3557]">
                <div className="font-bold text-[#E63946]">ROI OUTCOME:</div>
                <div>Savings: $1,420/y</div>
                <div>Payback: 6.8 Years</div>
                <div>CO2e Offset: 2,400 kg</div>
              </div>
            </div>
            <span className="font-body text-[8px] text-[#1D3557]/40 uppercase text-center mt-2">IRRADIANCE CONVERGENCE LEDGER</span>
          </div>
        );
      case 'pediatric-dose-helper':
        return (
          <div className="border-2 border-[#1D3557] bg-[#F5F1E8] p-4 flex flex-col justify-between h-56 relative select-none">
            <div className="border-b border-[#1D3557]/20 pb-1 mb-2 flex justify-between font-mono text-[8px] text-[#1D3557]/60">
              <span>SCHEMATIC: DOSE-P11</span>
              <span>CLINICAL WEIGHT DOSING</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
              <svg className="w-full h-14 text-[#1D3557]" viewBox="0 0 120 30">
                <rect x="20" y="8" width="80" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1" />
                <line x1="10" y1="14" x2="20" y2="14" stroke="currentColor" strokeWidth="2" />
                <line x1="100" y1="14" x2="115" y2="14" stroke="currentColor" strokeWidth="1" />
                <line x1="30" y1="8" x2="30" y2="12" stroke="currentColor" strokeWidth="0.5" />
                <line x1="40" y1="8" x2="40" y2="12" stroke="currentColor" strokeWidth="0.5" />
                <line x1="50" y1="8" x2="50" y2="12" stroke="currentColor" strokeWidth="0.5" />
                <line x1="60" y1="8" x2="60" y2="12" stroke="currentColor" strokeWidth="0.5" />
                <line x1="70" y1="8" x2="70" y2="12" stroke="currentColor" strokeWidth="0.5" />
                <line x1="80" y1="8" x2="80" y2="12" stroke="currentColor" strokeWidth="0.5" />
                <rect x="21" y="9" width="44" height="10" fill="rgba(230,57,70,0.2)" />
              </svg>
              <div className="bg-red-50 border border-red-300 py-0.5 px-2 font-mono text-[9px] text-[#E63946] font-bold">
                SAFE DOSAGE CAP: 5.60 mL Max
              </div>
            </div>
            <span className="font-body text-[8px] text-[#1D3557]/40 uppercase text-center mt-1">VOLUMETRIC LIQUID SYRINGE MARK</span>
          </div>
        );
      case 'leak-cost-calculator':
        return (
          <div className="border-2 border-[#1D3557] bg-[#F5F1E8] p-4 flex flex-col justify-between h-56 relative select-none">
            <div className="border-b border-[#1D3557]/20 pb-1 mb-2 flex justify-between font-mono text-[8px] text-[#1D3557]/60">
              <span>SCHEMATIC: LEAK-W12</span>
              <span>DRIP ACCRETION</span>
            </div>
            <div className="flex-1 flex items-center justify-around gap-2">
              <svg className="w-12 h-16 text-[#1D3557]" viewBox="0 0 30 40">
                <path d="M 5,5 L 20,5 L 20,15 L 15,15" stroke="currentColor" strokeWidth="2.5" fill="none" />
                <path d="M 17,23 Q 17,27 20,27 Q 23,27 20,23 Z" fill="rgba(69, 123, 157, 0.6)" stroke="currentColor" strokeWidth="0.5" className="animate-bounce" />
              </svg>
              <div className="bg-white border border-[#1D3557]/15 p-2 font-mono text-[8px] text-[#1D3557]">
                <div>Rate: 45 drips/min</div>
                <div className="text-[#E63946] font-bold">Yearly Loss:</div>
                <div>Liters: 1,180 Liters</div>
                <div>Utility Surcharge: $9.44</div>
              </div>
            </div>
            <span className="font-body text-[8px] text-[#1D3557]/40 uppercase text-center mt-2">DETERMINATE PLUMBING LEAKS</span>
          </div>
        );
      case 'carbon-travel-planner':
        return (
          <div className="border-2 border-[#1D3557] bg-[#F5F1E8] p-4 flex flex-col justify-between h-56 relative select-none">
            <div className="border-b border-[#1D3557]/20 pb-1 mb-2 flex justify-between font-mono text-[8px] text-[#1D3557]/60">
              <span>SCHEMATIC: TRIP-C13</span>
              <span>EMISSIONS COMPARE</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <svg className="w-full h-24 text-[#1D3557]" viewBox="0 0 160 80">
                <rect x="25" y="20" width="12" height="50" fill="#E63946" stroke="currentColor" strokeWidth="0.8" />
                <text x="31" y="78" fontSize="6" fontFamily="monospace" textAnchor="middle">🚗</text>
                <rect x="65" y="55" width="12" height="15" fill="#1D3557" stroke="currentColor" strokeWidth="0.8" />
                <text x="71" y="78" fontSize="6" fontFamily="monospace" textAnchor="middle">🚆</text>
                <rect x="105" y="10" width="12" height="60" fill="#E63946" stroke="currentColor" strokeWidth="0.8" />
                <text x="111" y="78" fontSize="6" fontFamily="monospace" textAnchor="middle">✈️</text>
                <text x="135" y="36" fontSize="6" fontFamily="monospace" fill="#E63946" fontWeight="bold">Flight: 84kg</text>
                <text x="135" y="46" fontSize="6" fontFamily="monospace" fill="#1D3557" fontWeight="bold">Train: 12kg</text>
              </svg>
            </div>
            <span className="font-body text-[8px] text-[#1D3557]/40 uppercase text-center mt-2">TRAVEL MULTI-MODE CARBON BALANCE</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="noise-bg min-h-screen select-none">
      
      {/* 1. STARTUP BOOT LOADER - BULLETPROOF FULL SCREEN COVERAGE MATCHING WEBSITE UI */}
      {isBooting && (
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen min-h-screen min-w-screen z-[99999] bg-[#F4ECD8] flex items-center justify-center p-4 md:p-6 transition-all duration-700 animate-fadeIn overflow-hidden">
          {/* Film grain layer as absolute child to prevent position: relative overriding fixed */}
          <div className="absolute inset-0 film-grain pointer-events-none" />
          
          <div className="w-full max-w-md bg-[#FFFDF0] border-8 double border-[#1D3557] p-6 shadow-2xl relative select-none z-10">
            {/* Blueprint dashed borders inside */}
            <div className="absolute inset-2 border-2 border-dashed border-[#1D3557]/15 pointer-events-none" />
            
            <div className="flex flex-col items-center text-center relative z-10 py-6">
              {/* Spinning Atom in the center */}
              <div className="w-16 h-16 bg-[#E63946] flex items-center justify-center border-3 border-[#1D3557] shadow-md animate-spin-slow mb-6">
                <Atom className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="font-display text-2xl text-[#1D3557] tracking-wider leading-none mb-1">STEM WORKSHOP</h2>
              <span className="font-body text-[10px] text-[#E63946] uppercase font-bold tracking-widest block mb-6">ATELIER MODEL 1956-V</span>
              
              {/* Monospaced Log of current Calibration */}
              <div className="w-full bg-[#F5F1E8] border border-[#1D3557]/20 p-3 h-14 flex items-center justify-center text-center mb-6 shadow-inner rounded-sm">
                <span className="font-mono text-xs font-bold text-[#1D3557] leading-snug">
                  ⚛️ {currentEq}
                </span>
              </div>
              
              {/* Horizontal clean progress bar */}
              <div className="w-full border-2 border-[#1D3557] bg-[#F5F1E8] h-6 p-0.5 relative shadow-inner rounded-sm">
                <div 
                  className="bg-[#E63946] h-full transition-all duration-100 ease-out" 
                  style={{ width: `${bootPercent}%` }} 
                />
              </div>
              
              {/* Percentage Stamp badge */}
              <div className="mt-4 bg-[#1D3557] text-[#FFFDF0] font-body text-xs font-bold px-4 py-1 uppercase tracking-widest">
                [ APPARATUS CALIBRATING: {bootPercent}% ]
              </div>
            </div>
          </div>
        </div>
      )}
 
      {/* Main computational application layout */}
      {!isBooting && (
        <>
          <Navigation />
          <main className="pt-24 select-text overflow-x-hidden">
            
            {currentTab === 'landing' ? (
              <>
                <Hero />
                
                {/* 2. THE BIG BLUEPRINT CATALOG SHOWCASE (Landing Page Exhibition of all 13 modules) */}
                <section id="blueprint-directory" className="max-w-[1440px] mx-auto px-4 md:px-8 py-16 scroll-mt-20 animate-fadeIn">
                  <div className="thick-frame bg-[#FFFDF0] p-6 md:p-10 relative">
                    {/* Dashed blueprint border watermark */}
                    <div className="absolute inset-2 border-2 border-dashed border-[#1D3557]/15 pointer-events-none" />
                    
                    {/* Header */}
                    <div className="border-b-4 border-double border-[#1D3557] pb-6 mb-16 text-center relative z-10">
                      <span className="font-display text-xs tracking-widest text-[#E63946] block mb-1">★ THE APPARATUS DIRECTORY ★</span>
                      <h2 className="font-display text-xl sm:text-3xl md:text-5xl text-[#1D3557] tracking-wider leading-none">THE APPARATUS SHOWCASE DIRECTORY</h2>
                      <p className="font-body text-xs text-[#E63946] uppercase font-bold tracking-widest mt-2">
                        Exhibiting the 13 real, fully functioning client-side STEM calculators
                      </p>
                    </div>

                    {/* Directory full-width alternating showcase cards */}
                    <div className="space-y-16 relative z-10">
                      {APPARATUS_LIST.map((app, idx) => {
                        const layoutType = idx % 3; // Cycle: 0 = Left-focused, 1 = Right-focused, 2 = Centered
                        return (
                          <div 
                            key={app.id} 
                            className="vintage-menu-card p-6 md:p-8 relative w-full shadow-md flex flex-col justify-between hover:scale-[1.005] transition-transform duration-300 animate-fadeIn"
                          >
                            {/* Blueprint decorative top rule */}
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E63946] via-[#1D3557] to-[#C5A059]" />
                            
                            {layoutType === 0 && (
                              <div className="grid md:grid-cols-12 gap-8 items-center">
                                {/* Layout Left: Details Left, Preview Right */}
                                <div className="md:col-span-7 space-y-4">
                                  <div className="flex justify-between items-center border-b border-dashed border-[#1D3557]/20 pb-2 mb-1">
                                    <span className="font-display text-[10px] text-[#C5A059] tracking-wider font-bold">
                                      {app.discipline}
                                    </span>
                                    <span className="font-body text-[9px] py-0.5 px-2 bg-[#E63946] text-white font-bold rounded-none uppercase animate-pulse">
                                      ● Operational Program
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#F5F1E8] border border-[#1D3557]/15">
                                      {getIcon(app.icon)}
                                    </div>
                                    <div>
                                      <h3 className="font-display text-xl md:text-2xl text-[#1D3557] leading-none">{app.name}</h3>
                                      <span className="font-body text-[11px] text-[#1D3557]/65 block mt-0.5 font-bold uppercase">{app.desc}</span>
                                    </div>
                                  </div>

                                  <p className="font-body text-xs md:text-sm text-[#1D3557]/80 leading-relaxed">
                                    {app.longDesc}
                                  </p>

                                  {/* Formula Display */}
                                  <div className="w-full bg-[#F5F1E8] border border-[#1D3557]/15 p-2 text-center select-all">
                                    <span className="font-display-alt text-[10px] md:text-xs font-bold text-[#E63946]">
                                      🔬 MATH FORMULA: {app.formula}
                                    </span>
                                  </div>

                                  {/* Features List */}
                                  <div className="space-y-1.5 pt-2">
                                    <span className="font-display text-[9px] text-[#1D3557] block font-bold tracking-wider uppercase">★ Target Capabilities:</span>
                                    <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                                      {app.features.map((feat, fidx) => (
                                        <div key={fidx} className="flex items-start gap-1.5 font-body text-[10px] text-[#1D3557]/70 font-semibold leading-snug">
                                          <span className="text-[#E63946] flex-shrink-0 mt-0.5">•</span>
                                          <span>{feat}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="pt-4 max-w-xs">
                                    <button
                                      onClick={() => window.changeSTEMApparatus(app.id)}
                                      className="w-full ticket-btn text-[11px] py-2 px-5 flex items-center justify-center gap-2"
                                    >
                                      [ LAUNCH INTERACTIVE WORKSPACE ]
                                    </button>
                                  </div>
                                </div>

                                {/* Right Preview Panel */}
                                <div className="md:col-span-5 w-full">
                                  <div className="border border-[#1D3557]/20 p-2.5 bg-white shadow-inner relative">
                                    <span className="absolute top-4 right-6 font-display text-[8px] text-[#C5A059] font-bold tracking-widest z-10">SIMULATED SCHEMA</span>
                                    {renderPreview(app.id)}
                                  </div>
                                </div>
                              </div>
                            )}

                            {layoutType === 1 && (
                              <div className="grid md:grid-cols-12 gap-8 items-center">
                                {/* Layout Right: Details Right, Preview Left */}
                                {/* Left Preview Panel (rendered first, will stack first on mobile using Tailwind order) */}
                                <div className="md:col-span-5 w-full order-2 md:order-1">
                                  <div className="border border-[#1D3557]/20 p-2.5 bg-white shadow-inner relative">
                                    <span className="absolute top-4 right-6 font-display text-[8px] text-[#C5A059] font-bold tracking-widest z-10">SIMULATED SCHEMA</span>
                                    {renderPreview(app.id)}
                                  </div>
                                </div>

                                {/* Right Details Block */}
                                <div className="md:col-span-7 space-y-4 order-1 md:order-2">
                                  <div className="flex justify-between items-center border-b border-dashed border-[#1D3557]/20 pb-2 mb-1">
                                    <span className="font-display text-[10px] text-[#C5A059] tracking-wider font-bold">
                                      {app.discipline}
                                    </span>
                                    <span className="font-body text-[9px] py-0.5 px-2 bg-[#E63946] text-white font-bold rounded-none uppercase animate-pulse">
                                      ● Operational Program
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#F5F1E8] border border-[#1D3557]/15">
                                      {getIcon(app.icon)}
                                    </div>
                                    <div>
                                      <h3 className="font-display text-xl md:text-2xl text-[#1D3557] leading-none">{app.name}</h3>
                                      <span className="font-body text-[11px] text-[#1D3557]/65 block mt-0.5 font-bold uppercase">{app.desc}</span>
                                    </div>
                                  </div>

                                  <p className="font-body text-xs md:text-sm text-[#1D3557]/80 leading-relaxed">
                                    {app.longDesc}
                                  </p>

                                  {/* Formula Display */}
                                  <div className="w-full bg-[#F5F1E8] border border-[#1D3557]/15 p-2 text-center select-all">
                                    <span className="font-display-alt text-[10px] md:text-xs font-bold text-[#E63946]">
                                      🔬 MATH FORMULA: {app.formula}
                                    </span>
                                  </div>

                                  {/* Features List */}
                                  <div className="space-y-1.5 pt-2">
                                    <span className="font-display text-[9px] text-[#1D3557] block font-bold tracking-wider uppercase">★ Target Capabilities:</span>
                                    <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                                      {app.features.map((feat, fidx) => (
                                        <div key={fidx} className="flex items-start gap-1.5 font-body text-[10px] text-[#1D3557]/70 font-semibold leading-snug">
                                          <span className="text-[#E63946] flex-shrink-0 mt-0.5">•</span>
                                          <span>{feat}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="pt-4 max-w-xs">
                                    <button
                                      onClick={() => window.changeSTEMApparatus(app.id)}
                                      className="w-full ticket-btn text-[11px] py-2 px-5 flex items-center justify-center gap-2"
                                    >
                                      [ LAUNCH INTERACTIVE WORKSPACE ]
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {layoutType === 2 && (
                              <div className="flex flex-col items-center justify-center gap-6 w-full text-center">
                                {/* Layout Center: Details stacked in center and Preview centered below */}
                                <div className="w-full max-w-3xl space-y-4">
                                  <div className="flex justify-between items-center border-b border-dashed border-[#1D3557]/20 pb-2 mb-1 w-full">
                                    <span className="font-display text-[10px] text-[#C5A059] tracking-wider font-bold">
                                      {app.discipline}
                                    </span>
                                    <span className="font-body text-[9px] py-0.5 px-2 bg-[#E63946] text-white font-bold rounded-none uppercase animate-pulse">
                                      ● Operational Program
                                    </span>
                                  </div>

                                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <div className="p-2 bg-[#F5F1E8] border border-[#1D3557]/15">
                                      {getIcon(app.icon)}
                                    </div>
                                    <div className="text-center sm:text-left">
                                      <h3 className="font-display text-xl md:text-2xl text-[#1D3557] leading-none text-center sm:text-left">{app.name}</h3>
                                      <span className="font-body text-[11px] text-[#1D3557]/65 block mt-0.5 font-bold uppercase">{app.desc}</span>
                                    </div>
                                  </div>

                                  <p className="font-body text-xs md:text-sm text-[#1D3557]/80 leading-relaxed max-w-2xl mx-auto">
                                    {app.longDesc}
                                  </p>

                                  {/* Formula Display */}
                                  <div className="w-full max-w-xl mx-auto bg-[#F5F1E8] border border-[#1D3557]/15 p-2 text-center select-all">
                                    <span className="font-display-alt text-[10px] md:text-xs font-bold text-[#E63946]">
                                      🔬 MATH FORMULA: {app.formula}
                                    </span>
                                  </div>

                                  {/* Features List */}
                                  <div className="space-y-1.5 pt-2 text-left max-w-xl mx-auto">
                                    <span className="font-display text-[9px] text-[#1D3557] block font-bold tracking-wider uppercase text-center">★ Target Capabilities:</span>
                                    <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                                      {app.features.map((feat, fidx) => (
                                        <div key={fidx} className="flex items-start gap-1.5 font-body text-[10px] text-[#1D3557]/70 font-semibold leading-snug">
                                          <span className="text-[#E63946] flex-shrink-0 mt-0.5">•</span>
                                          <span>{feat}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Centered Preview Panel */}
                                <div className="w-full max-w-md mx-auto">
                                  <div className="border border-[#1D3557]/20 p-2.5 bg-white shadow-inner relative">
                                    <span className="absolute top-4 right-6 font-display text-[8px] text-[#C5A059] font-bold tracking-widest z-10">SIMULATED SCHEMA</span>
                                    {renderPreview(app.id)}
                                  </div>
                                </div>

                                <div className="pt-2 w-full flex justify-center">
                                  <button
                                    onClick={() => window.changeSTEMApparatus(app.id)}
                                    className="w-full max-w-xs ticket-btn text-[11px] py-2 px-5 flex items-center justify-center gap-2"
                                  >
                                    [ LAUNCH INTERACTIVE WORKSPACE ]
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-center font-body text-[9px] text-[#1D3557]/55 uppercase tracking-widest mt-10 border-t border-dashed border-[#1D3557]/20 pt-4 relative z-10">
                      Select and trigger any laboratory workbench above to run live interactive calculators.
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <>
                {/* 3. CENTRAL WORKBENCH CABINET CHASSIS (Dedicated Separate Page View for the selected apparatus) */}
                <section id="workshop-cabinet" className="max-w-[1440px] mx-auto px-2 sm:px-4 md:px-8 py-16 scroll-mt-20 animate-fadeIn">
                  <div className="thick-frame bg-[#FFFDF0] p-2 sm:p-6 md:p-8 relative">
                    {/* Paper blueprint border watermark */}
                    <div className="absolute inset-2 border-2 border-dashed border-[#1D3557]/15 pointer-events-none" />
                    
                    {/* Return back home ticket */}
                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative z-10 border-b border-dashed border-[#1D3557]/20 pb-4">
                      <button 
                        onClick={() => {
                          if (window.goSTEMHome) {
                            window.goSTEMHome();
                          } else {
                            setCurrentTab('landing');
                          }
                        }}
                        className="ticket-btn text-[10px] py-1.5 px-4 flex items-center gap-2"
                      >
                        [ 🏠 BACK TO DIRECTORY CATALOGUE ]
                      </button>
                      <span className="font-mono text-[8px] sm:text-[9px] text-[#C5A059] font-bold uppercase tracking-widest">★ DEDICATED ATELIER CABINET CHASSIS ACTIVE ★</span>
                    </div>

                    {/* Vintage Cabinet Header banner */}
                    <div className="border-b-4 border-double border-[#1D3557] pb-6 mb-8 text-center relative z-10">
                      <span className="font-display text-xs tracking-widest text-[#E63946] block mb-1">★ APPARATUS VIEWPORT CABINET ★</span>
                      <h2 className="font-display text-xl sm:text-3xl md:text-5xl text-[#1D3557] tracking-wider leading-none">
                        {APPARATUS_LIST.find(a => a.id === activeApparatus)?.name}
                      </h2>
                      <p className="font-body text-xs text-[#E63946] uppercase font-bold tracking-widest mt-2">
                        {APPARATUS_LIST.find(a => a.id === activeApparatus)?.desc}
                      </p>
                      
                      {/* Central Drawer quick switcher tabs */}
                      <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-5xl mx-auto border-t border-dashed border-[#1D3557]/20 pt-4">
                        {APPARATUS_LIST.map((app) => (
                          <button
                            key={app.id}
                            onClick={() => {
                              setActiveApparatus(app.id);
                              window.showAtelierToast(`Loaded ${app.name.substring(3)}`, 'success');
                            }}
                            className={`text-[9px] md:text-[10px] py-1.5 px-2.5 whitespace-nowrap select-none font-body font-bold border transition-all ${
                              activeApparatus === app.id
                                ? 'bg-[#E63946] text-white border-[#E63946] shadow-sm'
                                : 'bg-[#F5F1E8] text-[#1D3557] border-[#1D3557]/30 hover:bg-[#1D3557]/5 hover:border-[#1D3557]'
                            }`}
                          >
                            {app.name.split('. ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* ACTIVE LABORATORY CONTAINER */}
                    <div className="relative z-10 min-h-[500px] overflow-hidden">
                      {(() => {
                        const ActiveComponent = APPARATUS_LIST.find(a => a.id === activeApparatus)?.component;
                        return ActiveComponent ? <ActiveComponent /> : null;
                      })()}
                    </div>
                    
                    {/* Stamped verification footer */}
                    <div className="text-center font-body text-[9px] text-[#1D3557]/70 uppercase tracking-widest mt-8 border-t-2 border-dashed border-[#1D3557]/20 pt-4 relative z-10">
                      APPARATUS UNIT VERIFICATION • SERIAL CALIBRATION COMPLETED
                    </div>
                  </div>
                </section>
              </>
            )}
          </main>
          <Footer />
        </>
      )}

      {/* Custom alert and dialogs remain identical */}
      {alertConfig && alertConfig.show && (
        <div className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-md bg-[#FFFDF0] border-4 double border-[#1D3557] p-6 shadow-2xl relative ticket-btn overflow-visible">
            <div className="absolute top-1/2 -left-3 w-5 h-5 bg-[#1D3557] rounded-full border border-[#FFFDF0]" />
            <div className="absolute top-1/2 -right-3 w-5 h-5 bg-[#1D3557] rounded-full border border-[#FFFDF0]" />
            <div className="flex items-center gap-3 border-b border-dashed border-[#1D3557]/20 pb-3 mb-4">
              {alertConfig.type === 'warning' && <AlertTriangle className="w-5 h-5 text-[#E63946]" />}
              {alertConfig.type === 'alert' && <Info className="w-5 h-5 text-[#1D3557]" />}
              {alertConfig.type === 'confirm' && <Terminal className="w-5 h-5 text-[#C5A059]" />}
              <h3 className="font-display text-lg text-[#1D3557] tracking-wider">{alertConfig.title.toUpperCase()}</h3>
            </div>
            <p className="font-body text-sm text-[#1D3557]/80 leading-relaxed mb-6">
              {alertConfig.message}
            </p>
            <div className="flex justify-end gap-3 pt-2 border-t border-dashed border-[#1D3557]/10">
              {alertConfig.type === 'confirm' ? (
                <>
                  <button 
                    onClick={() => {
                      if (alertConfig.onConfirm) alertConfig.onConfirm();
                      setAlertConfig(null);
                    }}
                    className="ticket-btn text-xs py-1 px-4 bg-[#E63946] text-white"
                  >
                    [ CONFIRM ]
                  </button>
                  <button 
                    onClick={() => setAlertConfig(null)}
                    className="ticket-btn text-xs py-1 px-4 bg-[#1D3557] text-white"
                  >
                    [ CANCEL ]
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setAlertConfig(null)}
                  className="ticket-btn text-xs py-1 px-4 bg-[#1D3557] text-white"
                >
                  [ ACKNOWLEDGE ]
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {toastConfig && toastConfig.show && (
        <div className="fixed bottom-6 right-6 z-[120] animate-slideIn select-none">
          <div className="bg-[#F4ECD8] border-2 border-[#C5A059] p-4 shadow-xl max-w-sm flex items-center gap-3 relative ticket-btn overflow-visible">
            {toastConfig.type === 'success' && <Check className="w-5 h-5 text-green-700 flex-shrink-0" />}
            {toastConfig.type === 'warning' && <AlertTriangle className="w-5 h-5 text-[#E63946] flex-shrink-0" />}
            {toastConfig.type === 'info' && <Info className="w-5 h-5 text-[#1D3557] flex-shrink-0" />}
            
            <p className="font-body text-xs font-bold text-[#332211] leading-normal pr-4">
              {toastConfig.message}
            </p>

            <button 
              onClick={() => setToastConfig(null)}
              className="absolute top-1 right-2 text-[#332211]/50 hover:text-[#332211]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {contextMenu.show && (
        <div 
          className="fixed z-[150] bg-[#FFFDF0] border-3 border-[#1D3557] p-2 shadow-2xl select-none"
          style={{ 
            left: `${contextMenu.x}px`, 
            top: `${contextMenu.y}px`,
            boxShadow: '6px 6px 0px #E63946'
          }}
        >
          <div className="border-b border-dashed border-[#1D3557]/20 pb-1.5 mb-1.5 px-3">
            <span className="font-display text-[9px] text-[#E63946] font-bold block leading-none">★ APPARATUS UTILITY ★</span>
            <span className="font-body text-[10px] text-[#1D3557]/70 uppercase font-bold tracking-widest block">WORKBENCH PROTOCOL</span>
          </div>

          <div className="flex flex-col space-y-1">
            <button 
              onClick={() => handleContextAction('wipe')}
              className="text-left font-body text-xs font-bold text-[#1D3557] hover:bg-[#E63946]/5 hover:text-[#E63946] py-1 px-3 border border-transparent hover:border-[#E63946]/20 transition-all"
            >
              🧹 Wipe All Counters
            </button>
            <button 
              onClick={() => handleContextAction('randomize')}
              className="text-left font-body text-xs font-bold text-[#1D3557] hover:bg-[#E63946]/5 hover:text-[#E63946] py-1 px-3 border border-transparent hover:border-[#E63946]/20 transition-all"
            >
              🎲 Randomize Active Lab
            </button>
            <button 
              onClick={() => handleContextAction('calibrate')}
              className="text-left font-body text-xs font-bold text-[#1D3557] hover:bg-[#E63946]/5 hover:text-[#E63946] py-1 px-3 border border-transparent hover:border-[#E63946]/20 transition-all"
            >
              ⚛ Re-Calibrate System
            </button>
            <div className="h-[1px] bg-dashed border-b border-[#1D3557]/15 my-1" />
            <button 
              onClick={() => { setActiveManifestoTab('about'); setContextMenu(p=>({...p, show:false})); }}
              className="text-left font-body text-xs font-bold text-[#1D3557] hover:bg-[#E63946]/5 hover:text-[#E63946] py-1 px-3 border border-transparent hover:border-[#E63946]/20 transition-all"
            >
              📜 Read Project Manifesto
            </button>
            <button 
              onClick={() => handleContextAction('export')}
              className="text-left font-body text-xs font-bold text-[#1D3557] hover:bg-[#E63946]/5 hover:text-[#E63946] py-1 px-3 border border-transparent hover:border-[#E63946]/20 transition-all"
            >
              💾 Export State (JSON)
            </button>
            <button 
              onClick={() => handleContextAction('diagnostic')}
              className="text-left font-body text-xs font-bold text-[#1D3557] hover:bg-[#E63946]/5 hover:text-[#E63946] py-1 px-3 border border-transparent hover:border-[#E63946]/20 transition-all"
            >
              📝 Copy Diagnostic Report
            </button>
          </div>
        </div>
      )}

      {activeManifestoTab && (
        <div className="fixed inset-0 z-[200] bg-black/55 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-3xl bg-[#FFFDF0] border-4 double border-[#1D3557] p-8 shadow-2xl relative flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto animate-fadeIn">
            
            <button 
              onClick={() => setActiveManifestoTab(null)}
              className="absolute top-3 right-3 text-[#1D3557] hover:text-[#E63946]"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex flex-row md:flex-col gap-2 border-b md:border-b-0 md:border-r border-dashed border-[#1D3557]/20 pb-4 md:pb-0 md:pr-4 min-w-[160px]">
              <span className="hidden md:block font-display text-sm text-[#E63946] tracking-widest mb-4">★ MENU DELEGATE ★</span>
              {[
                { key: 'about', label: 'I. ABOUT LAB', icon: Terminal },
                { key: 'privacy', label: 'II. PRIVACY LEDGER', icon: Shield },
                { key: 'terms', label: 'III. DIRECT T&C', icon: FileText },
                { key: 'pricing', label: 'IV. PRICING FREE', icon: Gift },
                { key: 'open-source', label: 'V. OPEN SOURCE', icon: Award }
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveManifestoTab(item.key as any)}
                    className={`text-left font-body text-xs font-bold py-2 px-3 flex items-center gap-2 transition-all ${
                      activeManifestoTab === item.key 
                        ? 'bg-[#1D3557] text-[#FFFDF0]' 
                        : 'text-[#1D3557] hover:bg-[#E63946]/5 hover:text-[#E63946]'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 space-y-4 font-body select-text">
              
              {activeManifestoTab === 'about' && (
                <div className="space-y-4 animate-fadeIn">
                  <h3 className="font-display text-2xl text-[#1D3557]">I. PROJECT MANIFESTO & ABOUT</h3>
                  <div className="line-separator" style={{ margin: '1rem 0' }} />
                  <p className="text-sm text-[#1D3557]/80 leading-relaxed">
                    Welcome to the **STEM Workshop**. This is my individual, solo student project crafted to merge 1950s atomic drafting aesthetics with client-side scientific computations.
                  </p>
                  <p className="text-sm text-[#1D3557]/80 leading-relaxed">
                    I believe that educational tools do not have to look like grey, uninspired standard spreadsheets. By packaging core matrices operations, Newtonian gas solvers, stoich balancers, and box plot algorithms inside a highly curated retro diner visual framework, I hope to make physical calculations feel tactile, mechanical, and satisfying.
                  </p>
                  <p className="text-xs text-[#E63946] italic font-bold">
                    Designed, compiled, and calibrated by me as a solo creator.
                  </p>
                </div>
              )}

              {activeManifestoTab === 'privacy' && (
                <div className="space-y-4 animate-fadeIn">
                  <h3 className="font-display text-2xl text-[#1D3557]">II. PRIVACY LEDGER (DIRECT POLICY)</h3>
                  <div className="line-separator" style={{ margin: '1rem 0' }} />
                  
                  <div className="bg-[#FFFDF0] border-2 border-dashed border-[#E63946]/30 p-4 text-[#1D3557]">
                    <span className="font-display text-xs text-[#E63946] block mb-2">★ 100% PRIVATE POLICY GUARANTEE ★</span>
                    <ul className="list-disc list-inside text-xs space-y-2 text-[#1D3557]/80">
                      <li><strong>Zero Data Collection</strong>: I do not collect, capture, or transmit any inputs you enter.</li>
                      <li><strong>Local Processing</strong>: 100% of calculations (fraction reduction, derivatives, std dev) run entirely in your local browser sandbox.</li>
                      <li><strong>No Third-Party Telemetry</strong>: No Google Analytics, no tracking cookies, no server databases, and no hidden scripts.</li>
                      <li><strong>Local Caching</strong>: I use LocalStorage strictly so that your matrices and equation configs remain in place when you refresh.</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeManifestoTab === 'terms' && (
                <div className="space-y-4 animate-fadeIn">
                  <h3 className="font-display text-2xl text-[#1D3557]">III. DIRECT TERMS & CONDITIONS</h3>
                  <div className="line-separator" style={{ margin: '1rem 0' }} />
                  <p className="text-sm text-[#1D3557]/80 leading-relaxed">
                    This workshop is designed as a student project. You are completely free to study, copy, share, or run these diagnostic tools for your homework, classes, or hobby engineering.
                  </p>
                  <div className="bg-red-50 border border-red-300 p-4 text-red-700 text-xs rounded-sm space-y-2 leading-relaxed">
                    <span className="font-display text-xs font-bold block mb-1">⚠️ PHYSICAL OPERATIONS WARPING DISCLAIMER:</span>
                    Since I am an individual student, this platform is provided "as-is". Please do not use it to calibrate rocket trajectories, construct real-world suspension bridges, or mix volatile compounds without cross-referencing your calculations elsewhere! I am not responsible for mathematical singularities, physical collapses, or molecular accidents.
                  </div>
                </div>
              )}

              {activeManifestoTab === 'pricing' && (
                <div className="space-y-4 animate-fadeIn">
                  <h3 className="font-display text-2xl text-[#1D3557]">IV. PRICING STATUS: 100% FREE FOREVER</h3>
                  <div className="line-separator" style={{ margin: '1rem 0' }} />
                  <div className="border-4 double border-[#1D3557] bg-[#FFFDF0] p-6 text-center select-none">
                    <span className="font-display text-5xl text-[#E63946] block mb-2">FREE</span>
                    <span className="font-display-alt text-sm text-[#1D3557] tracking-widest block font-bold">COMPLETELY FREE FOREVER</span>
                  </div>
                  <p className="text-sm text-[#1D3557]/80 leading-relaxed text-center mt-2">
                    No ads, no paid premium features, no corporate limits. Just a pure atomic workshop calibrated for students and teachers.
                  </p>
                </div>
              )}

              {activeManifestoTab === 'open-source' && (
                <div className="space-y-4 animate-fadeIn">
                  <h3 className="font-display text-2xl text-[#1D3557]">V. MIT OPEN SOURCE LICENSE</h3>
                  <div className="line-separator" style={{ margin: '1rem 0' }} />
                  <p className="text-sm text-[#1D3557]/80 leading-relaxed">
                    The source code is fully open-source, forkable, and peer-reviewable under the permissive **MIT License**.
                  </p>
                  
                  <div className="relative bg-[#F4ECD8] border-2 border-dashed border-[#1D3557]/40 p-6 shadow-inner text-[#1D3557] font-body text-xs whitespace-pre-wrap select-text overflow-hidden rounded-sm">
                    <div className="absolute -top-4 -right-4 w-28 h-28 border-4 double border-[#E63946]/20 text-[#E63946]/20 flex items-center justify-center font-display text-[9px] font-bold uppercase tracking-widest rotate-[15deg] rounded-full pointer-events-none select-none">
                      VERIFIED OPEN
                    </div>
                    
                    <div className="absolute top-2 right-2 border border-[#E63946] text-[#E63946] font-display text-[7px] font-bold py-0.5 px-1.5 uppercase rotate-[6deg] pointer-events-none select-none">
                      MIT PROTOCOL v1956
                    </div>

                    <div className="font-mono leading-relaxed max-h-[220px] overflow-y-auto pr-2">
{`MIT LICENSE

Copyright (c) 2026 STEM WORKSHOP OWNER

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`}
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default App;
