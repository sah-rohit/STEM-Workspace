import { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';
import { AreaChart, Play, AlertTriangle, MousePointer } from 'lucide-react';

const NumericalPlayground = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [funcStr, setFuncStr] = useState<string>(() => {
    return localStorage.getItem('stem_num_func') || 'x^3 - 2*x - 5';
  });
  const [subMode, setSubMode] = useState<'root' | 'integ'>(() => {
    return (localStorage.getItem('stem_num_submode') as 'root' | 'integ') || 'root';
  });

  // Root States
  const [rootMethod, setRootMethod] = useState<'bisection' | 'newton' | 'secant'>('bisection');
  const [guessA, setGuessA] = useState<string>('1.0');
  const [guessB, setGuessB] = useState<string>('3.0');
  const [tolerance, setTolerance] = useState<string>('0.0001');
  const [maxIterations, setMaxIterations] = useState<number>(30);

  // Integration States
  const [integMethod, setIntegMethod] = useState<'midpoint' | 'trapezoidal' | 'simpsons'>('midpoint');
  const [integA, setIntegA] = useState<string>('0.0');
  const [integB, setIntegB] = useState<string>('3.0');
  const [integN, setIntegN] = useState<number>(6);

  const [logOutput, setLogOutput] = useState<string>('');
  const [errorBox, setErrorBox] = useState<string | null>(null);

  // Hover Coordinates
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);
  const [hoverPx, setHoverPx] = useState<{ x: number; y: number } | null>(null);
  
  // Coordinate Mapping Refs for Canvas Hover
  const limitsRef = useRef<{ xMin: number; xMax: number; yMin: number; yMax: number }>({ xMin: -5, xMax: 5, yMin: -5, yMax: 5 });

  useEffect(() => {
    localStorage.setItem('stem_num_func', funcStr);
  }, [funcStr]);

  useEffect(() => {
    localStorage.setItem('stem_num_submode', subMode);
  }, [subMode]);

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

  // Initial draw on mount/submode swap
  useEffect(() => {
    setErrorBox(null);
    setLogOutput(
      `NUMERICAL GRAPH PLOTTER SUBSYSTEM DEPLOYED.\nCHOOSE APPARATUS OPTIONS AND CLICK "PLOT & COMPUTE" ACTION TICKETS.`
    );
    drawPlaceholder();
  }, [subMode]);

  const drawPlaceholder = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Grid paper
    ctx.strokeStyle = 'rgba(0, 40, 104, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 20; x < canvas.width; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 20; y < canvas.height; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    ctx.fillStyle = '#002868';
    ctx.font = 'italic 12px "Courier Prime", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[ NO BLUEPRINT GRAPH CURRENTLY LOADED ]', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillStyle = '#E63946';
    ctx.font = '10px "Special Elite", monospace';
    ctx.fillText('PRESS "PLOT & COMPUTE APPARATUS" ON THE LEFT PANEL TO GENERATE BLUEPRINT', canvas.width / 2, canvas.height / 2 + 15);
  };

  const loadPreset = (type: 'x2' | 'sinx') => {
    setSubMode('integ');
    if (type === 'x2') {
      setFuncStr('x^2');
      setIntegA('0.0');
      setIntegB('3.0');
      setIntegN(6);
    } else {
      setFuncStr('sin(x)');
      setIntegA('0.0');
      setIntegB('3.14159');
      setIntegN(8);
    }
  };

  const executePlayground = () => {
    setErrorBox(null);
    if (funcStr.trim() === '') {
      setErrorBox('Enter a mathematical function expression f(x).');
      return;
    }

    try {
      const node = math.parse(funcStr);
      const code = node.compile();
      const f = (xVal: number): number => {
        return code.evaluate({ x: xVal });
      };

      if (subMode === 'root') {
        const tol = parseFloat(tolerance) || 1e-4;
        const maxIt = maxIterations;
        const gA = parseFloat(guessA) || 0;
        let rootVal = 0;
        let converged = false;

        let tableLog = `ITERATION CONVERGENCE LEDGER:\n`;
        tableLog += `------------------------------------------------------------\n`;
        tableLog += `  Iter |       x_n        |      f(x_n)      |  Approx Error \n`;
        tableLog += `------------------------------------------------------------\n`;

        if (rootMethod === 'bisection') {
          const gB = parseFloat(guessB) || 0;
          let a = gA, b = gB;
          let fa = f(a), fb = f(b);

          if (fa * fb > 0) {
            throw new Error(`BISECTION ERROR: Opposite signs required at endpoints.\n  f(a) = ${fa.toFixed(4)}, f(b) = ${fb.toFixed(4)}`);
          }

          let prevC = a;
          let c = a;
          let err = 1;

          for (let it = 0; it < maxIt; it++) {
            c = (a + b) / 2;
            const fc = f(c);
            err = it === 0 ? Math.abs(b - a) : Math.abs(c - prevC);

            tableLog += `   ${String(it + 1).padStart(2)}  |  ${c.toFixed(8).padStart(14)}  |  ${fc.toFixed(8).padStart(14)}  |  ${it === 0 ? '     N/A     ' : err.toFixed(8).padStart(14)}\n`;

            if (Math.abs(fc) < 1e-12 || err < tol) {
              rootVal = c;
              converged = true;
              break;
            }

            if (fa * fc < 0) {
              b = c;
              fb = fc;
            } else {
              a = c;
              fa = fc;
            }
            prevC = c;
          }
          rootVal = c;
        } 
        else if (rootMethod === 'newton') {
          // Symbolic derivative using mathjs
          const dNode = math.derivative(funcStr, 'x');
          const dCode = dNode.compile();
          const df = (xVal: number): number => dCode.evaluate({ x: xVal });

          let x = gA;
          let err = 1;

          for (let it = 0; it < maxIt; it++) {
            const fx = f(x);
            const dfx = df(x);

            if (Math.abs(dfx) < 1e-11) {
              throw new Error(`NEWTON ELIMINATION CRITICAL BLOCK: Slope is zero at x = ${x.toFixed(4)}. Div by zero.`);
            }

            const nextX = x - fx / dfx;
            err = Math.abs(nextX - x);

            tableLog += `   ${String(it + 1).padStart(2)}  |  ${x.toFixed(8).padStart(14)}  |  ${fx.toFixed(8).padStart(14)}  |  ${it === 0 ? '     N/A     ' : err.toFixed(8).padStart(14)}\n`;

            if (Math.abs(fx) < 1e-12 || err < tol) {
              rootVal = x;
              converged = true;
              break;
            }
            x = nextX;
          }
          rootVal = x;
        } 
        else if (rootMethod === 'secant') {
          const gB = parseFloat(guessB) || 0;
          let x0 = gA;
          let x1 = gB;
          let err = 1;

          for (let it = 0; it < maxIt; it++) {
            const fx0 = f(x0);
            const fx1 = f(x1);

            if (Math.abs(fx1 - fx0) < 1e-12) {
              throw new Error(`SECANT INTERPOLATION GAP: f(x1) - f(x0) ≈ 0. Infinite division slope.`);
            }

            const nextX = x1 - fx1 * (x1 - x0) / (fx1 - fx0);
            err = Math.abs(nextX - x1);

            tableLog += `   ${String(it + 1).padStart(2)}  |  ${x1.toFixed(8).padStart(14)}  |  ${fx1.toFixed(8).padStart(14)}  |  ${it === 0 ? '     N/A     ' : err.toFixed(8).padStart(14)}\n`;

            if (Math.abs(fx1) < 1e-12 || err < tol) {
              rootVal = x1;
              converged = true;
              break;
            }
            x0 = x1;
            x1 = nextX;
          }
          rootVal = x1;
        }

        tableLog += `------------------------------------------------------------\n`;

        // Output Printout
        let log = `NUMERICAL ROOT FINDING LEDGER SHEET -- MODULE IV\n`;
        log += `------------------------------------------------------------\n`;
        log += `Function: f(x) = ${funcStr}\n`;
        log += `Method:   ${rootMethod.toUpperCase()}\n`;
        log += `Tolerance: ${tol}\n`;
        log += `Dominant Root: x* ≈ ${rootVal.toFixed(8).replace(/\.?0+$/, '')}  ${converged ? '(CONVERGED)' : '(MAX ITERATIONS REACHED)'}\n`;
        log += `Verification:  f(x*) = ${f(rootVal).toFixed(8).replace(/\.?0+$/, '')}\n\n`;
        log += tableLog;

        setLogOutput(log);
        plotBlueprint(f, 'root', [rootVal]);
      } 
      else {
        // Integration
        const a = parseFloat(integA) || 0;
        const b = parseFloat(integB) || 0;
        let N = integN;

        if (integMethod === 'simpsons' && N % 2 !== 0) {
          N += 1;
          setIntegN(N);
        }

        const h = (b - a) / N;
        let approx = 0;

        if (integMethod === 'midpoint') {
          let sum = 0;
          for (let i = 0; i < N; i++) {
            sum += f(a + (i + 0.5) * h);
          }
          approx = h * sum;
        } 
        else if (integMethod === 'trapezoidal') {
          let sum = 0.5 * (f(a) + f(b));
          for (let i = 1; i < N; i++) {
            sum += f(a + i * h);
          }
          approx = h * sum;
        } 
        else if (integMethod === 'simpsons') {
          let sum = f(a) + f(b);
          for (let i = 1; i < N; i++) {
            const mult = i % 2 === 0 ? 2 : 4;
            sum += mult * f(a + i * h);
          }
          approx = (h / 3) * sum;
        }

        // Compare Analytical if matches presets
        let comparisonLog = '';
        const cleanFunc = funcStr.replace(/\s+/g, '').toLowerCase();
        let exact = 0;
        let match = false;

        if (cleanFunc === 'x^2') {
          exact = (b*b*b - a*a*a) / 3;
          match = true;
        } else if (cleanFunc === 'sin(x)') {
          exact = -Math.cos(b) + Math.cos(a);
          match = true;
        }

        if (match) {
          const absErr = Math.abs(approx - exact);
          const relErr = exact !== 0 ? (absErr / Math.abs(exact)) * 100 : 0;
          comparisonLog += `ANALYTICAL METRICS COMPARISON:\n`;
          comparisonLog += `  - Exact Analytical Integral: ${exact.toFixed(8).replace(/\.?0+$/, '')}\n`;
          comparisonLog += `  - Absolute Deviation:        ${absErr.toFixed(8).replace(/\.?0+$/, '')}\n`;
          comparisonLog += `  - Mapped Relative Error:      ${relErr.toFixed(4)}%\n`;
        }

        let log = `NUMERICAL INTEGRATION DRAFTING SHEET -- MODULE IV\n`;
        log += `------------------------------------------------------------\n`;
        log += `Function: f(x) = ${funcStr}\n`;
        log += `Interval: [${a}, ${b}] (N = ${N} subintervals, h = ${h.toFixed(6)})\n`;
        log += `Apparatus: ${integMethod.toUpperCase()} RECT/TRAPEZ AREA RULE\n`;
        log += `------------------------------------------------------------\n`;
        log += ` >> COMPUTED AREA VALUE ≈ ${approx.toFixed(8).replace(/\.?0+$/, '')}\n\n`;
        log += comparisonLog;

        setLogOutput(log);
        plotBlueprint(f, 'integ', [a, b, N, integMethod]);
      }

    } catch (e: any) {
      setErrorBox(`🚨 GRAPH ENGINE FAULT:\n${e.message}`);
      setLogOutput('CALCULATION SUSPENDED DUE TO COMPUTATIONAL INTEGRITY BLOCKS.');
    }
  };

  const plotBlueprint = (f: (x: number) => number, mode: 'root' | 'integ', params: any[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Domain limits
    let xMin = -5, xMax = 5;
    if (mode === 'root') {
      const root = params[0];
      xMin = root - 4;
      xMax = root + 4;
    } else {
      const a = params[0], b = params[1];
      const w = b - a;
      xMin = a - 0.25 * w - 0.5;
      xMax = b + 0.25 * w + 0.5;
    }

    const samples = 100;
    const yVals: number[] = [];
    for (let i = 0; i <= samples; i++) {
      const x = xMin + (xMax - xMin) * (i / samples);
      try {
        const y = f(x);
        if (!isNaN(y) && isFinite(y)) yVals.push(y);
      } catch (e) {}
    }

    let yMin = yVals.length > 0 ? Math.min(...yVals) : -10;
    let yMax = yVals.length > 0 ? Math.max(...yVals) : 10;
    const yRange = yMax - yMin;

    if (yRange === 0) {
      yMin -= 1;
      yMax += 1;
    } else {
      yMin -= 0.2 * yRange;
      yMax += 0.2 * yRange;
    }

    if (yMin > 0) yMin = -0.1 * yMax;
    if (yMax < 0) yMax = 0.1 * yMin;

    // Cache limits for mouse hover coordinates
    limitsRef.current = { xMin, xMax, yMin, yMax };

    // Mapping pixels
    const pad = 35;
    const toPxX = (x: number) => pad + (x - xMin) / (xMax - xMin) * (canvas.width - 2 * pad);
    const toPxY = (y: number) => canvas.height - pad - (y - yMin) / (yMax - yMin) * (canvas.height - 2 * pad);

    // Grid backdrop
    ctx.strokeStyle = 'rgba(0, 40, 104, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 20; x < canvas.width; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 20; y < canvas.height; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Solid Axis lines
    ctx.strokeStyle = 'var(--color-navy)';
    ctx.lineWidth = 2;
    const pyZero = toPxY(0);
    ctx.beginPath();
    ctx.moveTo(pad, pyZero);
    ctx.lineTo(canvas.width - pad, pyZero);
    ctx.stroke();

    let pxZero = toPxX(0);
    if (pxZero < pad) pxZero = pad;
    if (pxZero > canvas.width - pad) pxZero = canvas.width - pad;
    ctx.beginPath();
    ctx.moveTo(pxZero, pad);
    ctx.lineTo(pxZero, canvas.height - pad);
    ctx.stroke();

    // 2. Integration shading (Hatch marks)
    if (mode === 'integ') {
      const a = params[0], b = params[1], N = params[2], method = params[3];
      const h = (b - a) / N;

      ctx.fillStyle = 'rgba(0, 40, 104, 0.12)';
      ctx.strokeStyle = 'rgba(0, 40, 104, 0.25)';
      ctx.lineWidth = 1;

      for (let i = 0; i < N; i++) {
        const xi = a + i * h;
        const xNext = xi + h;
        const pxL = toPxX(xi);
        const pxR = toPxX(xNext);
        const pyZ = toPxY(0);

        ctx.beginPath();
        ctx.moveTo(pxL, pyZ);

        if (method === 'midpoint') {
          const mid = xi + 0.5 * h;
          const pyMid = toPxY(f(mid));
          ctx.lineTo(pxL, pyMid);
          ctx.lineTo(pxR, pyMid);
        } 
        else if (method === 'trapezoidal') {
          ctx.lineTo(pxL, toPxY(f(xi)));
          ctx.lineTo(pxR, toPxY(f(xNext)));
        } 
        else if (method === 'simpsons') {
          ctx.lineTo(pxL, toPxY(f(xi)));
          for (let s = 1; s <= 10; s++) {
            const xs = xi + (s / 10) * h;
            ctx.lineTo(toPxX(xs), toPxY(f(xs)));
          }
        }
        ctx.lineTo(pxR, pyZ);
        ctx.closePath();
        ctx.fill();

        // divider lines
        ctx.beginPath();
        ctx.moveTo(pxL, pyZ);
        ctx.lineTo(pxL, toPxY(f(xi)));
        ctx.stroke();
      }
      
      // end boundary divider line
      ctx.beginPath();
      ctx.moveTo(toPxX(b), toPxY(0));
      ctx.lineTo(toPxX(b), toPxY(f(b)));
      ctx.stroke();
    }

    // 3. Draw f(x) curve
    ctx.strokeStyle = 'var(--color-red)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    let started = false;

    for (let i = 0; i <= 200; i++) {
      const x = xMin + (xMax - xMin) * (i / 200);
      try {
        const y = f(x);
        if (!isNaN(y) && isFinite(y)) {
          const px = toPxX(x);
          const py = toPxY(y);
          if (py >= pad && py <= canvas.height - pad) {
            if (!started) {
              ctx.moveTo(px, py);
              started = true;
            } else {
              ctx.lineTo(px, py);
            }
          }
        }
      } catch (e) {}
    }
    ctx.stroke();

    // 4. Draw Root target bullseye
    if (mode === 'root') {
      const root = params[0];
      const px = toPxX(root);
      const py = toPxY(0);

      ctx.strokeStyle = 'var(--color-navy)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px, py, 16, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.strokeStyle = 'var(--color-red)';
      ctx.beginPath();
      ctx.moveTo(px - 22, py); ctx.lineTo(px + 22, py);
      ctx.moveTo(px, py - 22); ctx.lineTo(px, py + 22);
      ctx.stroke();

      ctx.fillStyle = 'var(--color-navy)';
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = '#1C1C1C';
      ctx.font = 'bold 10px "Courier Prime", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Root x* ≈ ${root.toFixed(4)}`, px, py - 28);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;

    const pad = 35;
    if (xPx < pad || xPx > rect.width - pad || yPx < pad || yPx > rect.height - pad) {
      setHoverCoord(null);
      setHoverPx(null);
      return;
    }

    const { xMin, xMax, yMin, yMax } = limitsRef.current;
    const scaledX = (xPx / rect.width) * canvas.width;
    const scaledY = (yPx / rect.height) * canvas.height;

    const mathX = xMin + ((scaledX - pad) / (canvas.width - 2 * pad)) * (xMax - xMin);
    const mathY = yMax - ((scaledY - pad) / (canvas.height - 2 * pad)) * (yMax - yMin);

    setHoverCoord({ x: mathX, y: mathY });
    setHoverPx({ x: xPx, y: yPx });
  };

  const handleMouseLeave = () => {
    setHoverCoord(null);
    setHoverPx(null);
  };

  const clearInputs = () => {
    setFuncStr('x^3 - 2*x - 5');
    setGuessA('1.0');
    setGuessB('3.0');
    setIntegA('0.0');
    setIntegB('3.0');
    setIntegN(6);
    setErrorBox(null);
    drawPlaceholder();
    setLogOutput('NUMERICAL PLAYGROUND REBOOT COMPLETED.');
  };

  return (
    <div 
      ref={sectionRef}
      className="w-full py-4 space-y-6"
      id="numerical-playground"
    >
      <div className="relative text-[#1D3557]">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="scroll-reveal mb-6">
            <span className="inline-block geo-block-red text-sm tracking-widest text-white">
              LABORATORY APPARATUS MODULE IV
            </span>
          </div>
          <div className="scroll-reveal" style={{ transitionDelay: '0.1s' }}>
            <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl text-[#1D3557] mb-2">
              NUMERICAL METHODS
            </h2>
            <p className="font-body text-md text-[#E63946] italic uppercase tracking-wider">
              ROOT CONVERGENCE & AREA INTEGRATION PLATFORM
            </p>
            <div className="line-separator mx-auto max-w-xs mt-4" />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Column: Parameter controls */}
          <div className="space-y-6">
            <div className="scroll-reveal vintage-menu-card p-3 sm:p-6" style={{ transitionDelay: '0.2s' }}>
              
              <div className="border-b-2 dashed border-[#1D3557]/20 pb-4 mb-6">
                <span className="font-display text-lg text-[#1D3557] flex items-center gap-2">
                  <AreaChart className="w-5 h-5 text-[#E63946]" />
                  MATHEMATICAL FUNCTION MODEL
                </span>
              </div>

              {/* Function Expression */}
              <div className="mb-6">
                <label className="font-body text-xs font-bold text-[#1D3557] block mb-2">FUNCTION f(x) EXPRESSION:</label>
                <input 
                  type="text" 
                  value={funcStr}
                  onChange={(e) => setFuncStr(e.target.value)}
                  className="w-full input-vintage text-md font-bold bg-[#F5F1E8] border-2 border-[#1D3557] py-2 px-3 focus:outline-none focus:border-[#E63946] text-[#1D3557] transition-all"
                />
                <span className="font-body text-[10px] text-[#1D3557]/60 block mt-2">
                  Supports algebra variables & trigonometry: e.g., <code>x^3 - 2*x - 5</code> or <code>sin(x) - 0.5*x</code>
                </span>
              </div>

              {/* Mode selects */}
              <div className="flex gap-4 mb-6 bg-[#F5F1E8] p-2 border border-[#1D3557]/20">
                <button
                  onClick={() => setSubMode('root')}
                  className={`flex-1 font-display text-xs py-2 font-bold transition-all text-center ${
                    subMode === 'root' ? 'bg-[#1D3557] text-[#F5F1E8]' : 'text-[#1D3557]/65 hover:text-[#1D3557]'
                  }`}
                >
                  ROOT FINDING ENGINE
                </button>
                <button
                  onClick={() => setSubMode('integ')}
                  className={`flex-1 font-display text-xs py-2 font-bold transition-all text-center ${
                    subMode === 'integ' ? 'bg-[#1D3557] text-[#F5F1E8]' : 'text-[#1D3557]/65 hover:text-[#1D3557]'
                  }`}
                >
                  AREA INTEGRATION ENGINE
                </button>
              </div>

              {/* Root params */}
              {subMode === 'root' ? (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-body text-[10px] font-bold text-[#1D3557] block mb-1">CONVERGENCE METHOD:</label>
                      <select
                        value={rootMethod}
                        onChange={(e: any) => setRootMethod(e.target.value)}
                        className="w-full font-body text-xs font-bold bg-[#F5F1E8] border border-[#1D3557] py-1.5 px-2 text-[#1D3557]"
                      >
                        <option value="bisection">Bisection Method</option>
                        <option value="newton">Newton-Raphson</option>
                        <option value="secant">Secant Method</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-body text-[10px] font-bold text-[#1D3557] block mb-1">GUESSES / BRACKETS:</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={guessA}
                          onChange={(e) => setGuessA(e.target.value)}
                          placeholder="a / x0"
                          className="w-full input-vintage text-xs font-bold bg-[#F5F1E8] border border-[#1D3557]/30 py-1 px-1.5 text-[#1D3557] text-center"
                        />
                        {rootMethod !== 'newton' && (
                          <input
                            type="number"
                            value={guessB}
                            onChange={(e) => setGuessB(e.target.value)}
                            placeholder="b / x1"
                            className="w-full input-vintage text-xs font-bold bg-[#F5F1E8] border border-[#1D3557]/30 py-1 px-1.5 text-[#1D3557] text-center"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-body text-[10px] font-bold text-[#1D3557] block mb-1">TOLERANCE RATIO (ε):</label>
                      <input
                        type="text"
                        value={tolerance}
                        onChange={(e) => setTolerance(e.target.value)}
                        className="w-full input-vintage text-xs font-bold bg-[#F5F1E8] border border-[#1D3557]/30 py-1 px-2 text-[#1D3557]"
                      />
                    </div>
                    <div>
                      <label className="font-body text-[10px] font-bold text-[#1D3557] block mb-1">MAX CYCLES LIMIT:</label>
                      <input
                        type="number"
                        value={maxIterations}
                        onChange={(e) => setMaxIterations(parseInt(e.target.value) || 30)}
                        className="w-full input-vintage text-xs font-bold bg-[#F5F1E8] border border-[#1D3557]/30 py-1 px-2 text-[#1D3557]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // Integration params
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-body text-[10px] font-bold text-[#1D3557] block mb-1">METHOD APPARATUS:</label>
                      <select
                        value={integMethod}
                        onChange={(e: any) => setIntegMethod(e.target.value)}
                        className="w-full font-body text-xs font-bold bg-[#F5F1E8] border border-[#1D3557] py-1.5 px-2 text-[#1D3557]"
                      >
                        <option value="midpoint">Midpoint Rule</option>
                        <option value="trapezoidal">Trapezoidal Rule</option>
                        <option value="simpsons">Simpson's Rule</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-body text-[10px] font-bold text-[#1D3557] block mb-1">LIMITS [a, b]:</label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          value={integA}
                          onChange={(e) => setIntegA(e.target.value)}
                          placeholder="a"
                          className="w-full input-vintage text-xs font-bold bg-[#F5F1E8] border border-[#1D3557]/30 py-1 px-1 text-[#1D3557] text-center"
                        />
                        <input
                          type="number"
                          value={integB}
                          onChange={(e) => setIntegB(e.target.value)}
                          placeholder="b"
                          className="w-full input-vintage text-xs font-bold bg-[#F5F1E8] border border-[#1D3557]/30 py-1 px-1 text-[#1D3557] text-center"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-body text-[10px] font-bold text-[#1D3557] block mb-1">SEGMENTS (N):</label>
                      <input
                        type="number"
                        value={integN}
                        min="2"
                        step={integMethod === 'simpsons' ? '2' : '1'}
                        onChange={(e) => setIntegN(parseInt(e.target.value) || 6)}
                        className="w-full input-vintage text-xs font-bold bg-[#F5F1E8] border border-[#1D3557]/30 py-1 px-2 text-[#1D3557] text-center"
                      />
                    </div>
                  </div>

                  <div className="flex justify-center gap-3 pt-2">
                    <button onClick={() => loadPreset('x2')} className="ticket-btn text-[10px] py-1 px-2.5 bg-[#1D3557] text-white">Load x² (Analytical)</button>
                    <button onClick={() => loadPreset('sinx')} className="ticket-btn text-[10px] py-1 px-2.5 bg-[#1D3557] text-white">Load sin(x) (Analytical)</button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 mt-6 pt-4 border-t-2 dashed border-[#1D3557]/15">
                <button 
                  onClick={executePlayground}
                  className="ticket-btn flex-1 bg-[#E63946] text-white hover:bg-[#1D3557] font-bold text-xs py-2.5 px-4 flex items-center justify-center gap-1.5"
                >
                  <Play className="w-4 h-4" />
                  PLOT & COMPUTE APPARATUS
                </button>
                <button 
                  onClick={clearInputs}
                  className="ticket-btn bg-[#1D3557] text-white hover:bg-red-800 font-bold text-xs py-2.5 px-4"
                >
                  WIPE PLOTTER
                </button>
              </div>

            </div>
          </div>

          {/* Right Column: Custom blueprint plotter */}
          <div className="space-y-6 w-full">
            <div className="scroll-reveal vintage-menu-card p-3 sm:p-6" style={{ transitionDelay: '0.3s' }}>
              
              <div className="border-b-2 dashed border-[#1D3557]/20 pb-4 mb-4 flex justify-between items-center">
                <span className="font-display text-lg text-[#1D3557] flex items-center gap-2">
                  <AreaChart className="w-5 h-5 text-[#E63946]" />
                  APPARATUS PLOTTER BLUEPRINT
                </span>
                
                {hoverCoord && (
                  <span className="font-body text-[10px] text-[#E63946] font-bold flex items-center gap-1">
                    <MousePointer className="w-3.5 h-3.5" />
                    x: {hoverCoord.x.toFixed(3)} y: {hoverCoord.y.toFixed(3)}
                  </span>
                )}
              </div>

              {/* Custom canvas plotting grid */}
              <div className="relative bg-[#F4ECD8] border-2 border-[#C5A059] p-2 sm:p-3 shadow-inner rounded-sm overflow-hidden w-full">
                <canvas 
                  ref={canvasRef} 
                  width="420" 
                  height="240" 
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  className="w-full block bg-[#F4ECD8] border border-[#C5A059]/40 cursor-crosshair min-h-[200px] sm:min-h-[280px]"
                />

                {/* Hover coordinate tooltip overlay inside canvas */}
                {hoverCoord && hoverPx && (
                  <div 
                    className="absolute bg-[#1C1C1C] text-white border border-[#C5A059] px-2 py-1 text-[9px] font-body pointer-events-none rounded-sm"
                    style={{ left: `${hoverPx.x + 10}px`, top: `${hoverPx.y - 30}px` }}
                  >
                    x: {hoverCoord.x.toFixed(4)}<br />y: {hoverCoord.y.toFixed(4)}
                  </div>
                )}
              </div>

              {/* Error Box */}
              {errorBox && (
                <div className="error-ticket mt-4 bg-red-50 border border-red-300 text-red-700 p-3 font-body text-xs flex gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <div className="font-bold leading-relaxed">{errorBox}</div>
                </div>
              )}

              {/* Typewriter log */}
              <div className="relative mt-4">
                <span className="absolute top-2 right-4 font-display text-[9px] text-[#C5A059] font-bold tracking-widest z-10">ANALYSIS LEDGER</span>
                <pre className="w-full text-xs bg-[#F4ECD8] text-[#332211] font-body p-5 border-2 border-[#C5A059] rounded-sm max-h-[300px] overflow-y-auto shadow-inner leading-relaxed whitespace-pre-wrap">
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

export default NumericalPlayground;
