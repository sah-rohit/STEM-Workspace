import { useState, useEffect, useRef } from 'react';
import { Cpu, Play, Trash2 } from 'lucide-react';

interface Gate {
  id: number;
  type: 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR' | 'XNOR';
  in1: string; // 'A', 'B', 'C', 'D' or 'G1', 'G2', etc.
  in2?: string; // same, optional for NOT
}

const CircuitSimulator = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Switches states
  const [switchA, setSwitchA] = useState<boolean>(false);
  const [switchB, setSwitchB] = useState<boolean>(false);
  const [switchC, setSwitchC] = useState<boolean>(false);
  const [switchD, setSwitchD] = useState<boolean>(false);

  // Logic Gates List
  const [gates, setGates] = useState<Gate[]>([
    { id: 1, type: 'AND', in1: 'A', in2: 'B' },
    { id: 2, type: 'NOT', in1: 'C' },
    { id: 3, type: 'OR', in1: 'G1', in2: 'G2' }
  ]);

  // UI state for adding new gate
  const [newType, setNewType] = useState<Gate['type']>('AND');
  const [newIn1, setNewIn1] = useState<string>('A');
  const [newIn2, setNewIn2] = useState<string>('B');

  // Boolean Expression Input
  const [boolExpr, setBoolExpr] = useState<string>('(A AND B) OR (NOT C)');
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

  // Recalculate circuit when gates, inputs or wiring changes
  useEffect(() => {
    evaluateCircuitAndDraw();
  }, [gates, switchA, switchB, switchC, switchD]);

  // Core Evaluation Algorithm
  const evaluateState = (
    swA: boolean, swB: boolean, swC: boolean, swD: boolean,
    customGates: Gate[] = gates
  ): { outputs: { [key: number]: boolean }; finalOut: boolean; hasCycle: boolean } => {
    const values: { [key: string]: boolean } = {
      'A': swA, 'B': swB, 'C': swC, 'D': swD
    };
    const outputs: { [key: number]: boolean } = {};
    
    // Directed graph evaluation with dependency resolution & cycle checks
    let resolvedCount = 0;
    const maxCycles = 100;
    let iterations = 0;
    let hasCycle = false;

    while (resolvedCount < customGates.length && iterations < maxCycles) {
      let progress = false;
      customGates.forEach(g => {
        if (outputs[g.id] !== undefined) return; // already solved

        const val1 = g.in1.startsWith('G') ? outputs[parseInt(g.in1.substring(1))] : values[g.in1];
        const val2 = g.in2 && g.in2.startsWith('G') ? outputs[parseInt(g.in2.substring(1))] : (g.in2 ? values[g.in2] : undefined);

        if (val1 !== undefined && (g.type === 'NOT' || val2 !== undefined)) {
          let outVal = false;
          const v1 = val1;
          const v2 = val2 ?? false;

          switch (g.type) {
            case 'AND': outVal = v1 && v2; break;
            case 'OR': outVal = v1 || v2; break;
            case 'NOT': outVal = !v1; break;
            case 'NAND': outVal = !(v1 && v2); break;
            case 'NOR': outVal = !(v1 || v2); break;
            case 'XOR': outVal = v1 !== v2; break;
            case 'XNOR': outVal = v1 === v2; break;
          }
          outputs[g.id] = outVal;
          resolvedCount++;
          progress = true;
        }
      });

      if (!progress) {
        hasCycle = true;
        break;
      }
      iterations++;
    }

    if (iterations >= maxCycles) hasCycle = true;

    // The output of the circuit is the output of the last gate in the list
    const finalVal = customGates.length > 0 && !hasCycle ? (outputs[customGates[customGates.length - 1].id] ?? false) : false;

    return { outputs, finalOut: finalVal, hasCycle };
  };

  // Compile and draw Canvas layout
  const evaluateCircuitAndDraw = () => {
    setErrorBox(null);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid backdrop
    ctx.strokeStyle = 'rgba(0, 40, 104, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 20; x < canvas.width; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 20; y < canvas.height; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    const { outputs, finalOut, hasCycle } = evaluateState(switchA, switchB, switchC, switchD);

    if (hasCycle) {
      setErrorBox("CRITICAL FEEDBACK LOOP DETECTED: Circuits must form a Directed Acyclic Graph (DAG). Backwards connections not permitted.");
      return;
    }

    // Coordinates and positions setup
    const inputX = 50;
    const inputSpacing = canvas.height / 5;
    const inputPos: { [key: string]: { x: number; y: number } } = {
      'A': { x: inputX, y: inputSpacing },
      'B': { x: inputX, y: inputSpacing * 2 },
      'C': { x: inputX, y: inputSpacing * 3 },
      'D': { x: inputX, y: inputSpacing * 4 }
    };

    // Draw Inputs switches
    Object.keys(inputPos).forEach(key => {
      const pos = inputPos[key];
      const val = key === 'A' ? switchA : key === 'B' ? switchB : key === 'C' ? switchC : switchD;

      ctx.fillStyle = val ? '#E63946' : '#1D3557';
      ctx.strokeStyle = '#1D3557';
      ctx.lineWidth = 2.5;

      // Circle representing binding terminal node
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 14, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFDF0';
      ctx.font = 'bold 11px "Cutive Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(key, pos.x, pos.y + 4);

      // Value label below
      ctx.fillStyle = '#1D3557';
      ctx.font = '9px "Special Elite", monospace';
      ctx.fillText(val ? "HIGH(1)" : "LOW(0)", pos.x, pos.y + 26);
    });

    // Map gates to screen columns
    const gatePos: { [key: number]: { x: number; y: number } } = {};
    const colSpacing = (canvas.width - 150) / (gates.length + 1);

    gates.forEach((g, idx) => {
      const x = inputX + 100 + idx * colSpacing;
      // Vertically space out gates
      const y = canvas.height / 2 + (idx % 2 === 0 ? -30 : 30);
      gatePos[g.id] = { x, y };
    });

    // Draw wiring connections
    gates.forEach(g => {
      const pos = gatePos[g.id];

      // Draw Input 1 line
      const src1 = g.in1.startsWith('G') ? gatePos[parseInt(g.in1.substring(1))] : inputPos[g.in1];
      const val1 = g.in1.startsWith('G') ? (outputs[parseInt(g.in1.substring(1))] ?? false) : (g.in1 === 'A' ? switchA : g.in1 === 'B' ? switchB : g.in1 === 'C' ? switchC : switchD);

      if (src1) {
        ctx.strokeStyle = val1 ? '#E63946' : '#1D3557';
        ctx.lineWidth = val1 ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.moveTo(src1.x, src1.y);
        ctx.bezierCurveTo(src1.x + 30, src1.y, pos.x - 30, pos.y - (g.type === 'NOT' ? 0 : 8), pos.x, pos.y - (g.type === 'NOT' ? 0 : 8));
        ctx.stroke();
      }

      // Draw Input 2 line
      if (g.in2) {
        const src2 = g.in2.startsWith('G') ? gatePos[parseInt(g.in2.substring(1))] : inputPos[g.in2];
        const val2 = g.in2.startsWith('G') ? (outputs[parseInt(g.in2.substring(1))] ?? false) : (g.in2 === 'A' ? switchA : g.in2 === 'B' ? switchB : g.in2 === 'C' ? switchC : switchD);

        if (src2) {
          ctx.strokeStyle = val2 ? '#E63946' : '#1D3557';
          ctx.lineWidth = val2 ? 2.5 : 1.5;
          ctx.beginPath();
          ctx.moveTo(src2.x, src2.y);
          ctx.bezierCurveTo(src2.x + 30, src2.y, pos.x - 30, pos.y + 8, pos.x, pos.y + 8);
          ctx.stroke();
        }
      }
    });

    // Draw Logic Gate Symbols
    gates.forEach(g => {
      const pos = gatePos[g.id];
      const val = outputs[g.id] ?? false;

      ctx.fillStyle = '#FFFDF0';
      ctx.strokeStyle = '#1D3557';
      ctx.lineWidth = 3;

      // Draw metallic enclosure card
      ctx.beginPath();
      ctx.roundRect(pos.x - 22, pos.y - 18, 44, 36, 4);
      ctx.fill();
      ctx.stroke();

      // Draw internal gate label
      ctx.fillStyle = '#1D3557';
      ctx.font = 'bold 9px "Cutive Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(g.type, pos.x, pos.y + 3);

      // Draw Gate index above
      ctx.font = '7px "Special Elite", monospace';
      ctx.fillText(`[G${g.id}]`, pos.x, pos.y - 22);

      // Value light
      ctx.fillStyle = val ? '#E63946' : '#1D3557';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y + 11, 3.5, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw final output receiver LED
    const outX = canvas.width - 50;
    const outY = canvas.height / 2;
    const lastGate = gates[gates.length - 1];

    if (lastGate) {
      const lastPos = gatePos[lastGate.id];
      ctx.strokeStyle = finalOut ? '#E63946' : '#1D3557';
      ctx.lineWidth = finalOut ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(outX, outY);
      ctx.stroke();
    }

    // Output LED Bulb
    ctx.fillStyle = finalOut ? '#E63946' : '#1D3557';
    ctx.strokeStyle = '#1D3557';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(outX, outY, 15, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Bulb glow ring
    if (finalOut) {
      ctx.strokeStyle = 'rgba(230, 57, 70, 0.4)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(outX, outY, 20, 0, 2 * Math.PI);
      ctx.stroke();
    }

    ctx.fillStyle = '#FFFDF0';
    ctx.font = 'bold 12px "Cutive Mono", monospace';
    ctx.fillText("OUT", outX, outY + 4);

    ctx.fillStyle = '#1D3557';
    ctx.font = '9px "Special Elite", monospace';
    ctx.fillText(finalOut ? "HIGH (1)" : "LOW (0)", outX, outY + 28);

    // Compile Truth Table Log Output
    compileTruthTable();
  };

  const compileTruthTable = () => {
    let log = `BOOLEAN ALGEBRA TRUTH TABLE LEDGER:\n`;
    log += `------------------------------------------------------------\n`;
    log += ` INPUT SWITCHES      |  APPARATUS INTERNALS  | FINAL OUTPUT \n`;
    log += `  A   B   C   D      |   G1    G2    ...     |     Y (OUT)  \n`;
    log += `------------------------------------------------------------\n`;

    for (let a = 0; a < 2; a++) {
      for (let b = 0; b < 2; b++) {
        for (let c = 0; c < 2; c++) {
          for (let d = 0; d < 2; d++) {
            const valA = a === 1;
            const valB = b === 1;
            const valC = c === 1;
            const valD = d === 1;

            const { outputs, finalOut } = evaluateState(valA, valB, valC, valD);
            
            const inStr = `  ${a}   ${b}   ${c}   ${d}      `;
            let gateOuts = '';
            gates.slice(0, 3).forEach(g => {
              gateOuts += `[G${g.id}:${outputs[g.id] ? 1 : 0}] `;
            });
            
            log += `${inStr} | ${gateOuts.padEnd(21)} |      ${finalOut ? 1 : 0}\n`;
          }
        }
      }
    }
    log += `------------------------------------------------------------\n`;
    log += `SYSTEM CALIBRATION CODE: 1956-LOGIC-SIM`;
    setLogOutput(log);
  };

  // Expression Evaluator & Compiler
  const compileExpression = () => {
    setErrorBox(null);
    let clean = boolExpr.replace(/\s+/g, ' ').trim().toUpperCase();
    if (!clean) return;

    try {
      // Basic expression validator and binary tree builder
      // Supports expressions like "(A AND B) OR (NOT C)"
      // Let's parse tokens
      const tokens = clean.match(/\(|\)|AND|OR|NOT|NAND|NOR|XOR|XNOR|[A-D]/g);
      if (!tokens) throw new Error("Expression lacks recognizable variables or logical connectors.");

      // Shunting-yard algorithm to evaluate and structure into postfix/tree format
      const outputQueue: string[] = [];
      const operatorStack: string[] = [];
      const precedence: { [key: string]: number } = {
        'OR': 1, 'NOR': 1, 'XOR': 1, 'XNOR': 1,
        'AND': 2, 'NAND': 2,
        'NOT': 3
      };

      tokens.forEach(tok => {
        if (/[A-D]/.test(tok)) {
          outputQueue.push(tok);
        } else if (tok === '(') {
          operatorStack.push(tok);
        } else if (tok === ')') {
          while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
            outputQueue.push(operatorStack.pop()!);
          }
          if (operatorStack.length === 0) throw new Error("Unbalanced parentheses in logic string.");
          operatorStack.pop(); // discard '('
        } else {
          // operator
          while (
            operatorStack.length > 0 &&
            operatorStack[operatorStack.length - 1] !== '(' &&
            precedence[operatorStack[operatorStack.length - 1]] >= precedence[tok]
          ) {
            outputQueue.push(operatorStack.pop()!);
          }
          operatorStack.push(tok);
        }
      });

      while (operatorStack.length > 0) {
        const top = operatorStack.pop()!;
        if (top === '(' || top === ')') throw new Error("Parenthesis mismatch error.");
        outputQueue.push(top);
      }

      // Reconstruct gate network list from Postfix evaluation
      const stack: string[] = [];
      const compiledGates: Gate[] = [];
      let gId = 1;

      outputQueue.forEach(tok => {
        if (/[A-D]/.test(tok)) {
          stack.push(tok);
        } else {
          // logic gate operator
          if (tok === 'NOT') {
            if (stack.length < 1) throw new Error("NOT gate operator lacks operand.");
            const op1 = stack.pop()!;
            compiledGates.push({ id: gId, type: 'NOT', in1: op1 });
            stack.push(`G${gId}`);
            gId++;
          } else {
            if (stack.length < 2) throw new Error(`${tok} gate operator requires two inputs.`);
            const op2 = stack.pop()!;
            const op1 = stack.pop()!;
            compiledGates.push({ id: gId, type: tok as any, in1: op1, in2: op2 });
            stack.push(`G${gId}`);
            gId++;
          }
        }
      });

      if (stack.length !== 1) throw new Error("Compilation completed with redundant dangling wires.");

      setGates(compiledGates);
      window.showAtelierToast("Logic network compiled successfully!", "success");
    } catch (e: any) {
      setErrorBox(`🚨 ALGEBRA COMPILER BLOCKED:\n${e.message}`);
    }
  };

  const handleAddGate = () => {
    // Avoid circular referencing
    if (newIn1.startsWith('G') && parseInt(newIn1.substring(1)) >= gates.length + 1) return;
    if (newIn2.startsWith('G') && parseInt(newIn2.substring(1)) >= gates.length + 1) return;

    const nextId = gates.length > 0 ? Math.max(...gates.map(g => g.id)) + 1 : 1;
    const newGate: Gate = {
      id: nextId,
      type: newType,
      in1: newIn1,
      in2: newType !== 'NOT' ? newIn2 : undefined
    };

    setGates(prev => [...prev, newGate]);
    window.showAtelierToast(`Gate G${nextId} added to logic board.`, "info");
  };

  const handleDeleteGate = (id: number) => {
    // Cascade check: do other gates depend on this?
    const dependents = gates.filter(g => g.in1 === `G${id}` || g.in2 === `G${id}`);
    if (dependents.length > 0) {
      window.showAtelierToast(`Cannot delete G${id}. Other gates depend on its output wire.`, "warning");
      return;
    }

    setGates(prev => prev.filter(g => g.id !== id));
  };

  return (
    <div ref={sectionRef} className="w-full py-4 space-y-6" id="logic-gate-simulator">
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Input panel */}
        <div className="space-y-6">
          <div className="scroll-reveal">
            <span className="geo-block-red text-[11px] font-bold tracking-widest inline-flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              LABORATORY APPARATUS MODULE VI
            </span>
            <h2 className="font-display text-xl sm:text-3xl text-[#1D3557] mt-3">BOOLEAN LOGIC GATE APP</h2>
            <p className="font-body text-xs text-[#1D3557]/70 uppercase tracking-widest mt-1">Directed Acyclic Propagation Visualizer</p>
            <div className="line-separator max-w-sm mt-3" />
          </div>

          {/* Toggle Switches Console */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              🔌 POWER CONSOLE SWITCHES
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              {[
                { name: 'A', state: switchA, set: setSwitchA },
                { name: 'B', state: switchB, set: setSwitchB },
                { name: 'C', state: switchC, set: setSwitchC },
                { name: 'D', state: switchD, set: setSwitchD }
              ].map((sw) => (
                <button
                  key={sw.name}
                  onClick={() => sw.set(!sw.state)}
                  className={`ticket-btn py-2 px-1 text-[11px] border border-transparent font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    sw.state ? 'bg-[#E63946] text-[#FFFDF0]' : 'bg-[#1D3557] text-[#FFFDF0]'
                  }`}
                >
                  <span className="text-sm font-bold">{sw.name}</span>
                  <span className="text-[8px] font-normal">{sw.state ? "ON" : "OFF"}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Gate Assembler */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              🛠 MANUAL WIRE BOARD ASSEMBLER
            </span>
            <div className="space-y-3 font-body text-xs text-[#1D3557]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-bold block mb-1">GATE TYPE:</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full font-body text-[11px] font-bold bg-[#F5F1E8] border border-[#1D3557] py-1 px-1.5"
                  >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                    <option value="NOT">NOT</option>
                    <option value="NAND">NAND</option>
                    <option value="NOR">NOR</option>
                    <option value="XOR">XOR</option>
                    <option value="XNOR">XNOR</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">INPUT 1:</label>
                  <select
                    value={newIn1}
                    onChange={(e) => setNewIn1(e.target.value)}
                    className="w-full font-body text-[11px] font-bold bg-[#F5F1E8] border border-[#1D3557] py-1 px-1.5"
                  >
                    <optgroup label="Switches">
                      <option value="A">Switch A</option>
                      <option value="B">Switch B</option>
                      <option value="C">Switch C</option>
                      <option value="D">Switch D</option>
                    </optgroup>
                    {gates.length > 0 && (
                      <optgroup label="Gate Outputs">
                        {gates.map(g => (
                          <option key={g.id} value={`G${g.id}`}>Gate output G{g.id}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                {newType !== 'NOT' && (
                  <div>
                    <label className="font-bold block mb-1">INPUT 2:</label>
                    <select
                      value={newIn2}
                      onChange={(e) => setNewIn2(e.target.value)}
                      className="w-full font-body text-[11px] font-bold bg-[#F5F1E8] border border-[#1D3557] py-1 px-1.5"
                    >
                      <optgroup label="Switches">
                        <option value="A">Switch A</option>
                        <option value="B">Switch B</option>
                        <option value="C">Switch C</option>
                        <option value="D">Switch D</option>
                      </optgroup>
                      {gates.length > 0 && (
                        <optgroup label="Gate Outputs">
                          {gates.map(g => (
                            <option key={g.id} value={`G${g.id}`}>Gate output G{g.id}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                )}
              </div>

              <button
                onClick={handleAddGate}
                className="w-full ticket-btn py-1.5 text-xs bg-[#1D3557] hover:bg-[#E63946] flex items-center justify-center gap-1.5"
              >
                [ CONNECT GATE TO GRID ]
              </button>
            </div>

            {/* Configured gates list */}
            {gates.length > 0 && (
              <div className="mt-4 border-t border-dashed border-[#1D3557]/15 pt-3">
                <span className="font-display text-[10px] text-[#C5A059] block mb-2">SCHEMATIC LOGGED COMPONENTS:</span>
                <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
                  {gates.map(g => (
                    <div key={g.id} className="flex items-center justify-between gap-2 bg-[#F5F1E8] px-2.5 py-1.5 border border-[#1D3557]/10 font-body text-[11px] text-[#1D3557] overflow-hidden">
                      <span className="font-bold truncate pr-1">[G{g.id}] {g.type} ({g.in1}{g.in2 ? `, ${g.in2}` : ''})</span>
                      <button 
                        onClick={() => handleDeleteGate(g.id)}
                        className="text-[#E63946] hover:underline flex items-center font-bold text-[10px] flex-shrink-0"
                      >
                        <Trash2 className="w-3 h-3 mr-0.5" /> SHRED
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Algebra compiler input */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              ⌨ BOOLEAN FORMULA COMPILER
            </span>
            <div className="space-y-3 font-body text-xs">
              <input
                type="text"
                value={boolExpr}
                onChange={(e) => setBoolExpr(e.target.value)}
                placeholder="e.g. (A AND B) OR NOT C"
                className="w-full input-vintage text-xs font-bold text-[#1D3557] bg-[#F5F1E8] border border-[#1D3557] py-2 px-3 outline-none"
              />
              <span className="font-body text-[9px] text-[#1D3557]/50 block leading-normal">
                Supported logical operations: <code>AND, OR, NOT, NAND, NOR, XOR, XNOR</code>
              </span>
              <button
                onClick={compileExpression}
                className="w-full ticket-btn py-1.5 text-xs flex items-center justify-center gap-2 bg-[#E63946] hover:bg-[#1D3557]"
              >
                <Play className="w-3.5 h-3.5" />
                [ MAP EQUATION TO WIRING ]
              </button>
            </div>
          </div>
        </div>

        {/* Right Output panel */}
        <div className="space-y-6">
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-xs sm:text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              📐 BLUEPRINT SCHEMATIC MAP
            </span>
            
            {/* Responsive canvas wrapper */}
            <div className="bg-[#F4ECD8] border-2 border-[#C5A059] p-2 sm:p-3 shadow-inner rounded-sm overflow-x-auto w-full">
              <canvas
                ref={canvasRef}
                width="520"
                height="260"
                className="block bg-[#F4ECD8] border border-[#C5A059]/40 w-full h-auto aspect-[2/1] min-h-0"
              />
            </div>

            {/* Error box */}
            {errorBox && (
              <div className="error-ticket mt-4 text-xs font-bold leading-normal">
                {errorBox}
              </div>
            )}

            {/* Truth Table scrolling ticker */}
            <div className="relative mt-4">
              <span className="absolute top-2 right-4 font-display text-[9px] text-[#C5A059] font-bold tracking-widest z-10">LOGIC LEDGER OUT</span>
              <pre className="w-full text-[10px] bg-[#F4ECD8] text-[#332211] font-body p-4 border-2 border-[#C5A059] rounded-sm max-h-[220px] overflow-x-auto overflow-y-auto shadow-inner leading-normal whitespace-pre-wrap">
                {logOutput || 'BOARD READY. ADD COMPONENTS OR ENTER AN EQUATION.'}
              </pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CircuitSimulator;
