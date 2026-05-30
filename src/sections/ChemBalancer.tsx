import { useState, useEffect, useRef } from 'react';
import { FlaskConical, AlertTriangle, Layers } from 'lucide-react';

// Exact fraction logic module for precise coefficients
class Fraction {
  num: number;
  den: number;

  constructor(num: number, den: number = 1) {
    if (den === 0) throw new Error("Zero denominator is infinite!");
    const g = Fraction.gcd(Math.abs(num), Math.abs(den));
    const sign = (num * den < 0) ? -1 : 1;
    this.num = sign * Math.abs(num) / g;
    this.den = Math.abs(den) / g;
  }

  static gcd(a: number, b: number): number {
    return b ? Fraction.gcd(b, a % b) : a;
  }

  add(other: Fraction): Fraction {
    return new Fraction(this.num * other.den + other.num * this.den, this.den * other.den);
  }

  sub(other: Fraction): Fraction {
    return new Fraction(this.num * other.den - other.num * this.den, this.den * other.den);
  }

  mul(other: Fraction): Fraction {
    return new Fraction(this.num * other.num, this.den * other.den);
  }

  div(other: Fraction): Fraction {
    return new Fraction(this.num * other.den, this.den * other.num);
  }

  isZero(): boolean {
    return this.num === 0;
  }
}

const lcm = (a: number, b: number): number => {
  return (a * b) / Fraction.gcd(a, b);
};

// Periodic Table Weights
const ATOMIC_WEIGHTS: { [key: string]: number } = {
  H: 1.008, He: 4.0026, Li: 6.94, Be: 9.0122, B: 10.81, C: 12.011, N: 14.007, O: 15.999, F: 18.998, Ne: 20.180,
  Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974, S: 32.06, Cl: 35.45, Ar: 39.948, K: 39.098, Ca: 40.078,
  Cr: 51.996, Mn: 54.938, Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546, Zn: 65.38, Ag: 107.87, I: 126.90, Au: 196.97, Pb: 207.2
};

const ATOMIC_COLORS: { [key: string]: string } = {
  H: '#FFFFFF', // White
  C: '#808080', // Grey
  O: '#FF0000', // Red
  N: '#0000FF', // Blue
  S: '#FFFF00', // Yellow
  Cl: '#00FF00', // Green
  Fe: '#D2691E', // Orange-brown
  Al: '#C0C0C0', // Silver
  Na: '#8A2BE2' // Purple
};

const parseChemicalCompound = (formula: string): { [key: string]: number } => {
  let i = 0;

  const parseGroup = (): { [key: string]: number } => {
    const groupCounts: { [key: string]: number } = {};
    while (i < formula.length) {
      if (formula[i] === ')') {
        i++; // consume ')'
        break;
      }
      if (formula[i] === '(') {
        i++; // consume '('
        const sub = parseGroup();
        
        let multStr = '';
        while (i < formula.length && /[0-9]/.test(formula[i])) {
          multStr += formula[i];
          i++;
        }
        const mult = multStr === '' ? 1 : parseInt(multStr);
        
        Object.keys(sub).forEach(el => {
          groupCounts[el] = (groupCounts[el] || 0) + sub[el] * mult;
        });
      } else {
        const match = formula.substring(i).match(/^([A-Z][a-z]*)/);
        if (!match) {
          i++; // skip
          continue;
        }
        const el = match[1];
        i += el.length;
        
        let countStr = '';
        while (i < formula.length && /[0-9]/.test(formula[i])) {
          countStr += formula[i];
          i++;
        }
        const count = countStr === '' ? 1 : parseInt(countStr);
        groupCounts[el] = (groupCounts[el] || 0) + count;
      }
    }
    return groupCounts;
  };

  return parseGroup();
};

const getMolarMass = (atoms: { [key: string]: number }): number => {
  let mass = 0;
  Object.keys(atoms).forEach(el => {
    const wt = ATOMIC_WEIGHTS[el] || 12.0; // Default to Carbon if not found
    mass += atoms[el] * wt;
  });
  return mass;
};

