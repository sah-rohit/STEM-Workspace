import { useState, useEffect, useRef } from 'react';
import { Beaker, Check, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';

interface UnitMap {
  [key: string]: number; // value * multiplier = SI unit
}

interface VariableSpec {
  label: string;
  unitSI: string;
  units: UnitMap;
}

interface FormulaSpec {
  title: string;
  desc: string;
  vars: { [key: string]: VariableSpec };
  solve: (vals: { [key: string]: number | null }) => any;
}

const solverFormulas: { [key: string]: FormulaSpec } = {
  fma: {
    title: "Force Balance Equation: F = m * a",
    desc: "Newton's Second Law of Motion. Calculates force from mass and acceleration.",
    vars: {
      F: { label: "Force (F)", unitSI: "N", units: { "N (Newtons)": 1, "kN (kiloNewtons)": 1000, "lbf (pounds-force)": 4.44822 } },
      m: { label: "Mass (m)", unitSI: "kg", units: { "kg (kilograms)": 1, "g (grams)": 0.001, "lb (pounds-mass)": 0.453592, "slugs": 14.5939 } },
      a: { label: "Acceleration (a)", unitSI: "m/s²", units: { "m/s²": 1, "ft/s²": 0.3048, "g-force": 9.80665 } }
    },
    solve: (vals) => {
      if (vals.F === null) return { F: (vals.m ?? 0) * (vals.a ?? 0) };
      if (vals.m === null) {
        if (Math.abs(vals.a ?? 0) < 1e-9) throw new Error("DIVIDE BY ZERO: Acceleration is zero! Cannot isolate Mass.");
        return { m: (vals.F ?? 0) / (vals.a ?? 1) };
      }
      if (vals.a === null) {
        if (Math.abs(vals.m ?? 0) < 1e-9) throw new Error("DIVIDE BY ZERO: Mass is zero! Cannot isolate Acceleration.");
        return { a: (vals.F ?? 0) / (vals.m ?? 1) };
      }
      return {};
    }
  },
  kinematics: {
    title: "Kinematics: v² = u² + 2 * a * s",
    desc: "Constant acceleration motion. Links velocities, acceleration, and displacement.",
    vars: {
      v: { label: "Final Velocity (v)", unitSI: "m/s", units: { "m/s": 1, "km/h": 1/3.6, "mph": 0.44704, "ft/s": 0.3048 } },
      u: { label: "Initial Velocity (u)", unitSI: "m/s", units: { "m/s": 1, "km/h": 1/3.6, "mph": 0.44704, "ft/s": 0.3048 } },
      a: { label: "Acceleration (a)", unitSI: "m/s²", units: { "m/s²": 1, "ft/s²": 0.3048 } },
      s: { label: "Displacement (s)", unitSI: "m", units: { "m (meters)": 1, "ft (feet)": 0.3048, "cm (centimeters)": 0.01, "km (kilometers)": 1000, "miles": 1609.34 } }
    },
    solve: (vals) => {
      const u = vals.u ?? 0;
      const a = vals.a ?? 0;
      const s = vals.s ?? 0;
      const v = vals.v ?? 0;

      if (vals.v === null) {
        const sq = u * u + 2 * a * s;
        if (sq < 0) throw new Error("IMAGINARY VELOCITY ERROR: Root of negative scalar is imaginary!");
        return { v: Math.sqrt(sq) };
      }
      if (vals.u === null) {
        const sq = v * v - 2 * a * s;
        if (sq < 0) throw new Error("IMAGINARY VELOCITY ERROR: Root of negative scalar is imaginary! (v² - 2as < 0)");
        return { u: Math.sqrt(sq) };
      }
      if (vals.a === null) {
        if (Math.abs(s) < 1e-9) throw new Error("DIVIDE BY ZERO: Displacement s is zero! Cannot isolate Acceleration.");
        return { a: (v * v - u * u) / (2 * s) };
      }
      if (vals.s === null) {
        if (Math.abs(a) < 1e-9) throw new Error("DIVIDE BY ZERO: Acceleration a is zero! Cannot isolate Displacement.");
        return { s: (v * v - u * u) / (2 * a) };
      }
      return {};
    }
  },
  ohm: {
    title: "Ohm's Law: V = I * R",
    desc: "Electrical circuits base. Voltage equals current times resistance.",
    vars: {
      V: { label: "Voltage (V)", unitSI: "V", units: { "V (Volts)": 1, "mV (milliVolts)": 0.001, "kV (kiloVolts)": 1000 } },
      I: { label: "Current (I)", unitSI: "A", units: { "A (Amperes)": 1, "mA (milliAmperes)": 0.001, "μA (microAmperes)": 1e-6 } },
      R: { label: "Resistance (R)", unitSI: "Ω", units: { "Ω (Ohms)": 1, "kΩ (kiloOhms)": 1000, "MΩ (megaOhms)": 1e6 } }
    },
    solve: (vals) => {
      if (vals.V === null) return { V: (vals.I ?? 0) * (vals.R ?? 0) };
      if (vals.I === null) {
        if (Math.abs(vals.R ?? 0) < 1e-9) throw new Error("DIVIDE BY ZERO: Resistance R is zero! Cannot isolate Current.");
        return { I: (vals.V ?? 0) / (vals.R ?? 1) };
      }
      if (vals.R === null) {
        if (Math.abs(vals.I ?? 0) < 1e-9) throw new Error("DIVIDE BY ZERO: Current I is zero! Cannot isolate Resistance.");
        return { R: (vals.V ?? 0) / (vals.I ?? 1) };
      }
      return {};
    }
  },
  gas: {
    title: "Ideal Gas Law: P * V = n * R * T  (R = 8.314)",
    desc: "Thermodynamics equation of state. Temp scales support °C, °F, and Kelvin.",
    vars: {
      P: { label: "Pressure (P)", unitSI: "Pa", units: { "Pa (Pascals)": 1, "kPa (kiloPascals)": 1000, "atm (atmospheres)": 101325, "psi (lbs/sq in)": 6894.76, "bar": 100000 } },
      V: { label: "Volume (V)", unitSI: "m³", units: { "m³ (cubic meters)": 1, "L (liters)": 0.001, "mL (milliliters)": 1e-6, "ft³ (cubic feet)": 0.0283168, "gal (US gallons)": 0.00378541 } },
      n: { label: "Molar Count (n)", unitSI: "mol", units: { "mol": 1, "kmol": 1000 } },
      T: { label: "Temperature (T)", unitSI: "K", units: { "K (Kelvin)": 1, "°C (Celsius)": 1, "°F (Fahrenheit)": 1 } }
    },
    solve: (vals) => {
      const R = 8.31446;
      const P = vals.P ?? 0;
      const V = vals.V ?? 0;
      const n = vals.n ?? 0;
      const T = vals.T ?? 0;

      if (vals.P === null) {
        if (Math.abs(V) < 1e-9) throw new Error("DIVIDE BY ZERO: Volume is zero!");
        return { P: (n * R * T) / V };
      }
      if (vals.V === null) {
        if (Math.abs(P) < 1e-9) throw new Error("DIVIDE BY ZERO: Pressure is zero!");
        return { V: (n * R * T) / P };
      }
      if (vals.n === null) {
        if (Math.abs(T) < 1e-9) throw new Error("DIVIDE BY ZERO: Temperature is absolute zero Kelvin!");
        return { n: (P * V) / (R * T) };
      }
      if (vals.T === null) {
        if (Math.abs(n) < 1e-9) throw new Error("DIVIDE BY ZERO: Molar count n is zero!");
        return { T: (P * V) / (n * R) };
      }
      return {};
    }
  }
};

const EquationSolver = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [selectedKey, setSelectedKey] = useState<string>('fma');
  const [inputs, setInputs] = useState<{ [key: string]: string }>(() => {
    const cached = localStorage.getItem('stem_eq_inputs');
    return cached ? JSON.parse(cached) : {};
  });
  const [units, setUnits] = useState<{ [key: string]: string }>(() => {
    const cached = localStorage.getItem('stem_eq_units');
    return cached ? JSON.parse(cached) : {};
  });
  const [solvedVar, setSolvedVar] = useState<string | null>(null);
  const [calculatedPlaceholder, setCalculatedPlaceholder] = useState<{ [key: string]: string }>({});
  const [logOutput, setLogOutput] = useState<string>('');
  const [errorBox, setErrorBox] = useState<string | null>(null);

  const formula = solverFormulas[selectedKey];

  useEffect(() => {
    localStorage.setItem('stem_eq_inputs', JSON.stringify(inputs));
  }, [inputs]);

  useEffect(() => {
    localStorage.setItem('stem_eq_units', JSON.stringify(units));
  }, [units]);

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

  // Set default units when formula changes
  useEffect(() => {
    const defaultUnits: { [key: string]: string } = { ...units };
    Object.keys(formula.vars).forEach(k => {
      if (!defaultUnits[k]) {
        defaultUnits[k] = Object.keys(formula.vars[k].units)[0];
      }
    });
    setUnits(defaultUnits);
    setSolvedVar(null);
    setCalculatedPlaceholder({});
    setErrorBox(null);
    setLogOutput(
      `ALGEBRAIC APPARATUS LOADED FOR:\n${formula.title.toUpperCase()}\n\nFill exactly ALL-BUT-ONE variables to isolate and solve the unknown variables automatically.`
    );
  }, [selectedKey]);

  const handleInputChange = (varKey: string, value: string) => {
    setInputs(prev => ({ ...prev, [varKey]: value }));
    setSolvedVar(null);
    setCalculatedPlaceholder({});
  };

  const handleUnitChange = (varKey: string, value: string) => {
    setUnits(prev => ({ ...prev, [varKey]: value }));
    setSolvedVar(null);
    setCalculatedPlaceholder({});
  };

  const clearInputs = () => {
    const clearedInputs = { ...inputs };
    Object.keys(formula.vars).forEach(k => {
      clearedInputs[k] = '';
    });
    setInputs(clearedInputs);
    setSolvedVar(null);
    setCalculatedPlaceholder({});
    setErrorBox(null);
    setLogOutput(`LABORATORY COUNTER WIPE COMPLETED.\nReady for new physical measurements.`);
  };

  const solveEquation = () => {
    setErrorBox(null);
    setSolvedVar(null);
    setCalculatedPlaceholder({});

    let filledCount = 0;
    let emptyKey: string | null = null;
    const valsSI: { [key: string]: number | null } = {};

    try {
      Object.keys(formula.vars).forEach(varKey => {
        const rawVal = inputs[varKey] ?? '';
        const unit = units[varKey] ?? Object.keys(formula.vars[varKey].units)[0];
        const multiplier = formula.vars[varKey].units[unit];

        if (rawVal.trim() === '') {
          emptyKey = varKey;
          valsSI[varKey] = null;
        } else {
          filledCount++;
          const num = parseFloat(rawVal);
          if (isNaN(num)) throw new Error(`Invalid numeric input for ${formula.vars[varKey].label}.`);
          
          // Temperature special offsets
          if (selectedKey === 'gas' && varKey === 'T') {
            if (unit === '°C (Celsius)') {
              valsSI[varKey] = num + 273.15;
            } else if (unit === '°F (Fahrenheit)') {
              valsSI[varKey] = (num - 32) * 5/9 + 273.15;
            } else {
              valsSI[varKey] = num;
            }
          } else {
            valsSI[varKey] = num * multiplier;
          }
        }
      });

      const totalVars = Object.keys(formula.vars).length;

      if (filledCount < totalVars - 1) {
        throw new Error(`INSUFFICIENT COEFFICIENTS: Filled ${filledCount} fields. Expected exactly ${totalVars - 1}.\nPlease leave exactly ONE unknown field blank.`);
      }
      if (filledCount === totalVars) {
        throw new Error('SYSTEM EQUILIBRIUM: All fields are filled. Clear one field to solve for it.');
      }
      if (!emptyKey) {
        throw new Error('No target variable could be identified.');
      }
      const targetKey = emptyKey as string;

      // Solve in SI
      const solvedSI = formula.solve(valsSI);
      const resSIVal = solvedSI[targetKey];

      // Convert back to selected unit
      const targetUnit = units[targetKey] ?? Object.keys(formula.vars[targetKey].units)[0];
      const targetMultiplier = formula.vars[targetKey].units[targetUnit];
      let targetDisplayVal: number;

      if (selectedKey === 'gas' && targetKey === 'T') {
        if (targetUnit === '°C (Celsius)') {
          targetDisplayVal = resSIVal - 273.15;
        } else if (targetUnit === '°F (Fahrenheit)') {
          targetDisplayVal = (resSIVal - 273.15) * 9/5 + 32;
        } else {
          targetDisplayVal = resSIVal;
        }
      } else {
        targetDisplayVal = resSIVal / targetMultiplier;
      }

      setSolvedVar(targetKey);
      setCalculatedPlaceholder({ [targetKey]: targetDisplayVal.toFixed(4) });

      // Output ledger printing
      let log = `ALGEBRAIC SOLVER PRINTER LOG -- CALIBRATION REGISTER: ${selectedKey.toUpperCase()}\n`;
      log += `------------------------------------------------------------\n`;
      log += `Formula: ${formula.title}\n\n`;
      log += `ISOLATED VARIABLE KEY: ${targetKey.toUpperCase()} (${formula.vars[targetKey].label})\n\n`;
      log += `KNOWN PARAMETERS REGISTERED (SI values):\n`;

      Object.keys(formula.vars).forEach(k => {
        if (k !== targetKey) {
          const raw = inputs[k];
          const u = units[k] ?? Object.keys(formula.vars[k].units)[0];
          const si = valsSI[k];
          log += `  - ${formula.vars[k].label.padEnd(20)} = ${raw} ${u} (SI: ${si?.toFixed(4)} ${formula.vars[k].unitSI})\n`;
        }
      });

      log += `\n------------------------------------------------------------\n`;
      log += `COMPUTED ALGEBRAIC SOLUTION:\n\n`;
      log += `  >>  ${formula.vars[targetKey].label} = ${targetDisplayVal.toFixed(6).replace(/\.?0+$/, '')} ${targetUnit}\n`;
      log += `      (SI Equivalent: ${resSIVal.toFixed(6).replace(/\.?0+$/, '')} ${formula.vars[targetKey].unitSI})\n`;

      setLogOutput(log);

    } catch (e: any) {
      setErrorBox(`🚨 ALGEBRAIC SOLVER BLOCKED:\n${e.message}`);
      setLogOutput('RESOLVER TERMINATED DUE TO UNRESOLVED PHYSICAL EQUATION FAULTS.');
    }
  };

  return (
    <div 
      ref={sectionRef}
      className="w-full py-4 space-y-6"
      id="equation-solver"
    >
      <div className="relative">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="scroll-reveal mb-6">
            <span className="inline-block geo-block-red text-sm tracking-widest">
              LABORATORY APPARATUS MODULE II
            </span>
          </div>
          <div className="scroll-reveal" style={{ transitionDelay: '0.1s' }}>
            <h2 className="font-display text-2xl sm:text-4xl lg:text-6xl text-white mb-2">
              EQUATION SOLVER
            </h2>
            <p className="font-body text-md text-[#E63946] italic uppercase tracking-wider">
              UNIT-AWARE PHYSICAL APPARATUS CALCULATOR
            </p>
            <div className="line-separator mx-auto max-w-xs mt-4" />
          </div>
        </div>

        {/* Solver Configuration */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Column: Variable configurations */}
          <div className="space-y-6">
            <div className="scroll-reveal vintage-menu-card p-3 sm:p-6" style={{ transitionDelay: '0.2s' }}>
              
              <div className="border-b-2 dashed border-[#1D3557]/20 pb-4 mb-6">
                <span className="font-display text-lg text-[#1D3557] flex items-center gap-2">
                  <Beaker className="w-5 h-5 text-[#E63946]" />
                  SELECT PHYSICAL SYSTEM
                </span>
              </div>

              {/* Selector */}
              <div className="mb-6">
                <label className="font-body text-xs font-bold text-[#1D3557] block mb-2">ACTIVE FORMULA MODEL:</label>
                <select 
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  className="w-full font-body text-sm font-bold bg-[#F5F1E8] border-2 border-[#1D3557] py-2 px-3 focus:outline-none focus:border-[#E63946] transition-all"
                >
                  {Object.keys(solverFormulas).map(k => (
                    <option key={k} value={k}>
                      {solverFormulas[k].title}
                    </option>
                  ))}
                </select>
                <span className="font-body text-xs text-[#1D3557]/70 block mt-2 leading-relaxed">
                  {formula.desc}
                </span>
              </div>

              {/* Input Cards */}
              <div className="space-y-4">
                <span className="font-body text-xs font-bold text-[#E63946] block">ENTER VALUES (LEAVE ONE UNKNOWN BLANK):</span>
                
                {Object.keys(formula.vars).map(varKey => {
                  const spec = formula.vars[varKey];
                  const activeUnit = units[varKey] ?? Object.keys(spec.units)[0];
                  const isSolved = solvedVar === varKey;

                  return (
                    <div 
                      key={varKey} 
                      className={`p-4 border-2 transition-all duration-300 ${
                        isSolved 
                          ? 'border-[#E63946] bg-[#F5F1E8] shadow-md animate-pulse text-[#1D3557]' 
                          : 'border-[#1D3557]/10 bg-transparent text-[#1D3557]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <label className={`font-body text-xs font-bold ${isSolved ? 'text-[#1D3557]' : 'text-[#1D3557]/80'}`}>{spec.label}</label>
                        
                        {/* Unit picker */}
                        <select
                          value={activeUnit}
                          onChange={(e) => handleUnitChange(varKey, e.target.value)}
                          className="font-body text-[10px] font-bold bg-[#F5F1E8] text-[#1D3557] border border-[#1D3557]/20 py-0.5 px-1.5 focus:outline-none focus:border-[#E63946]"
                        >
                          {Object.keys(spec.units).map(unitName => (
                            <option key={unitName} value={unitName}>{unitName}</option>
                          ))}
                        </select>
                      </div>

                      <input
                        type="number"
                        value={inputs[varKey] ?? ''}
                        onChange={(e) => handleInputChange(varKey, e.target.value)}
                        placeholder={calculatedPlaceholder[varKey] ? `[Solved: ${calculatedPlaceholder[varKey]}]` : `Leave blank to solve for ${varKey}`}
                        className={`w-full input-vintage text-sm font-bold bg-transparent border-b-2 focus:border-[#E63946] focus:bg-[#E63946]/5 py-1 px-2 outline-none transition-all ${isSolved ? 'text-[#1D3557] placeholder-[#1D3557]/50 border-[#1D3557]/30' : 'text-[#1D3557] placeholder-[#1D3557]/40 border-[#1D3557]/20'}`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Solve Buttons */}
              <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t-2 dashed border-[#1D3557]/10">
                <button 
                  onClick={solveEquation}
                  className="ticket-btn flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-[#E63946] text-white hover:bg-[#1D3557]"
                >
                  <Sparkles className="w-4 h-4" />
                  ALGEBRAIC ISOLATION
                </button>
                <button 
                  onClick={clearInputs}
                  className="ticket-btn flex-1 sm:flex-initial bg-[#1D3557] text-white hover:bg-red-800 flex items-center justify-center gap-1.5 px-4"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  WIPE
                </button>
              </div>

            </div>
          </div>

          {/* Right Column: Output ledger */}
          <div className="space-y-6 lg:mt-8 w-full">
            <div className="scroll-reveal vintage-menu-card p-3 sm:p-6" style={{ transitionDelay: '0.3s' }}>
              
              <div className="border-b-2 dashed border-[#1D3557]/20 pb-4 mb-4">
                <span className="font-display text-lg text-[#1D3557] flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#E63946]" />
                  CALIBRATION METRICS LEDGER
                </span>
              </div>

              {/* Error Box */}
              {errorBox && (
                <div className="error-ticket flex items-start gap-3 bg-red-50 border-2 border-dashed border-red-400 p-4 text-red-700 font-body mb-6">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="text-xs font-bold leading-relaxed">{errorBox}</div>
                </div>
              )}

              {/* Ledger paper log */}
              <div className="relative">
                <span className="absolute top-2 right-4 font-display text-[9px] text-[#C5A059] font-bold tracking-widest z-10">SOLVER PRINTOUT</span>
                <pre className="w-full text-xs bg-[#F4ECD8] text-[#332211] font-body p-5 border-2 border-[#C5A059] rounded-sm max-h-[460px] overflow-y-auto shadow-inner leading-relaxed whitespace-pre-wrap">
                  {logOutput}
                </pre>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EquationSolver;
