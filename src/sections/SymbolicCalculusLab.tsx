import React, { useState, useEffect, useRef } from 'react';
import { Cpu } from 'lucide-react';
import * as math from 'mathjs';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface Step {
  explanation: string;
  latex: string;
}

const SymbolicCalculusLab = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Core inputs
  const [exprString, setExprString] = useState<string>('sin(x^2) * exp(3*x)');
  const [variable, setVariable] = useState<string>('x');
  const [derivativeResult, setDerivativeResult] = useState<string>('');
  const [treeWidth, setTreeWidth] = useState<number>(320);
  const [treeHeight, setTreeHeight] = useState<number>(200);
  const [steps, setSteps] = useState<Step[]>([]);
  const [astTree, setAstTree] = useState<any>(null);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [errorBox, setErrorBox] = useState<string | null>(null);
  const [logOutput, setLogOutput] = useState<string>('');

  // Scroll animations observer
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

  // Recalculate derivative, steps, and AST tree when inputs change
  useEffect(() => {
    processCalculus();
  }, [exprString, variable]);

  // Deep recursive custom step-by-step derivative explainer
  const generateSteps = (node: math.MathNode, varName: string): { derivative: math.MathNode; stepsList: Step[] } => {
    const stepsList: Step[] = [];

    const helper = (currNode: math.MathNode): math.MathNode => {
      const curr = currNode as any;

      // 1. Constant Nodes
      if (curr.isConstantNode) {
        const d = new math.ConstantNode(0);
        stepsList.push({
          explanation: `Derivative of a constant value \\(${curr.toString()}\\) is 0:`,
          latex: `\\frac{d}{d${varName}}\\left[${curr.toTex()}\\right] = 0`
        });
        return d;
      }

      // 2. Symbol Nodes (Variables)
      if (curr.isSymbolNode) {
        if (curr.name === varName) {
          const d = new math.ConstantNode(1);
          stepsList.push({
            explanation: `Derivative of the independent variable \\(${varName}\\) is 1:`,
            latex: `\\frac{d}{d${varName}}\\left[${curr.toTex()}\\right] = 1`
          });
          return d;
        } else {
          const d = new math.ConstantNode(0);
          stepsList.push({
            explanation: `Derivative of independent constant symbol \\(${curr.name}\\) with respect to \\(${varName}\\) is 0:`,
            latex: `\\frac{d}{d${varName}}\\left[${curr.toTex()}\\right] = 0`
          });
          return d;
        }
      }

      // 3. Parenthesis node (transparent)
      if (curr.isParenthesisNode) {
        return new math.ParenthesisNode(helper(curr.content));
      }

      // 4. Operator Nodes
      if (curr.isOperatorNode) {
        const op = curr.op;
        const args = curr.args || [];

        // Sum and Difference Rules: f(x) +/- g(x)
        if (op === '+' || op === '-') {
          const df = helper(args[0]);
          const dg = helper(args[1]);
          const d = new math.OperatorNode(op, (op === '+' ? 'add' : 'subtract') as any, [df, dg]);
          
          stepsList.push({
            explanation: `Apply Sum/Difference Rule: Differentiate each term independently:`,
            latex: `\\frac{d}{d${varName}}\\left[${args[0].toTex()} ${op} ${args[1].toTex()}\\right] = \\frac{d}{d${varName}}\\left[${args[0].toTex()}\\right] ${op} \\frac{d}{d${varName}}\\left[${args[1].toTex()}\\right]`
          });
          return d;
        }

        // Product Rule: f(x) * g(x)
        if (op === '*') {
          const f = args[0] as any;
          const g = args[1] as any;
          
          // Check if one side is a simple constant scalar to simplify description
          if (f.isConstantNode) {
            const dg = helper(g);
            const d = new math.OperatorNode('*', 'multiply' as any, [f, dg]);
            stepsList.push({
              explanation: `Constant Multiple Rule: Extract the scalar factor \\(${f.toString()}\\) and differentiate the variable term:`,
              latex: `\\frac{d}{d${varName}}\\left[${f.toTex()} \\cdot ${g.toTex()}\\right] = ${f.toTex()} \\cdot \\frac{d}{d${varName}}\\left[${g.toTex()}\\right]`
            });
            return d;
          }

          const df = helper(f);
          const dg = helper(g);
          
          // (df * g) + (f * dg)
          const df_g = new math.OperatorNode('*', 'multiply' as any, [df, g]);
          const f_dg = new math.OperatorNode('*', 'multiply' as any, [f, dg]);
          const d = new math.OperatorNode('+', 'add' as any, [df_g, f_dg]);

          stepsList.push({
            explanation: `Apply Product Rule: \\((f \\cdot g)' = f'g + fg'\\):`,
            latex: `\\frac{d}{d${varName}}\\left[${f.toTex()} \\cdot ${g.toTex()}\\right] = \\left(\\frac{d}{d${varName}}\\left[${f.toTex()}\\right] \\cdot ${g.toTex()}\\right) + \\left(${f.toTex()} \\cdot \\frac{d}{d${varName}}\\left[${g.toTex()}\\right]\\right)`
          });
          return d;
        }

        // Quotient Rule: f(x) / g(x)
        if (op === '/') {
          const f = args[0];
          const g = args[1];
          const df = helper(f);
          const dg = helper(g);

          // ((df * g) - (f * dg)) / g^2
          const df_g = new math.OperatorNode('*', 'multiply' as any, [df, g]);
          const f_dg = new math.OperatorNode('*', 'multiply' as any, [f, dg]);
          const num = new math.OperatorNode('-', 'subtract' as any, [df_g, f_dg]);
          const den = new math.OperatorNode('^', 'pow' as any, [g, new math.ConstantNode(2)]);
          const d = new math.OperatorNode('/', 'divide' as any, [num, den]);

          stepsList.push({
            explanation: `Apply Quotient Rule: \\(\\left(\\frac{f}{g}\\right)' = \\frac{f'g - fg'}{g^2}\\):`,
            latex: `\\frac{d}{d${varName}}\\left[\\frac{${f.toTex()}}{${g.toTex()}}\\right] = \\frac{\\left(\\frac{d}{d${varName}}\\left[${f.toTex()}\\right] \\cdot ${g.toTex()}\\right) - \\left(${f.toTex()} \\cdot \\frac{d}{d${varName}}\\left[${g.toTex()}\\right]\\right)}{\\left(${g.toTex()}\\right)^2}`
          });
          return d;
        }

        // Power Rule: f(x) ^ g(x) where g(x) is constant
        if (op === '^') {
          const base = args[0] as any;
          const exponent = args[1] as any;

          if (exponent.isConstantNode) {
            const expVal = (exponent as math.ConstantNode).value;
            const newExp = new math.ConstantNode(Number(expVal) - 1);
            const subPower = new math.OperatorNode('^', 'pow' as any, [base, newExp]);
            
            // expVal * base^(expVal-1)
            const dBasePower = new math.OperatorNode('*', 'multiply' as any, [exponent, subPower]);
            
            // If base is just 'x', no chain rule needed
            if (base.isSymbolNode && base.name === varName) {
              stepsList.push({
                explanation: `Apply Power Rule: \\((x^n)' = n \\cdot x^{n-1}\\):`,
                latex: `\\frac{d}{d${varName}}\\left[${base.toTex()}^{${exponent.toTex()}}\\right] = ${exponent.toTex()} \\cdot ${base.toTex()}^{${newExp.toTex()}}`
              });
              return dBasePower;
            } else {
              // Apply chain rule
              const dBase = helper(base);
              const d = new math.OperatorNode('*', 'multiply' as any, [dBasePower, dBase]);
              stepsList.push({
                explanation: `Apply Power Rule combined with Chain Rule: \\((u^n)' = n \\cdot u^{n-1} \\cdot u'\\):`,
                latex: `\\frac{d}{d${varName}}\\left[${base.toTex()}^{${exponent.toTex()}}\\right] = ${exponent.toTex()} \\cdot ${base.toTex()}^{${newExp.toTex()}} \\cdot \\frac{d}{d${varName}}\\left[${base.toTex()}\\right]`
              });
              return d;
            }
          } else {
            // General base^exponent (f^g) -> exp(g * ln(f))
            stepsList.push({
              explanation: `General Power/Exponential Rule: Rewrite \\(f^g\\) as \\(e^{g \\ln(f)}\\) to differentiate:`,
              latex: `\\frac{d}{d${varName}}\\left[${base.toTex()}^{${exponent.toTex()}}\\right] = \\frac{d}{d${varName}}\\left[\\exp\\left(${exponent.toTex()} \\cdot \\ln\\left(${base.toTex()}\\right)\\right)\\right]`
            });
            const rewritten = new math.FunctionNode('exp', [
              new math.OperatorNode('*', 'multiply' as any, [exponent, new math.FunctionNode('log', [base])])
            ]);
            return helper(rewritten);
          }
        }
      }

      // 5. Function Nodes
      if (curr.isFunctionNode) {
        const name = curr.name;
        const arg = curr.args[0];
        const dArg = helper(arg);

        let dOuter: math.MathNode;
        let outerExplanation = '';
        let outerTex = '';

        if (name === 'sin') {
          dOuter = new math.FunctionNode('cos', [arg]);
          outerExplanation = `Derivative of \\(\\sin(u)\\) is \\(\\cos(u)\\).`;
          outerTex = `\\cos\\left(${arg.toTex()}\\right)`;
        } else if (name === 'cos') {
          dOuter = new math.OperatorNode('-', 'unaryMinus' as any, [new math.FunctionNode('sin', [arg])]);
          outerExplanation = `Derivative of \\(\\cos(u)\\) is \\(-\\sin(u)\\).`;
          outerTex = `-\\sin\\left(${arg.toTex()}\\right)`;
        } else if (name === 'tan') {
          dOuter = new math.OperatorNode('^', 'pow' as any, [new math.FunctionNode('sec', [arg]), new math.ConstantNode(2)]);
          outerExplanation = `Derivative of \\(\\tan(u)\\) is \\(\\sec^2(u)\\).`;
          outerTex = `\\sec^2\\left(${arg.toTex()}\\right)`;
        } else if (name === 'exp') {
          dOuter = new math.FunctionNode('exp', [arg]);
          outerExplanation = `Derivative of natural exponential \\(e^u\\) is \\(e^u\\).`;
          outerTex = `\\exp\\left(${arg.toTex()}\\right)`;
        } else if (name === 'log' || name === 'ln') {
          dOuter = new math.OperatorNode('/', 'divide' as any, [new math.ConstantNode(1), arg]);
          outerExplanation = `Derivative of natural logarithm \\(\\ln(u)\\) is \\(\\frac{1}{u}\\).`;
          outerTex = `\\frac{1}{${arg.toTex()}}`;
        } else if (name === 'sqrt') {
          dOuter = new math.OperatorNode('/', 'divide' as any, [
            new math.ConstantNode(1),
            new math.OperatorNode('*', 'multiply' as any, [new math.ConstantNode(2), new math.FunctionNode('sqrt', [arg])])
          ]);
          outerExplanation = `Derivative of square root \\(\\sqrt{u}\\) is \\(\\frac{1}{2\\sqrt{u}}\\).`;
          outerTex = `\\frac{1}{2\\sqrt{${arg.toTex()}}}`;
        } else {
          // General fallback
          const dSymbol = new math.SymbolNode(`d${name}`);
          dOuter = new math.FunctionNode(dSymbol, [arg]);
          outerExplanation = `Derivative of function \\(${name}(u)\\).`;
          outerTex = `${name}'\\left(${arg.toTex()}\\right)`;
        }

        // Apply Chain Rule
        if (arg.isSymbolNode && arg.name === varName) {
          stepsList.push({
            explanation: `${outerExplanation} (Standard derivative):`,
            latex: `\\frac{d}{d${varName}}\\left[${curr.toTex()}\\right] = ${outerTex}`
          });
          return dOuter;
        } else {
          const d = new math.OperatorNode('*', 'multiply' as any, [dOuter, dArg]);
          stepsList.push({
            explanation: `Apply Chain Rule: \\((f(u))' = f'(u) \\cdot u'\\) where \\(u = ${arg.toString()}\\):`,
            latex: `\\frac{d}{d${varName}}\\left[${curr.toTex()}\\right] = ${outerTex} \\cdot \\frac{d}{d${varName}}\\left[${arg.toTex()}\\right]`
          });
          return d;
        }
      }

      // General fallback
      return math.derivative(currNode, varName);
    };

    const finalDeriv = helper(node);
    return { derivative: finalDeriv, stepsList };
  };

  // Construct coordinates layout for responsive SVG AST visualizer
  const buildTreeLayout = (node: math.MathNode, depth = 0, xOffset = 0, nodeIdRef = { current: 0 }, maxDepthRef = { current: 0 }): { tree: any, width: number } => {
    if (!node) return { tree: null, width: 0 };
    if (depth > maxDepthRef.current) {
      maxDepthRef.current = depth;
    }

    const n = node as any;
    let label = '';
    let type = n.type;
    const nodeId = nodeIdRef.current++;

    if (n.isSymbolNode) {
      label = n.name;
    } else if (n.isConstantNode) {
      label = String(n.value);
    } else if (n.isOperatorNode) {
      label = n.op;
    } else if (n.isFunctionNode) {
      label = n.name;
    } else if (n.isParenthesisNode) {
      return buildTreeLayout(n.content, depth, xOffset, nodeIdRef, maxDepthRef);
    } else {
      label = n.type;
    }

    const args = n.args || [];
    if (args.length === 0) {
      return {
        tree: { id: nodeId, label, type, x: xOffset, y: depth * 60 + 30, children: [] },
        width: 60
      };
    }

    let currentX = xOffset;
    const children: any[] = [];
    args.forEach((arg: any) => {
      const childLayout = buildTreeLayout(arg, depth + 1, currentX, nodeIdRef, maxDepthRef);
      if (childLayout.tree) {
        children.push(childLayout.tree);
        currentX += childLayout.width;
      }
    });

    const width = Math.max(currentX - xOffset, 60);
    const x = xOffset + width / 2; // Center parent over children

    return {
      tree: { id: nodeId, label, type, x, y: depth * 60 + 30, children },
      width
    };
  };

  // Perform symbolic calculus actions
  const processCalculus = () => {
    setErrorBox(null);
    try {
      // 1. Parse using mathjs
      const parsed = math.parse(exprString);
      
      // 2. Compute derivative and explain step-by-step
      const { derivative, stepsList } = generateSteps(parsed, variable);
      
      // 3. Simplify equations
      const simplifiedDeriv = math.simplify(derivative);
      const simplifiedExpr = math.simplify(parsed);

      setDerivativeResult(derivative.toString());
      setSteps(stepsList);

      // 4. Build AST Tree coordinates layout
      const maxDepthRef = { current: 0 };
      const layoutResult = buildTreeLayout(parsed, 0, 0, { current: 0 }, maxDepthRef);
      setAstTree(layoutResult.tree);
      setTreeWidth(layoutResult.width);
      setTreeHeight(Math.max((maxDepthRef.current + 1) * 60 + 20, 200));

      // 5. Build printout log
      let log = `SYMBOLIC CALCULUS & EXPRESSION PARSER LEDGER:\n`;
      log += `------------------------------------------------------------\n`;
      log += `INPUT EXPRESSION:   ${exprString}\n`;
      log += `TARGET VARIABLE:    ${variable}\n`;
      log += `PARSED MATHJS AST:  ${parsed.type} root node structure\n`;
      log += `------------------------------------------------------------\n`;
      log += `ALGEBRAIC SIMPLIFIED INPUT:\n`;
      log += `  f(${variable}) = ${simplifiedExpr.toString()}\n\n`;
      log += `RAW SYMBOLIC DERIVATIVE (PRE-SIMPLIFIED):\n`;
      log += `  f'(${variable}) = ${derivative.toString()}\n\n`;
      log += `SIMPLIFIED SYMBOLIC DERIVATIVE:\n`;
      log += `  f'(${variable}) = ${simplifiedDeriv.toString()}\n`;
      log += `------------------------------------------------------------\n`;
      log += `SYSTEM STATUS: STABLE CLIENT-SIDE CALCULATION ENGINE`;
      setLogOutput(log);

    } catch (e: any) {
      setErrorBox(`🚨 MATHEMATICAL SINGULARITY / AST PARSE FAULT:\n${e.message}\n(Please verify parentheses balance and operators syntax.)`);
      setLogOutput(`CALCULATION ENGINE FAILURE. AWAITING VALID MATHEMATICAL SYMBOLIC EQUATIONS.`);
      setSteps([]);
      setAstTree(null);
    }
  };

  // SVG lines connector builder
  const renderTreeConnections = (node: any): React.ReactNode[] => {
    if (!node || !node.children) return [];
    let lines: React.ReactNode[] = [];
    node.children.forEach((child: any) => {
      lines.push(
        <line
          key={`line-${node.id}-${child.id}`}
          x1={node.x}
          y1={node.y}
          x2={child.x}
          y2={child.y}
          stroke="#1D3557"
          strokeWidth="2"
          strokeDasharray={child.children.length === 0 ? "none" : "3 3"}
          className="transition-all duration-500 animate-pulse"
        />
      );
      lines = lines.concat(renderTreeConnections(child));
    });
    return lines;
  };

  // SVG circles nodes builder
  const renderTreeNodes = (node: any): React.ReactNode[] => {
    if (!node) return [];
    let nodes: React.ReactNode[] = [];

    const isHovered = hoveredNode && hoveredNode.id === node.id;
    const isLeaf = node.children.length === 0;

    nodes.push(
      <g
        key={`node-${node.id}`}
        transform={`translate(${node.x}, ${node.y})`}
        className="cursor-pointer select-none group"
        onMouseEnter={() => setHoveredNode(node)}
        onMouseLeave={() => setHoveredNode(null)}
      >
        {/* Outer glowing border ring */}
        <circle
          r={isHovered ? "20" : "15"}
          fill={isLeaf ? "#FFFDF0" : "#E63946"}
          stroke="#1D3557"
          strokeWidth={isHovered ? "3.5" : "2"}
          className="transition-all duration-300 ease-out"
        />
        
        {/* Label in node circle */}
        <text
          textAnchor="middle"
          dy="4"
          fill={isLeaf ? "#1D3557" : "#FFFDF0"}
          fontSize="10"
          fontWeight="bold"
          fontFamily="monospace"
          className="transition-all duration-300"
        >
          {node.label}
        </text>
      </g>
    );

    node.children.forEach((child: any) => {
      nodes = nodes.concat(renderTreeNodes(child));
    });
    return nodes;
  };

  // Render LaTeX via KaTeX safe component helper
  const KaTeXRender = ({ tex, block = false }: { tex: string; block?: boolean }) => {
    const containerRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
      if (containerRef.current) {
        try {
          katex.render(tex, containerRef.current, {
            displayMode: block,
            throwOnError: false
          });
        } catch (e) {
          containerRef.current.innerText = tex;
        }
      }
    }, [tex, block]);

    return <span ref={containerRef} />;
  };

  return (
    <div ref={sectionRef} className="w-full py-4 space-y-6" id="symbolic-calculus-lab">
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Column: Inputs, Outcomes, Typewriter Printout */}
        <div className="space-y-6">
          <div className="scroll-reveal">
            <span className="geo-block-red text-[11px] font-bold tracking-widest inline-flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              LABORATORY APPARATUS MODULE XIV
            </span>
            <h2 className="font-display text-xl sm:text-3xl text-[#1D3557] mt-3">SYMBOLIC CALCULUS & SIMPLIFIER</h2>
            <p className="font-body text-xs text-[#1D3557]/70 uppercase tracking-widest mt-1">Computer Algebra System, step derivatives & AST Parse trees</p>
            <div className="line-separator max-w-sm mt-3" />
          </div>

          {/* Mathematical variables and strings inputs */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              🔬 MATHEMATICAL SYMBOLIC EQUATIONS REGISTERS
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-body text-xs text-[#1D3557]">
              <div className="col-span-1 sm:col-span-2">
                <label className="font-bold block mb-1">ENTER EXPRESSION f({variable}):</label>
                <input
                  type="text"
                  value={exprString}
                  onChange={(e) => setExprString(e.target.value)}
                  className="w-full input-vintage text-sm font-bold bg-[#F5F1E8] border-2 border-[#1D3557] py-2 px-3 focus:outline-none focus:border-[#E63946] text-[#1D3557] transition-all rounded-sm shadow-inner mt-1"
                  placeholder="e.g. sin(x^2) * e^(3x)"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">VARIABLE NAME:</label>
                <input
                  type="text"
                  value={variable}
                  onChange={(e) => setVariable(e.target.value)}
                  maxLength={2}
                  className="w-full input-vintage text-center text-sm font-bold bg-[#F5F1E8] border-2 border-[#1D3557] py-2 px-3 focus:outline-none focus:border-[#E63946] text-[#1D3557] transition-all rounded-sm shadow-inner mt-1"
                  placeholder="x"
                />
              </div>
            </div>
            
            <span className="font-body text-[9px] text-[#1D3557]/50 block leading-normal mt-3">
              Supports standard linear and transcendental calculus operands: `+`, `-`, `*`, `/`, `^`, functions: `sin`, `cos`, `tan`, `exp`, `log` (ln), `sqrt`, variables: `x`, `y`, `t`.
            </span>

            {/* Quick Presets Buttons */}
            <div className="mt-4 pt-3 border-t border-dashed border-[#1D3557]/20">
              <span className="font-display text-[10px] text-[#1D3557]/70 block mb-2 font-bold uppercase tracking-wider">
                ⚙️ QUICK EQUATION PRESETS / DEMO CALIBRATIONS
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '⚛️ Wave Damping', expr: 'cos(2*x) * exp(-x)' },
                  { label: '📐 Cubic Curve', expr: 'x^3 - 3*x^2 + 2*x' },
                  { label: '⚡ Rational Fraction', expr: 'log(x) / sqrt(x)' },
                  { label: '🌀 Complex Chain', expr: 'sin(x^2) * exp(3*x)' }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setExprString(preset.expr);
                      setVariable('x');
                      window.showAtelierToast(`Loaded preset expression: ${preset.expr}`, "info");
                    }}
                    className="ticket-btn py-1.5 px-2.5 text-[9px] font-bold bg-[#1D3557] hover:bg-[#E63946] text-[#FFFDF0] flex-grow transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Golden Math Outcome Display Badge or Standby Placeholder */}
          {(!errorBox && derivativeResult) ? (
            <div className="scroll-reveal vintage-menu-card p-5 space-y-4">
              <span className="font-display text-xs text-[#C5A059] block border-b border-dashed border-[#1D3557]/20 pb-1">
                📐 LATEX SYMBOLIC OUTCOMES (OFFLINE RENDERS)
              </span>
              <div className="space-y-4 select-all">
                <div className="bg-[#FFFDF0] p-4 border border-[#1D3557]/15 rounded-sm flex flex-col justify-center items-center text-center">
                  <span className="font-display text-[9px] text-[#1D3557]/60 block mb-1">SIMPLIFIED DERIVATIVE f'({variable}) =</span>
                  <div className="text-xl sm:text-2xl text-[#E63946] overflow-x-auto max-w-full py-1">
                    <KaTeXRender tex={math.simplify(derivativeResult).toTex()} block />
                  </div>
                </div>

                <div className="bg-[#FFFDF0] p-4 border border-[#1D3557]/15 rounded-sm flex flex-col justify-center items-center text-center">
                  <span className="font-display text-[9px] text-[#1D3557]/60 block mb-1">SIMPLIFIED EXPRESSION f({variable}) =</span>
                  <div className="text-lg text-[#1D3557] overflow-x-auto max-w-full py-1">
                    <KaTeXRender tex={math.simplify(exprString).toTex()} block />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="scroll-reveal vintage-menu-card p-5 space-y-4 opacity-60">
              <span className="font-display text-xs text-[#1D3557]/50 block border-b border-dashed border-[#1D3557]/20 pb-1">
                📐 LATEX SYMBOLIC OUTCOMES (OFFLINE RENDERS)
              </span>
              <div className="bg-[#FFFDF0] p-6 border border-dashed border-[#1D3557]/25 rounded-sm flex flex-col justify-center items-center text-center min-h-[120px]">
                <span className="font-mono text-xs text-[#E63946]">[ CALCULUS COMPUTATION FAULT / STANDBY ]</span>
                <span className="font-body text-[9px] text-[#1D3557]/50 mt-1 uppercase font-bold">Awaiting correct mathematical notations</span>
              </div>
            </div>
          )}

          {/* Calculus typewriter Analytical Sheet printout */}
          <div className="scroll-reveal relative">
            <span className="absolute top-2 right-4 font-display text-[9px] text-[#C5A059] font-bold tracking-widest z-10">CALCULUS SHEET OUT</span>
            <pre className="w-full text-[10px] bg-[#F4ECD8] text-[#332211] font-body p-4 border-2 border-[#C5A059] rounded-sm max-h-[220px] overflow-x-auto shadow-inner leading-relaxed whitespace-pre-wrap">
              {logOutput}
            </pre>
          </div>
        </div>

        {/* Right Column: AST Tree and Steps Log */}
        <div className="space-y-6">
          
          {/* AST Tree Visualizer Canvas */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5 flex justify-between items-center">
              <span>🌿 AST COMPUTATIONAL BLUEPRINT PARSE TREE</span>
              {astTree ? (
                <span className="text-[10px] font-mono text-[#E63946] animate-pulse bg-[#E63946]/10 px-2 py-0.5 border border-[#E63946]/20 rounded-sm">ACTIVE</span>
              ) : (
                <span className="text-[10px] font-mono text-[#1D3557]/40 bg-[#1D3557]/5 px-2 py-0.5 border border-[#1D3557]/10 rounded-sm">STANDBY</span>
              )}
            </span>
            {astTree ? (
              <div className="relative bg-[#FFFDF0] border-2 border-[#C5A059] p-3 shadow-inner rounded-sm overflow-x-auto w-full flex flex-col items-center">
                {/* Floating dynamic description of hovered node */}
                <div className="absolute top-2 left-2 bg-[#F4ECD8] border border-[#C5A059] py-1 px-3 font-mono text-[9px] text-[#1D3557] shadow-sm z-20">
                  {hoveredNode ? (
                    <span>NODE: [Type: {hoveredNode.type} | Symbol: "{hoveredNode.label}"]</span>
                  ) : (
                    <span>HOVER NODES TO INSPECT SYNTAX COEFFICIENT DATA</span>
                  )}
                </div>

                <div className="w-full overflow-x-auto flex justify-center py-4">
                  <svg
                    ref={svgRef}
                    width={Math.max(treeWidth + 60, 320)}
                    height={treeHeight}
                    viewBox={`0 0 ${Math.max(treeWidth + 60, 320)} ${treeHeight}`}
                    className="block bg-[#FFFDF0] w-auto h-auto transition-all"
                  >
                    {/* Render connectors */}
                    {renderTreeConnections(astTree)}
                    {/* Render circles */}
                    {renderTreeNodes(astTree)}
                  </svg>
                </div>
              </div>
            ) : (
              <div className="relative bg-[#F4ECD8] border-2 border-dashed border-[#1D3557]/30 p-8 rounded-sm text-center flex flex-col justify-center items-center min-h-[220px]">
                {/* Grid lines background style */}
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#1d3557_1px,transparent_1px),linear-gradient(to_bottom,#1d3557_1px,transparent_1px)] bg-[size:16px_16px]" />
                <span className="font-mono text-xs text-[#E63946] uppercase font-bold animate-pulse relative z-10">🚨 STANDBY BLUEPRINT COMPILER GRAPH EMPTY</span>
                <span className="font-body text-[10px] text-[#1D3557]/70 mt-2 uppercase tracking-wide max-w-xs relative z-10">Awaiting stable algebraic input formula parameters to trace abstract syntax node coordinates</span>
              </div>
            )}
          </div>

          {/* Step-by-step differentiation derivation block */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5 flex justify-between items-center">
              <span>📖 STEP-BY-STEP CALCULATION DERIVATION LOG</span>
              {steps.length > 0 && (
                <span className="text-[10px] font-mono text-[#E63946] bg-[#E63946]/10 px-2 py-0.5 border border-[#E63946]/20 rounded-sm">{steps.length} TERMS</span>
              )}
            </span>
            {steps.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#F5F1E8] border border-[#1D3557]/15 font-body text-xs text-[#1D3557] leading-relaxed rounded-sm space-y-1.5"
                  >
                    <div className="font-bold flex gap-2 text-[#E63946]">
                      <span className="select-none">Step {idx + 1}:</span>
                      <span className="text-[#1D3557]/80">{step.explanation}</span>
                    </div>
                    <div className="bg-white border border-[#1D3557]/10 p-2 text-center text-sm select-all overflow-x-auto">
                      <KaTeXRender tex={step.latex} block />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-[#F5F1E8] border border-dashed border-[#1D3557]/20 text-center rounded-sm font-mono text-[10px] text-[#1D3557]/60 flex flex-col justify-center items-center min-h-[120px]">
                <span>[ STEP LOG QUEUE VACANT ]</span>
                <span className="text-[8px] text-[#1D3557]/45 mt-1 uppercase tracking-wider">AWAITING DIFFERENTIABLE COEFFICIENT REGISTERS DATA</span>
              </div>
            )}
          </div>

          {/* Error box */}
          {errorBox && (
            <div className="error-ticket mt-4 font-bold text-xs leading-normal">
              {errorBox}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SymbolicCalculusLab;