interface CompoundInfo {
  formula: string;
  atoms: { [key: string]: number };
  molarMass: number;
  coeff?: number;
}

const ChemBalancer = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [eqInput, setEqInput] = useState<string>('C2H5OH + O2 -> CO2 + H2O');
  const [reactants, setReactants] = useState<CompoundInfo[]>([]);
  const [products, setProducts] = useState<CompoundInfo[]>([]);
  const [coefficients, setCoefficients] = useState<number[]>([]);
  
  // Stoichiometry State
  const [selectedCompIdx, setSelectedCompIdx] = useState<number>(0); // Index in the allCompounds list
  const [inputMass, setInputMass] = useState<string>('46.0');

  const [logOutput, setLogOutput] = useState<string>('');
  const [errorBox, setErrorBox] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    const elements = sectionRef.current?.querySelectorAll('.scroll-reveal');
    elements?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const loadPreset = (preset: string) => {
    setErrorBox(null);
    if (preset === 'ethanol') setEqInput('C2H5OH + O2 -> CO2 + H2O');
    else if (preset === 'photosynthesis') setEqInput('CO2 + H2O -> C6H12O6 + O2');
    else if (preset === 'rust') setEqInput('Fe + O2 -> Fe2O3');
    else if (preset === 'acid') setEqInput('Al + H2SO4 -> Al2(SO4)3 + H2');
  };

  const balanceReaction = () => {
    setErrorBox(null);
    setCoefficients([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (eqInput.trim() === '') {
      setLogOutput('Waiting for chemical formula input sequence.');
      return;
    }

    try {
      const sides = eqInput.split(/->|→|=/);
      if (sides.length !== 2) {
        throw new Error("Equation must contain exactly one separator, e.g., '->' or '='.");
      }

      const reactantsRaw = sides[0].split('+').map(s => s.trim()).filter(s => s !== '');
      const productsRaw = sides[1].split('+').map(s => s.trim()).filter(s => s !== '');

      if (reactantsRaw.length === 0 || productsRaw.length === 0) {
        throw new Error('Reactants and products must contain molecular compounds.');
      }

      const parsedReactants = reactantsRaw.map(formula => {
        const atoms = parseChemicalCompound(formula);
        return { formula, atoms, molarMass: getMolarMass(atoms) };
      });

      const parsedProducts = productsRaw.map(formula => {
        const atoms = parseChemicalCompound(formula);
        return { formula, atoms, molarMass: getMolarMass(atoms) };
      });

      const allCompounds = [...parsedReactants, ...parsedProducts];
      const N = allCompounds.length;

      // Unique elements
      const elementsSet = new Set<string>();
      allCompounds.forEach(c => Object.keys(c.atoms).forEach(el => elementsSet.add(el)));
      const uniqueElements = Array.from(elementsSet);
      const M = uniqueElements.length;

      if (M === 0) throw new Error('No chemical elements found.');

      // Stoichiometric Matrix
      const A = Array.from({ length: M }, () => Array(N).fill(0));
      for (let r = 0; r < M; r++) {
        const element = uniqueElements[r];
        for (let c = 0; c < N; c++) {
          const comp = allCompounds[c];
          const count = comp.atoms[element] || 0;
          A[r][c] = c < parsedReactants.length ? count : -count;
        }
      }

      // Gauss-Jordan fraction reductions
      const FracA = A.map(row => row.map(val => new Fraction(val)));
      let pivotRow = 0;
      const pivotCols: number[] = [];

      for (let col = 0; col < N && pivotRow < M; col++) {
        let pr = pivotRow;
        while (pr < M && FracA[pr][col].isZero()) pr++;
        if (pr === M) continue; // free variable

        // Swap
        const temp = FracA[pivotRow];
        FracA[pivotRow] = FracA[pr];
        FracA[pr] = temp;

        const pivotVal = FracA[pivotRow][col];
        for (let c = col; c < N; c++) {
          FracA[pivotRow][c] = FracA[pivotRow][c].div(pivotVal);
        }

        for (let r = 0; r < M; r++) {
          if (r !== pivotRow && !FracA[r][col].isZero()) {
            const factor = FracA[r][col];
            for (let c = col; c < N; c++) {
              FracA[r][c] = FracA[r][c].sub(factor.mul(FracA[pivotRow][c]));
            }
          }
        }
        pivotCols.push(col);
        pivotRow++;
      }

      const isPivot = Array(N).fill(false);
      pivotCols.forEach(c => isPivot[c] = true);

      const freeVars: number[] = [];
      for (let c = 0; c < N; c++) {
        if (!isPivot[c]) freeVars.push(c);
      }

      if (freeVars.length === 0) {
        throw new Error('Equation has no free variables. Singular reaction system.');
      }

      // Let free variables equal Fraction(1)
      const solution: Fraction[] = Array(N);
      freeVars.forEach(v => {
        solution[v] = new Fraction(1);
      });

      for (let i = 0; i < pivotCols.length; i++) {
        const pCol = pivotCols[i];
        let sum = new Fraction(0);
        for (let c = 0; c < N; c++) {
          if (!isPivot[c]) {
            sum = sum.add(FracA[i][c].mul(solution[c]));
          }
        }
        solution[pCol] = new Fraction(0).sub(sum);
      }

      // Check coefficients validity
      if (solution.some(frac => frac.num <= 0)) {
        throw new Error('Equation balance failed. No non-trivial positive coefficients exist.');
      }

      let commonLCM = 1;
      solution.forEach(frac => {
        commonLCM = lcm(commonLCM, frac.den);
      });

      const coeffs = solution.map(frac => frac.num * (commonLCM / frac.den));
      
      setReactants(parsedReactants.map((r, idx) => ({ ...r, coeff: coeffs[idx] })));
      setProducts(parsedProducts.map((p, idx) => ({ ...p, coeff: coeffs[parsedReactants.length + idx] })));
      setCoefficients(coeffs);
      setSelectedCompIdx(0); // reset target

      // Draw SVG/Canvas molecular schematic
      drawMolecularApparatus(parsedReactants, parsedProducts, coeffs);

      // Print initial log
      let log = `CALCULATION LEDGER PRINTER -- STOICHIOMETRIC BALANCES\n`;
      log += `------------------------------------------------------------\n`;
      log += `Reactants parsed: ${parsedReactants.length}\n`;
      log += `Products parsed:  ${parsedProducts.length}\n`;
      log += `Unique elements:  ${uniqueElements.join(', ')} (tracked M = ${M})\n\n`;
      log += `BALANCED EQUATION COUPLING COEFFICIENTS:\n  `;

      const balancedR = parsedReactants.map((r, i) => `${coeffs[i] === 1 ? '' : coeffs[i]} ${r.formula}`);
      const balancedP = parsedProducts.map((p, i) => `${coeffs[parsedReactants.length + i] === 1 ? '' : coeffs[parsedReactants.length + i]} ${p.formula}`);
      log += `${balancedR.join(' + ')} ➔ ${balancedP.join(' + ')}\n\n`;

      log += `ATOM VERIFICATION REGISTER:\n`;
      uniqueElements.forEach(element => {
        let rSum = 0;
        for (let i = 0; i < parsedReactants.length; i++) {
          rSum += coeffs[i] * (parsedReactants[i].atoms[element] || 0);
        }
        let pSum = 0;
        for (let i = 0; i < parsedProducts.length; i++) {
          pSum += coeffs[parsedReactants.length + i] * (parsedProducts[i].atoms[element] || 0);
        }
        log += `  - [${element.padEnd(2)}] Reactants: ${String(rSum).padEnd(3)} | Products: ${String(pSum).padEnd(3)}  ${rSum === pSum ? '(BALANCED)' : '(FAULT)'}\n`;
      });

      setLogOutput(log);

    } catch (e: any) {
      setErrorBox(`🚨 BALANCER FAULT:\n${e.message}`);
      setLogOutput('BALANCING ENGINE REJECTED THE REACTION MECHANICS.');
    }
  };

  const calculateStoichiometry = () => {
    if (coefficients.length === 0) return;
    const allComps = [...reactants, ...products];
    const targetComp = allComps[selectedCompIdx];
    const targetCoeff = coefficients[selectedCompIdx];
    const targetMass = parseFloat(inputMass) || 0;

    if (targetMass <= 0) return;

    const moles = targetMass / targetComp.molarMass;
    const baseMolesScale = moles / targetCoeff;

    const stoich = allComps.map((comp, idx) => {
      const coeff = coefficients[idx];
      const compMoles = baseMolesScale * coeff;
      const compMass = compMoles * comp.molarMass;
      return {
        formula: comp.formula,
        coeff,
        molarMass: comp.molarMass,
        moles: compMoles,
        mass: compMass,
        role: idx < reactants.length ? 'Reactant' : 'Product'
      };
    });

    // Removed unused setStoichTable(stoich)

    let log = logOutput.split('STOICHIOMETRIC LEDGER DISTRIBUTION')[0];
    log += `STOICHIOMETRIC LEDGER DISTRIBUTION -- REF VALUE: ${targetMass.toFixed(2)}g ${targetComp.formula}\n`;
    log += `------------------------------------------------------------\n`;
    log += `Isolating molar balance ratio based on target compound moles n = ${moles.toFixed(4)} mol:\n\n`;
    
    stoich.forEach(item => {
      log += `  - ${item.role.padEnd(8)}: ${item.coeff} ${item.formula.padEnd(10)} | Molar Mass: ${item.molarMass.toFixed(2).padStart(6)} g/mol | Moles: ${item.moles.toFixed(4).padStart(8)} mol | Mass: ${item.mass.toFixed(2).padStart(8)} g\n`;
    });

    setLogOutput(log);
  };

  useEffect(() => {
    if (coefficients.length > 0) {
      calculateStoichiometry();
    }
  }, [selectedCompIdx, inputMass, coefficients]);

  // Visual molecular drafting sketch on blueprint
  const drawMolecularApparatus = (react: CompoundInfo[], prod: CompoundInfo[], coeffs: number[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Grid background
    ctx.strokeStyle = 'rgba(0, 40, 104, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 20; x < canvas.width; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 20; y < canvas.height; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Centered separator arrow
    ctx.strokeStyle = 'var(--color-navy)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 20, canvas.height / 2);
    ctx.lineTo(canvas.width / 2 + 20, canvas.height / 2);
    ctx.lineTo(canvas.width / 2 + 10, canvas.height / 2 - 10);
    ctx.moveTo(canvas.width / 2 + 20, canvas.height / 2);
    ctx.lineTo(canvas.width / 2 + 10, canvas.height / 2 + 10);
    ctx.stroke();

    ctx.fillStyle = '#002868';
    ctx.font = 'italic 12px "Courier Prime", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STABLE REACTION EQUILIBRIUM', canvas.width / 2, canvas.height / 2 - 20);

    const drawMoleculesColumn = (comps: CompoundInfo[], sideCoeffs: number[], startX: number) => {
      const stepY = canvas.height / (comps.length + 1);
      
      comps.forEach((comp, idx) => {
        const cy = stepY * (idx + 1);
        const cx = startX;
        const count = sideCoeffs[idx];

        // Draw compound label and count badge
        ctx.fillStyle = 'var(--color-navy)';
        ctx.font = 'bold 12px "Special Elite", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${count === 1 ? '' : count} ${comp.formula}`, cx, cy + 45);

        // Render atoms circles sketch
        const atomList = Object.keys(comp.atoms);
        let atomIdx = 0;
        const totalAtomsCount = atomList.reduce((acc, el) => acc + comp.atoms[el], 0);

        // Radius based on count to keep inside boundaries
        const radius = totalAtomsCount > 10 ? 8 : (totalAtomsCount > 5 ? 12 : 16);
        const radiusBonds = radius * 1.5;

        // Draw atoms as connected cluster

        atomList.forEach(el => {
          const elCount = comp.atoms[el];
          const color = ATOMIC_COLORS[el] || '#8A2BE2';

          for (let j = 0; j < elCount; j++) {
            const angle = (atomIdx / totalAtomsCount) * 2 * Math.PI;
            const px = cx + radiusBonds * Math.cos(angle);
            const py = cy + radiusBonds * Math.sin(angle);

            // Bond line to center or old atom
            ctx.strokeStyle = 'var(--color-navy)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(px, py);
            ctx.stroke();

            // Atom Circle
            ctx.fillStyle = color;
            ctx.strokeStyle = 'var(--color-navy)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(px, py, radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

            // Element Label
            ctx.fillStyle = color === '#FFFFFF' ? '#0D0D0D' : '#FFFFFF';
            ctx.font = `bold ${radius > 10 ? '9' : '11'}px "Courier Prime", monospace`;
            ctx.fillText(el, px, py + (radius > 10 ? 3 : 4));

            atomIdx++;
          }
        });

        // Small central core bond node
        ctx.fillStyle = '#002868';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    };

    drawMoleculesColumn(react, coeffs.slice(0, react.length), canvas.width / 4);
    drawMoleculesColumn(prod, coeffs.slice(react.length), (3 * canvas.width) / 4);
  };

  const wipeLabCounter = () => {
    setEqInput('');
    setReactants([]);
    setProducts([]);
    setCoefficients([]);
    setErrorBox(null);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setLogOutput('STOICHIOMETRIC LAB COUNTER WIPE COMPLETED.');
  };

  return (
    <div 
      ref={sectionRef}
      className="w-full py-4 space-y-6"
      id="chem-balancer"
    >
      <div className="relative">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Configurations & Presets */}
          <div className="space-y-8">
            <div className="scroll-reveal">
              <span className="geo-block-red text-sm tracking-widest inline-flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                LABORATORY APPARATUS MODULE III
              </span>
            </div>

            <div className="scroll-reveal" style={{ transitionDelay: '0.1s' }}>
              <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl text-[#1D3557] leading-tight mb-2">
                CHEMICAL REACTION BALANCER
              </h2>
              <p className="font-body text-md text-[#1D3557]/70 italic uppercase tracking-wider">
                GAUSS-JORDAN LINEAR DIOPHANTINE SOLVER
              </p>
              <div className="line-separator max-w-sm mt-4" />
            </div>

            <div className="scroll-reveal vintage-menu-card p-3 sm:p-6" style={{ transitionDelay: '0.2s' }}>
              
              <div className="border-b-2 dashed border-[#1D3557]/20 pb-4 mb-6">
                <span className="font-display text-lg text-[#1D3557] flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-[#E63946]" />
                  REACTION EQUILIBRIUM FORMULA
                </span>
              </div>

              {/* Reaction Input */}
              <div className="mb-6">
                <label className="font-body text-xs font-bold text-[#1D3557] block mb-2">INPUT UNBALANCED CHEMICAL EQUATION:</label>
                <input 
                  type="text" 
                  value={eqInput}
                  onChange={(e) => setEqInput(e.target.value)}
                  placeholder="e.g., C2H5OH + O2 -> CO2 + H2O"
                  className="w-full input-vintage text-md font-bold bg-[#F5F1E8] border-2 border-[#1D3557] py-2 px-3 focus:outline-none focus:border-[#E63946] transition-all"
                />
                <span className="font-body text-[10px] text-[#1D3557]/60 block mt-2 leading-relaxed">
                  Supports parenthesis and standard notations. e.g., <code>{"Al + H2SO4 ➔ Al2(SO4)3 + H2"}</code>
                </span>
              </div>

              {/* Presets */}
              <div className="mb-6">
                <label className="font-body text-xs font-bold text-[#1D3557] block mb-2">APPARATUS CALIBRATION PRESETS:</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => loadPreset('ethanol')} className="ticket-btn text-[10px] py-1 px-2.5">Ethanol Combustion</button>
                  <button onClick={() => loadPreset('photosynthesis')} className="ticket-btn text-[10px] py-1 px-2.5">Photosynthesis</button>
                  <button onClick={() => loadPreset('rust')} className="ticket-btn text-[10px] py-1 px-2.5">Rusting Steel</button>
                  <button onClick={() => loadPreset('acid')} className="ticket-btn text-[10px] py-1 px-2.5">Acid-Metal Reaction</button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 border-t border-dashed border-[#1D3557]/10 pt-4 mb-6">
                <button 
                  onClick={balanceReaction}
                  className="ticket-btn flex-1 bg-[#E63946] text-white hover:bg-[#1D3557] font-bold text-xs py-2.5 px-4 flex items-center justify-center gap-1.5"
                >
                  <FlaskConical className="w-4 h-4" />
                  COMPUTE MASS BALANCE
                </button>
                <button 
                  onClick={wipeLabCounter}
                  className="ticket-btn bg-[#1D3557] text-white hover:bg-red-800 font-bold text-xs py-2.5 px-4"
                >
                  WIPE COUNTER
                </button>
              </div>

              {/* Stoichiometry Mass Controller */}
              {coefficients.length > 0 && (
                <div className="border-t-2 dashed border-[#1D3557]/10 pt-6 animate-fadeIn">
                  <span className="font-display text-md text-[#E63946] block mb-4">IV. STOICHIOMETRIC CALCULATOR APPARATUS</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="font-body text-xs font-bold text-[#1D3557] block mb-2">REFERENCE SPECIES:</label>
                      <select
                        value={selectedCompIdx}
                        onChange={(e) => setSelectedCompIdx(parseInt(e.target.value))}
                        className="w-full font-body text-xs font-bold bg-[#F5F1E8] border border-[#1D3557] py-1.5 px-2 focus:outline-none focus:border-[#E63946]"
                      >
                        {[...reactants, ...products].map((comp, idx) => (
                          <option key={idx} value={idx}>
                            {coefficients[idx]} {comp.formula} ({comp.molarMass.toFixed(1)} g/mol)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-body text-xs font-bold text-[#1D3557] block mb-2">INPUT MASS (grams):</label>
                      <input
                        type="number"
                        value={inputMass}
                        onChange={(e) => setInputMass(e.target.value)}
                        className="w-full input-vintage text-xs font-bold bg-transparent border-b-2 border-[#1D3557]/30 focus:border-[#E63946] py-1 px-2 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Right Column: Molecular schematic plot and printouts */}
          <div className="space-y-6 w-full lg:mt-8">
            <div className="scroll-reveal vintage-menu-card p-3 sm:p-6" style={{ transitionDelay: '0.3s' }}>
              
              <div className="border-b-2 dashed border-[#1D3557]/20 pb-4 mb-4">
                <span className="font-display text-lg text-[#1D3557] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#E63946]" />
                  ATOMIC APPARATUS COUPLINGS SKETCH
                </span>
              </div>

              {/* molecular blueprint canvas */}
              <div className="bg-[#F4ECD8] border-2 border-[#C5A059] p-2 sm:p-3 shadow-inner rounded-sm overflow-x-auto w-full">
                <canvas 
                  ref={canvasRef} 
                  width="420" 
                  height="220" 
                  className="block bg-[#F4ECD8] border border-[#C5A059]/40 w-full min-h-[200px] sm:min-h-[260px]"
                />
              </div>

              {/* Error Box */}
              {errorBox && (
                <div className="error-ticket mt-4 bg-red-50 border border-red-300 text-red-700 p-3 font-body text-xs flex gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <div className="font-bold leading-relaxed">{errorBox}</div>
                </div>
              )}

              {/* Separator log paper */}
              <div className="relative mt-4">
                <span className="absolute top-2 right-4 font-display text-[9px] text-[#C5A059] font-bold tracking-widest z-10">STOICHIOMETRIC SHEET</span>
                <pre className="w-full text-xs bg-[#F4ECD8] text-[#332211] font-body p-5 border-2 border-[#C5A059] rounded-sm max-h-[300px] overflow-y-auto shadow-inner leading-relaxed whitespace-pre-wrap">
                  {logOutput || 'CHEMICAL BALANCER SUBSYSTEM ONLINE. ENTER AN EQUATION TO BEGIN MASS BALANCING.'}
                </pre>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ChemBalancer;
