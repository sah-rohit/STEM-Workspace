import { useState, useEffect, useRef } from 'react';
import { Layers, Check, Trash2, Cpu, Grid } from 'lucide-react';

const MatrixLab = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<number>(3);
  const [matA, setMatA] = useState<number[][]>(() => {
    const cached = localStorage.getItem('stem_matA');
    return cached ? JSON.parse(cached) : Array(4).fill(null).map(() => Array(4).fill(0));
  });
  const [matB, setMatB] = useState<number[][]>(() => {
    const cached = localStorage.getItem('stem_matB');
    return cached ? JSON.parse(cached) : Array(4).fill(null).map(() => Array(4).fill(0));
  });
  const [vectorB, setVectorB] = useState<number[]>(() => {
    const cached = localStorage.getItem('stem_vectorB');
    return cached ? JSON.parse(cached) : Array(4).fill(0);
  });
  const [jsonPaste, setJsonPaste] = useState<string>('');
  const [showJsonPaste, setShowJsonPaste] = useState<boolean>(false);
  const [logOutput, setLogOutput] = useState<string>(
    'SYSTEM ONLINE. ATELIER CALCULATING ENGINE DEPLOYED.\nCHOOSE DIMENSIONS, ASSIGN PARAMETERS AND PRESS A TICKET ACTION BELOW.'
  );
  const [errorBox, setErrorBox] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('stem_matA', JSON.stringify(matA));
  }, [matA]);

  useEffect(() => {
    localStorage.setItem('stem_matB', JSON.stringify(matB));
  }, [matB]);

  useEffect(() => {
    localStorage.setItem('stem_vectorB', JSON.stringify(vectorB));
  }, [vectorB]);

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

  const handleCellChange = (matrix: 'A' | 'B', r: number, c: number, val: string) => {
    const num = parseFloat(val) || 0;
    if (matrix === 'A') {
      const copy = matA.map(row => [...row]);
      copy[r][c] = num;
      setMatA(copy);
    } else {
      const copy = matB.map(row => [...row]);
      copy[r][c] = num;
      setMatB(copy);
    }
  };

  const handleVectorChange = (idx: number, val: string) => {
    const num = parseFloat(val) || 0;
    const copy = [...vectorB];
    copy[idx] = num;
    setVectorB(copy);
  };

  const loadPreset = (type: 'random' | 'identity' | 'clear') => {
    setErrorBox(null);
    const newA = matA.map(row => [...row]);
    const newB = matB.map(row => [...row]);
    const newVec = [...vectorB];

    for (let r = 0; r < 4; r++) {
      newVec[r] = type === 'random' ? Math.floor(Math.random() * 19) - 9 : 0;
      for (let c = 0; c < 4; c++) {
        if (type === 'random') {
          newA[r][c] = Math.floor(Math.random() * 19) - 9;
          newB[r][c] = Math.floor(Math.random() * 19) - 9;
        } else if (type === 'identity') {
          newA[r][c] = r === c ? 1 : 0;
          newB[r][c] = r === c ? 1 : 0;
        } else {
          newA[r][c] = 0;
          newB[r][c] = 0;
        }
      }
    }
    setMatA(newA);
    setMatB(newB);
    setVectorB(newVec);
  };

  const handleJsonSubmit = () => {
    setErrorBox(null);
    try {
      const parsed = JSON.parse(jsonPaste);
      if (parsed.A && Array.isArray(parsed.A)) {
        const rows = parsed.A.length;
        if (rows >= 2 && rows <= 4) {
          setSize(rows);
          const newA = matA.map(row => [...row]);
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < rows; c++) {
              newA[r][c] = parseFloat(parsed.A[r][c]) || 0;
            }
          }
          setMatA(newA);
          if (parsed.B && Array.isArray(parsed.B)) {
            const newB = matB.map(row => [...row]);
            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < rows; c++) {
                newB[r][c] = parseFloat(parsed.B[r][c]) || 0;
              }
            }
            setMatB(newB);
          }
          if (parsed.b && Array.isArray(parsed.b)) {
            const newVec = [...vectorB];
            for (let r = 0; r < rows; r++) {
              newVec[r] = parseFloat(parsed.b[r]) || 0;
            }
            setVectorB(newVec);
          }
          setLogOutput('JSON MATRIX SCHEMATIC IMPORTED SUCCESSFULLY.');
          setShowJsonPaste(false);
        } else {
          throw new Error('Matrix dimension must be between 2 and 4.');
        }
      } else {
        throw new Error('JSON must contain key "A" as a 2D array.');
      }
    } catch (e: any) {
      setErrorBox(`JSON Parse Error: ${e.message}`);
    }
  };

  // Helper algorithms
  const getSubmatrix = (m: number[][], row: number, col: number, dim: number): number[][] => {
    const sub: number[][] = [];
    for (let r = 0; r < dim; r++) {
      if (r === row) continue;
      const subRow: number[] = [];
      for (let c = 0; c < dim; c++) {
        if (c === col) continue;
        subRow.push(m[r][c]);
      }
      sub.push(subRow);
    }
    return sub;
  };

  const getDeterminant = (m: number[][], dim: number): number => {
    if (dim === 1) return m[0][0];
    if (dim === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
    let det = 0;
    for (let c = 0; c < dim; c++) {
      const sub = getSubmatrix(m, 0, c, dim);
      det += Math.pow(-1, c) * m[0][c] * getDeterminant(sub, dim - 1);
    }
    return det;
  };

  const getInverse = (m: number[][], dim: number): number[][] => {
    const det = getDeterminant(m, dim);
    if (Math.abs(det) < 1e-9) {
      throw new Error('SINGULAR MATRIX WARNING: Determinant is ZERO. Mechanical inverse does not exist.');
    }
    if (dim === 1) return [[1 / m[0][0]]];
    
    const adj = Array(dim).fill(null).map(() => Array(dim).fill(0));
    for (let r = 0; r < dim; r++) {
      for (let c = 0; c < dim; c++) {
        const sub = getSubmatrix(m, r, c, dim);
        const cofactor = Math.pow(-1, r + c) * getDeterminant(sub, dim - 1);
        adj[c][r] = cofactor; // Transposed cofactor
      }
    }

    const inv = Array(dim).fill(null).map(() => Array(dim).fill(0));
    for (let r = 0; r < dim; r++) {
      for (let c = 0; c < dim; c++) {
        inv[r][c] = adj[r][c] / det;
      }
    }
    return inv;
  };

  const formatMatrix = (m: number[][], dim: number): string => {
    let str = '';
    for (let r = 0; r < dim; r++) {
      str += '  [ ';
      for (let c = 0; c < dim; c++) {
        const val = m[r][c];
        const valStr = Math.abs(val % 1) < 1e-9 ? val.toFixed(0) : val.toFixed(4);
        str += valStr.padStart(10) + ' ';
      }
      str += ' ]\n';
    }
    return str;
  };

  // Matrix math trigger
  const runOperation = (op: 'add' | 'multiply' | 'transpose' | 'det' | 'inverse' | 'solve' | 'eigen') => {
    setErrorBox(null);
    let log = `CALCULATION LEDGER PRINTER -- CALIBRATION REGISTER\n`;
    log += `------------------------------------------------------------\n`;
    log += `INPUT MATRIX A:\n${formatMatrix(matA, size)}\n`;

    try {
      if (op === 'add') {
        log += `INPUT MATRIX B:\n${formatMatrix(matB, size)}\n`;
        const res = Array(size).fill(null).map(() => Array(size).fill(0));
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            res[r][c] = matA[r][c] + matB[r][c];
          }
        }
        log += `------------------------------------------------------------\n`;
        log += `RESULT MATRIX [A + B]:\n${formatMatrix(res, size)}`;
      } 
      else if (op === 'multiply') {
        log += `INPUT MATRIX B:\n${formatMatrix(matB, size)}\n`;
        const res = Array(size).fill(null).map(() => Array(size).fill(0));
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            let sum = 0;
            for (let k = 0; k < size; k++) {
              sum += matA[r][k] * matB[k][c];
            }
            res[r][c] = sum;
          }
        }
        log += `------------------------------------------------------------\n`;
        log += `RESULT MATRIX [A × B]:\n${formatMatrix(res, size)}`;
      } 
      else if (op === 'transpose') {
        const res = Array(size).fill(null).map(() => Array(size).fill(0));
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            res[c][r] = matA[r][c];
          }
        }
        log += `------------------------------------------------------------\n`;
        log += `RESULT MATRIX [Aᵀ]:\n${formatMatrix(res, size)}`;
      } 
      else if (op === 'det') {
        const det = getDeterminant(matA, size);
        log += `------------------------------------------------------------\n`;
        log += `COMPUTED SCALAR DETERMINANT |A|:\n\n`;
        log += `  DET |A| = ${det.toFixed(6).replace(/\.?0+$/, '')}\n`;
      } 
      else if (op === 'inverse') {
        const inv = getInverse(matA, size);
        log += `------------------------------------------------------------\n`;
        log += `RESULT MATRIX INVERSE [A⁻¹]:\n${formatMatrix(inv, size)}`;
      } 
      else if (op === 'solve') {
        log += `INPUT VECTOR b:\n  [ ${vectorB.slice(0, size).map(v => v.toFixed(2)).join(', ')} ]ᵀ\n\n`;
        log += `GAUSSIAN ELIMINATION STEPS:\n`;
        
        // Setup augmented matrix
        const aug = Array(size).fill(null).map((_, r) => {
          const row = [...matA[r].slice(0, size)];
          row.push(vectorB[r]);
          return row;
        });

        // Forward elimination
        for (let i = 0; i < size; i++) {
          // Pivot search
          let maxRow = i;
          for (let k = i + 1; k < size; k++) {
            if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) {
              maxRow = k;
            }
          }

          if (Math.abs(aug[maxRow][i]) < 1e-9) {
            throw new Error('ELIMINATION ERROR: Matrix is singular. Linear system has no unique solution.');
          }

          // Swap rows
          if (maxRow !== i) {
            const temp = aug[i];
            aug[i] = aug[maxRow];
            aug[maxRow] = temp;
            log += `  - Swap Row ${i + 1} with Row ${maxRow + 1}\n`;
          }

          // Eliminate
          for (let k = i + 1; k < size; k++) {
            const factor = aug[k][i] / aug[i][i];
            log += `  - Row ${k + 1} = Row ${k + 1} - (${factor.toFixed(3)}) * Row ${i + 1}\n`;
            for (let j = i; j <= size; j++) {
              aug[k][j] -= factor * aug[i][j];
            }
          }
        }

        // Back substitution
        const x = Array(size).fill(0);
        for (let i = size - 1; i >= 0; i--) {
          let sum = aug[i][size];
          for (let j = i + 1; j < size; j++) {
            sum -= aug[i][j] * x[j];
          }
          x[i] = sum / aug[i][i];
        }

        log += `\n------------------------------------------------------------\n`;
        log += `COMPUTED SOLUTION VECTOR x (Ax = b):\n\n`;
        x.forEach((val, idx) => {
          log += `  x_${idx + 1} = ${val.toFixed(6).replace(/\.?0+$/, '')}\n`;
        });
      } 
      else if (op === 'eigen') {
        log += `DOMINANT EIGENVALUE POWER METRIC ITERATIVE METHOD:\n`;
        // Power method: x_{k+1} = A * x_k, scale dominant
        let x = Array(size).fill(1); // Initial guess
        let lOld = 0;
        let lNew = 0;
        const maxIt = 25;
        let conv = false;

        for (let it = 0; it < maxIt; it++) {
          const next = Array(size).fill(0);
          for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
              next[r] += matA[r][c] * x[c];
            }
          }

          // Find dominant scalar (infinity norm)
          let dominant = 0;
          for (let r = 0; r < size; r++) {
            if (Math.abs(next[r]) > Math.abs(dominant)) {
              dominant = next[r];
            }
          }

          if (Math.abs(dominant) < 1e-9) {
            lNew = 0;
            break;
          }

          // Normalize vector
          for (let r = 0; r < size; r++) {
            x[r] = next[r] / dominant;
          }

          lNew = dominant;
          log += `  - Iter ${String(it + 1).padStart(2)}: λ ≈ ${lNew.toFixed(6).padEnd(10)} Vector: [${x.map(v => v.toFixed(3)).join(', ')}]\n`;

          if (Math.abs(lNew - lOld) < 1e-6) {
            conv = true;
            break;
          }
          lOld = lNew;
        }

        log += `\n------------------------------------------------------------\n`;
        log += `DOMINANT EIGENVALUE & EIGENVECTOR RESULTS:\n\n`;
        log += `  Dominant Eigenvalue  λ ≈ ${lNew.toFixed(6).replace(/\.?0+$/, '')} ${conv ? '(CONVERGED)' : '(MAX ITER REACHED)'}\n`;
        log += `  Dominant Eigenvector v ≈ [ ${x.map(v => v.toFixed(6).replace(/\.?0+$/, '')).join(', ')} ]ᵀ\n`;
      }
      setLogOutput(log);
    } catch (e: any) {
      setErrorBox(`🚨 OPERATION ABORTED:\n${e.message}`);
      setLogOutput(`CALCULATION FAILED. RETRY WITH DIFFERENT INPUT PARAMETERS.`);
    }
  };

  return (
    <div 
      ref={sectionRef}
      className="w-full py-4 space-y-6"
      id="matrix-lab"
    >
      <div className="relative">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Interactive Input Card */}
          <div className="space-y-8">
            <div className="scroll-reveal">
              <span className="geo-block-red text-sm tracking-widest inline-flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                LABORATORY APPARATUS MODULE I
              </span>
            </div>

            <div className="scroll-reveal" style={{ transitionDelay: '0.1s' }}>
              <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl text-[#1D3557] leading-tight mb-2">
                MATRIX & LINEAR ALGEBRA
              </h2>
              <p className="font-body text-md text-[#1D3557]/70 italic uppercase tracking-wider">
                MECHANICAL COEFFICIENT SOLVER & CALCULATOR
              </p>
              <div className="line-separator max-w-sm mt-4" />
            </div>

            {/* Config Card */}
            <div className="scroll-reveal vintage-menu-card p-4 sm:p-6" style={{ transitionDelay: '0.2s' }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 dashed border-[#1D3557]/20 pb-4 mb-6 gap-4">
                <span className="font-display text-base sm:text-lg text-[#1D3557] flex items-center gap-2">
                  <Grid className="w-5 h-5 text-[#E63946]" />
                  DIMENSION & COEFFICIENTS
                </span>
                
                {/* Size select */}
                <div className="flex items-center gap-3 bg-[#F5F1E8] px-3 py-1.5 border border-[#1D3557]/20">
                  <span className="font-body text-xs font-bold text-[#1D3557]">SIZE:</span>
                  {[2, 3, 4].map(s => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`font-body text-xs px-2 py-0.5 font-bold transition-all ${
                        size === s ? 'bg-[#1D3557] text-[#F5F1E8]' : 'text-[#1D3557]/60 hover:text-[#1D3557]'
                      }`}
                    >
                      {s}x{s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid Bracket System */}
              <div className="space-y-6">
                <div className="flex flex-col gap-6">
                  
                  {/* Matrix A Grid */}
                  <div className="w-full">
                    <span className="font-body text-xs font-bold text-[#E63946] block mb-2">MATRIX A =</span>
                    <div className="flex justify-center">
                      <div 
                        className="matrix-bracket p-3 sm:p-4 grid gap-2"
                        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
                      >
                        {Array(size).fill(0).map((_, r) => 
                          Array(size).fill(0).map((_, c) => (
                            <input
                              key={`a-${r}-${c}`}
                              type="number"
                              value={matA[r][c] || ''}
                              onChange={(e) => handleCellChange('A', r, c, e.target.value)}
                              className="input-vintage text-center font-bold text-xs sm:text-sm bg-transparent border-b-2 border-[#1D3557]/30 focus:border-[#E63946] focus:bg-[#E63946]/5 py-1.5 px-1 outline-none transition-all"
                              style={{ height: '40px', minWidth: '40px' }}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Matrix B Grid */}
                  <div className="w-full">
                    <span className="font-body text-xs font-bold text-[#E63946] block mb-2">MATRIX B =</span>
                    <div className="flex justify-center">
                      <div 
                        className="matrix-bracket p-3 sm:p-4 grid gap-2"
                        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
                      >
                        {Array(size).fill(0).map((_, r) => 
                          Array(size).fill(0).map((_, c) => (
                            <input
                              key={`b-${r}-${c}`}
                              type="number"
                              value={matB[r][c] || ''}
                              onChange={(e) => handleCellChange('B', r, c, e.target.value)}
                              className="input-vintage text-center font-bold text-xs sm:text-sm bg-transparent border-b-2 border-[#1D3557]/30 focus:border-[#E63946] focus:bg-[#E63946]/5 py-1.5 px-1 outline-none transition-all"
                              style={{ height: '40px', minWidth: '40px' }}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column Vector b for Ax = b system */}
                <div className="border-t border-dashed border-[#1D3557]/10 pt-4">
                  <span className="font-body text-xs font-bold text-[#E63946] block mb-2">VECTOR b = (for Ax = b system solver)</span>
                  <div className="flex justify-center">
                    <div className="flex gap-2 sm:gap-3 bg-[#F5F1E8] p-3 sm:p-4 border border-[#1D3557]/10 rounded flex-wrap justify-center">
                      {Array(size).fill(0).map((_, idx) => (
                        <div key={`vec-${idx}`} className="flex flex-col items-center">
                          <span className="font-body text-[10px] text-[#1D3557]/50 mb-1">b_{idx + 1}</span>
                          <input
                            type="number"
                            value={vectorB[idx] || ''}
                            onChange={(e) => handleVectorChange(idx, e.target.value)}
                            className="w-14 sm:w-16 input-vintage text-center font-bold text-xs sm:text-sm bg-transparent border-b-2 border-[#1D3557]/30 focus:border-[#E63946] py-1 outline-none transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Presets and JSON buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex gap-1.5">
                    <button onClick={() => loadPreset('random')} className="ticket-btn text-[10px] py-1 px-3 bg-[#1D3557] hover:bg-[#E63946] text-white">🎲 Random</button>
                    <button onClick={() => loadPreset('identity')} className="ticket-btn text-[10px] py-1 px-3 bg-[#1D3557] hover:bg-[#E63946] text-white">👁 Identity</button>
                    <button onClick={() => loadPreset('clear')} className="ticket-btn text-[10px] py-1 px-3 bg-red-800 text-white"><Trash2 className="w-3 h-3 inline mr-1" /> Clear</button>
                  </div>

                  <button 
                    onClick={() => setShowJsonPaste(!showJsonPaste)} 
                    className="font-body text-xs font-bold text-[#E63946] hover:underline"
                  >
                    {showJsonPaste ? 'Hide Paste Box' : '⌨ Paste JSON Schematic'}
                  </button>
                </div>

                {/* JSON Paste container */}
                {showJsonPaste && (
                  <div className="space-y-3 bg-[#F5F1E8] p-4 border border-[#1D3557]/20 mt-3 animate-fadeIn">
                    <label className="font-body text-xs font-bold text-[#1D3557]">Paste Array Matrix Schema:</label>
                    <textarea 
                      value={jsonPaste} 
                      onChange={(e) => setJsonPaste(e.target.value)}
                      placeholder='e.g., {"A": [[1,2,3],[4,5,6],[7,8,9]], "b": [10,11,12]}'
                      className="w-full h-24 p-2 bg-white text-xs border-2 border-[#1D3557]/20 font-body outline-none"
                    />
                    <button 
                      onClick={handleJsonSubmit}
                      className="ticket-btn text-[10px] py-1 px-3 bg-[#1D3557] hover:bg-[#E63946] text-white flex items-center justify-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      LOAD MATRIX SCHEMATIC
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Calculations & Output Ledger */}
          <div className="space-y-6 w-full">
            <div className="scroll-reveal vintage-menu-card p-4 sm:p-6" style={{ transitionDelay: '0.3s' }}>
              <div className="border-b-2 dashed border-[#1D3557]/20 pb-4 mb-4">
                <span className="font-display text-lg text-[#1D3557] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#E63946]" />
                  CALCULATOR ACTION TICKETS
                </span>
              </div>

              {/* Action grid */}
              <div className="flex flex-wrap gap-2.5 justify-center py-2">
                <button onClick={() => runOperation('add')} className="ticket-btn text-xs py-2 px-3">Add [A + B]</button>
                <button onClick={() => runOperation('multiply')} className="ticket-btn text-xs py-2 px-3">Multiply [A × B]</button>
                <button onClick={() => runOperation('transpose')} className="ticket-btn text-xs py-2 px-3">Transpose [Aᵀ]</button>
                <button onClick={() => runOperation('det')} className="ticket-btn text-xs py-2 px-3">Determinant |A|</button>
                <button onClick={() => runOperation('inverse')} className="ticket-btn text-xs py-2 px-3">Inverse [A⁻¹]</button>
                <button onClick={() => runOperation('solve')} className="ticket-btn text-xs py-2 px-3 bg-[#E63946] hover:bg-[#1D3557] text-white">Solve System [Ax = b]</button>
                <button onClick={() => runOperation('eigen')} className="ticket-btn text-xs py-2 px-3 bg-[#E63946] hover:bg-[#1D3557] text-white">Eigenvalues [λ]</button>
              </div>

              {/* Error Box */}
              {errorBox && (
                <div className="error-ticket mt-4">
                  <p className="font-body text-xs font-bold leading-relaxed">{errorBox}</p>
                </div>
              )}

              {/* Output Paper log */}
              <div className="relative mt-6">
                <span className="absolute top-2 right-4 font-display text-[9px] text-[#C5A059] font-bold tracking-widest z-10">LEDGER SHEET OUT</span>
                <pre className="w-full text-xs bg-[#F4ECD8] text-[#332211] font-body p-5 border-2 border-[#C5A059] rounded-sm max-h-[360px] overflow-y-auto shadow-inner leading-relaxed whitespace-pre-wrap">
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

export default MatrixLab;
