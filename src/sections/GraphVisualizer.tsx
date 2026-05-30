import { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';

interface GraphNode {
  id: number;
  x: number;
  y: number;
}

interface GraphEdge {
  id: number;
  u: number; // node id
  v: number; // node id
  weight: number;
}

const GraphVisualizer = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Nodes and Edges State
  const [nodes, setNodes] = useState<GraphNode[]>([
    { id: 1, x: 100, y: 150 },
    { id: 2, x: 240, y: 70 },
    { id: 3, x: 240, y: 230 },
    { id: 4, x: 380, y: 150 }
  ]);
  const [edges, setEdges] = useState<GraphEdge[]>([
    { id: 1, u: 1, v: 2, weight: 3 },
    { id: 2, u: 1, v: 3, weight: 5 },
    { id: 3, u: 2, v: 4, weight: 4 },
    { id: 4, u: 3, v: 4, weight: 2 },
    { id: 5, u: 2, v: 3, weight: 1 }
  ]);

  // UI Modes
  const [editMode, setEditMode] = useState<'node' | 'edge' | 'run'>('run');
  const [selectedAlgo, setSelectedAlgo] = useState<'bfs' | 'dfs' | 'dijkstra' | 'kruskal'>('dijkstra');
  
  // Animation/Run States
  const [sourceNode, setSourceNode] = useState<number>(1);
  const [targetNode, setTargetNode] = useState<number>(4);
  const [animSteps, setAnimSteps] = useState<any[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1);
  const [edgeBuffer, setEdgeBuffer] = useState<number | null>(null);

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

  // Redraw when graph or animation index updates
  useEffect(() => {
    drawGraph();
  }, [nodes, edges, editMode, edgeBuffer, animSteps, currentStepIdx, sourceNode, targetNode]);

  // Main Canvas drawing loop
  const drawGraph = () => {
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

    // Determine current active/visited sets from animation steps
    const activeStep = currentStepIdx >= 0 && currentStepIdx < animSteps.length ? animSteps[currentStepIdx] : null;
    const visitedNodes = activeStep?.visited ? new Set<number>(activeStep.visited) : new Set<number>();
    const highlightedEdges = activeStep?.pathEdges ? new Set<number>(activeStep.pathEdges) : new Set<number>();
    const frontierNode = activeStep?.currNode ?? null;

    // 1. Draw Edges
    edges.forEach(edge => {
      const uNode = nodes.find(n => n.id === edge.u);
      const vNode = nodes.find(n => n.id === edge.v);
      if (uNode && vNode) {
        const isPath = highlightedEdges.has(edge.id);
        
        ctx.strokeStyle = isPath ? '#E63946' : '#1D3557';
        ctx.lineWidth = isPath ? 4.5 : 2;

        ctx.beginPath();
        ctx.moveTo(uNode.x, uNode.y);
        ctx.lineTo(vNode.x, vNode.y);
        ctx.stroke();

        // Draw Edge weights
        const midX = (uNode.x + vNode.x) / 2;
        const midY = (uNode.y + vNode.y) / 2;

        ctx.fillStyle = '#FFFDF0';
        ctx.strokeStyle = '#1D3557';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(midX, midY, 9, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1D3557';
        ctx.font = 'bold 8px "Cutive Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(String(edge.weight), midX, midY + 3);
      }
    });

    // 2. Draw Node edgeBuffer highlight
    if (edgeBuffer !== null) {
      const uNode = nodes.find(n => n.id === edgeBuffer);
      if (uNode) {
        ctx.strokeStyle = '#E63946';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(uNode.x, uNode.y, 22, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }

    // 3. Draw Nodes
    nodes.forEach(node => {
      const isSource = node.id === sourceNode;
      const isTarget = node.id === targetNode;
      const isVisited = visitedNodes.has(node.id);
      const isFrontier = node.id === frontierNode;

      ctx.fillStyle = isFrontier ? '#C5A059' : (isVisited ? '#E63946' : '#1D3557');
      ctx.strokeStyle = '#FFFDF0';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.arc(node.x, node.y, 16, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Outer gold/blue indicator rings
      if (isSource || isTarget) {
        ctx.strokeStyle = '#E63946';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Draw Node Id label
      ctx.fillStyle = '#FFFDF0';
      ctx.font = 'bold 11px "Cutive Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(node.id), node.x, node.y + 4);

      // Role tag above/below node
      if (isSource || isTarget) {
        ctx.fillStyle = '#E63946';
        ctx.font = '7px "Special Elite", monospace';
        ctx.fillText(isSource ? "SOURCE" : "TARGET", node.x, node.y - 22);
      }
    });
  };

  // Click handler to create nodes or edges
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const py = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (editMode === 'node') {
      // Add node at exact client click coordinates
      const nextId = nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 1;
      setNodes(prev => [...prev, { id: nextId, x: px, y: py }]);
      window.showAtelierToast(`Node ${nextId} created.`, "info");
    } 
    else if (editMode === 'edge') {
      // Find if clicked near an existing node
      const clicked = nodes.find(n => Math.sqrt(Math.pow(n.x - px, 2) + Math.pow(n.y - py, 2)) <= 18);
      if (clicked) {
        if (edgeBuffer === null) {
          setEdgeBuffer(clicked.id);
        } else {
          if (edgeBuffer === clicked.id) {
            setEdgeBuffer(null);
            return;
          }
          // Avoid duplicate edges
          const exists = edges.find(ed => (ed.u === edgeBuffer && ed.v === clicked.id) || (ed.u === clicked.id && ed.v === edgeBuffer));
          if (exists) {
            setEdgeBuffer(null);
            window.showAtelierToast("An edge already connects these two nodes.", "warning");
            return;
          }

          // Setup random weight 1 to 9
          const weight = Math.floor(Math.random() * 9) + 1;
          const nextId = edges.length > 0 ? Math.max(...edges.map(ed => ed.id)) + 1 : 1;
          
          setEdges(prev => [...prev, { id: nextId, u: edgeBuffer, v: clicked.id, weight }]);
          setEdgeBuffer(null);
          window.showAtelierToast(`Edge E${nextId} added with weight ${weight}.`, "success");
        }
      }
    } 
    else if (editMode === 'run') {
      // Allow setting source and target by clicking nodes in run mode!
      const clicked = nodes.find(n => Math.sqrt(Math.pow(n.x - px, 2) + Math.pow(n.y - py, 2)) <= 18);
      if (clicked) {
        if (clicked.id === targetNode) {
          window.showAtelierToast("Node is already selected as target.", "warning");
          return;
        }
        setSourceNode(clicked.id);
        window.showAtelierToast(`Source node updated to P${clicked.id}.`, "info");
      }
    }
  };

  // Compile Pathfinding Steps
  const compileAlgorithm = () => {
    setErrorBox(null);
    setAnimSteps([]);
    setCurrentStepIdx(-1);

    if (nodes.length === 0) return;

    try {
      const steps: any[] = [];
      
      if (selectedAlgo === 'bfs' || selectedAlgo === 'dfs') {
        const queue: number[] = [sourceNode];
        const visited = new Set<number>();
        const parentMap: { [key: number]: number } = {};
        const stepEdges: number[] = [];

        visited.add(sourceNode);
        steps.push({
          currNode: sourceNode,
          visited: Array.from(visited),
          pathEdges: [],
          description: `Queue initialized with source node ${sourceNode}.`
        });

        let found = false;

        while (queue.length > 0) {
          const u = selectedAlgo === 'bfs' ? queue.shift()! : queue.pop()!;
          
          if (u === targetNode) {
            found = true;
            break;
          }

          // Neighbors
          const neighbors = edges
            .filter(e => e.u === u || e.v === u)
            .map(e => ({ neighbor: e.u === u ? e.v : e.u, edgeId: e.id }));

          for (let i = 0; i < neighbors.length; i++) {
            const { neighbor, edgeId } = neighbors[i];
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              parentMap[neighbor] = u;
              queue.push(neighbor);

              // Trace edge connection
              stepEdges.push(edgeId);

              steps.push({
                currNode: neighbor,
                visited: Array.from(visited),
                pathEdges: [...stepEdges],
                description: `Discovered neighbor node ${neighbor} via edge connecting from node ${u}.`
              });

              if (neighbor === targetNode) {
                found = true;
                break;
              }
            }
          }
          if (found) break;
        }

        if (found) {
          // Trace shortest path edges
          const pathNodeChain: number[] = [];
          let curr = targetNode;
          while (curr !== sourceNode) {
            pathNodeChain.push(curr);
            curr = parentMap[curr];
          }
          pathNodeChain.push(sourceNode);
          pathNodeChain.reverse();

          steps.push({
            currNode: targetNode,
            visited: Array.from(visited),
            pathEdges: [...stepEdges],
            description: `Target node ${targetNode} successfully found! Path resolved: ${pathNodeChain.join(' ➔ ')}`
          });
        } else {
          steps.push({
            currNode: null,
            visited: Array.from(visited),
            pathEdges: [...stepEdges],
            description: `Traversal completed. Target node ${targetNode} is unreachable from node ${sourceNode}.`
          });
        }
      } 
      else if (selectedAlgo === 'dijkstra') {
        // Dijkstra's Shortest Path Algorithm
        const dist: { [key: number]: number } = {};
        const prev: { [key: number]: number } = {};
        const prevEdge: { [key: number]: number } = {};
        const visited = new Set<number>();
        const queue = new Set<number>();

        nodes.forEach(n => {
          dist[n.id] = Infinity;
          queue.add(n.id);
        });
        dist[sourceNode] = 0;

        steps.push({
          currNode: sourceNode,
          visited: [],
          pathEdges: [],
          description: `Dijkstra initialized. All node distances set to Infinity, source node ${sourceNode} set to 0.`
        });

        let found = false;

        while (queue.size > 0) {
          // Extract min node
          let u: number | null = null;
          let minDist = Infinity;
          queue.forEach(nId => {
            if (dist[nId] < minDist) {
              minDist = dist[nId];
              u = nId;
            }
          });

          if (u === null || dist[u] === Infinity) break;
          queue.delete(u);
          visited.add(u);

          steps.push({
            currNode: u,
            visited: Array.from(visited),
            pathEdges: Object.values(prevEdge),
            description: `Extracted node ${u} with minimum distance ${dist[u]}.`
          });

          if (u === targetNode) {
            found = true;
            break;
          }

          // Relax neighbors
          const neighbors = edges.filter(e => e.u === u || e.v === u);
          neighbors.forEach(e => {
            const v = e.u === u ? e.v : e.u;
            if (queue.has(v)) {
              const alt = dist[u!] + e.weight;
              if (alt < dist[v]) {
                dist[v] = alt;
                prev[v] = u!;
                prevEdge[v] = e.id;
                steps.push({
                  currNode: v,
                  visited: Array.from(visited),
                  pathEdges: Object.values(prevEdge),
                  description: `Relaxed edge from node ${u} to node ${v}. Distance updated to ${alt}.`
                });
              }
            }
          });
        }

        if (found) {
          const path: number[] = [];
          const pathEdges: number[] = [];
          let curr = targetNode;
          while (curr !== sourceNode) {
            path.push(curr);
            pathEdges.push(prevEdge[curr]);
            curr = prev[curr];
          }
          path.push(sourceNode);
          path.reverse();

          steps.push({
            currNode: targetNode,
            visited: Array.from(visited),
            pathEdges: pathEdges,
            description: `Dijkstra solved! Shortest cost to target is ${dist[targetNode]}. Path: ${path.join(' ➔ ')}`
          });
        } else {
          steps.push({
            currNode: null,
            visited: Array.from(visited),
            pathEdges: [],
            description: `Dijkstra completed. Target node ${targetNode} is unreachable from node ${sourceNode}.`
          });
        }
      }
      else if (selectedAlgo === 'kruskal') {
        // Kruskal's Minimum Spanning Tree
        // Sort edges by weight
        const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);
        const parent: { [key: number]: number } = {};
        nodes.forEach(n => parent[n.id] = n.id);

        const find = (i: number): number => {
          while (parent[i] !== i) i = parent[i];
          return i;
        };

        const union = (i: number, j: number) => {
          const rootI = find(i);
          const rootJ = find(j);
          parent[rootI] = rootJ;
        };

        const mstEdges: number[] = [];
        let edgeIdx = 0;

        steps.push({
          currNode: null,
          visited: [],
          pathEdges: [],
          description: `Kruskal initialized. Sorted ${edges.length} edges by weight: ${sortedEdges.map(e => `E${e.id}:${e.weight}`).join(', ')}`
        });

        while (mstEdges.length < nodes.length - 1 && edgeIdx < sortedEdges.length) {
          const nextEdge = sortedEdges[edgeIdx];
          const rootU = find(nextEdge.u);
          const rootV = find(nextEdge.v);

          if (rootU !== rootV) {
            mstEdges.push(nextEdge.id);
            union(nextEdge.u, nextEdge.v);
            steps.push({
              currNode: nextEdge.u,
              visited: [nextEdge.u, nextEdge.v],
              pathEdges: [...mstEdges],
              description: `Accepted edge E${nextEdge.id} (weight ${nextEdge.weight}) between node ${nextEdge.u} and node ${nextEdge.v}. Does not form cycle.`
            });
          } else {
            steps.push({
              currNode: nextEdge.u,
              visited: [],
              pathEdges: [...mstEdges],
              description: `Rejected edge E${nextEdge.id} (weight ${nextEdge.weight}) between node ${nextEdge.u} and node ${nextEdge.v} because it forms a cycle.`
            });
          }
          edgeIdx++;
        }

        steps.push({
          currNode: null,
          visited: [],
          pathEdges: [...mstEdges],
          description: `Kruskal completed. Minimum Spanning Tree (MST) resolved with ${mstEdges.length} edges.`
        });
      }

      setAnimSteps(steps);
      setCurrentStepIdx(0);
      printProgressLog(steps[0]);
    } catch (e: any) {
      setErrorBox(`🚨 GRAPH SOLVER FAULT:\n${e.message}`);
    }
  };

  const handleNextStep = () => {
    if (animSteps.length === 0) return;
    const nextIdx = Math.min(currentStepIdx + 1, animSteps.length - 1);
    setCurrentStepIdx(nextIdx);
    printProgressLog(animSteps[nextIdx]);
  };

  const handlePrevStep = () => {
    if (animSteps.length === 0) return;
    const prevIdx = Math.max(currentStepIdx - 1, 0);
    setCurrentStepIdx(prevIdx);
    printProgressLog(animSteps[prevIdx]);
  };

  const printProgressLog = (step: any) => {
    if (!step) return;

    let log = `GRAPH CALIBRATION LEDGER PROGRESS REPORT:\n`;
    log += `------------------------------------------------------------\n`;
    log += `Selected Algorithm:  ${selectedAlgo.toUpperCase()}\n`;
    log += `Total Nodes Traversed: ${step.visited.length} visited\n`;
    log += `Active Frontier Node:  ${step.currNode ?? 'None'}\n\n`;
    log += `STEP EVALUATION DESCRIPTION:\n`;
    log += `  >> ${step.description}\n`;
    log += `------------------------------------------------------------\n`;
    
    // Complexity card
    let complexity = '';
    if (selectedAlgo === 'bfs' || selectedAlgo === 'dfs') complexity = 'Time Complexity: O(|V| + |E|)  Space Complexity: O(|V|)';
    else if (selectedAlgo === 'dijkstra') complexity = 'Time Complexity: O(|E| * log|V|)  Space Complexity: O(|V|)';
    else if (selectedAlgo === 'kruskal') complexity = 'Time Complexity: O(|E| * log|E|)  Space Complexity: O(|V|)';

    log += `${complexity}`;

    setLogOutput(log);
  };

  const wipeGraph = () => {
    setNodes([]);
    setEdges([]);
    setAnimSteps([]);
    setCurrentStepIdx(-1);
    setEdgeBuffer(null);
    setLogOutput("GRAPH LABORATORY COUNTERS WIPED.");
  };

  return (
    <div ref={sectionRef} className="w-full py-4 space-y-6" id="graph-visualizer">
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Control card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="scroll-reveal">
            <span className="geo-block-red text-[11px] font-bold tracking-widest inline-flex items-center gap-2">
              <Play className="w-4 h-4 animate-pulse" />
              LABORATORY APPARATUS MODULE IX
            </span>
            <h2 className="font-display text-xl sm:text-3xl text-[#1D3557] mt-3">GRAPH PATHFINDING THEORY</h2>
            <p className="font-body text-xs text-[#1D3557]/70 uppercase tracking-widest mt-1">Dijkstra, BFS, DFS & Kruskal MST Solver</p>
            <div className="line-separator max-w-sm mt-3" />
          </div>

          {/* Interactive graph controls */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              🛠 EDIT BLUEPRINT NODE GRAPH
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
              {[
                { name: 'run', label: '🔍 Select / Run' },
                { name: 'node', label: '● Add Node' },
                { name: 'edge', label: '─ Add Edge' }
              ].map(modeOpt => (
                <button
                  key={modeOpt.name}
                  onClick={() => {
                    setEditMode(modeOpt.name as any);
                    setEdgeBuffer(null);
                  }}
                  className={`ticket-btn py-1.5 px-1 text-[10px] sm:text-xs font-bold leading-none ${
                    editMode === modeOpt.name ? 'bg-[#E63946] text-[#FFFDF0]' : 'bg-[#1D3557] text-[#FFFDF0]'
                  }`}
                >
                  {modeOpt.label}
                </button>
              ))}
            </div>

            <button
              onClick={wipeGraph}
              className="w-full ticket-btn py-1.5 text-xs bg-red-800 hover:bg-[#1D3557] flex items-center justify-center gap-1.5"
            >
              [ WIPE GRAPH CONSOLE ]
            </button>
          </div>

          {/* Algorithm selector and targets */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              🧬 ALGORITHM COUPLINGS
            </span>
            <div className="space-y-3 font-body text-xs text-[#1D3557]">
              <div>
                <label className="font-bold block mb-1">SELECT TRAVERSAL SOLVER:</label>
                <select
                  value={selectedAlgo}
                  onChange={(e: any) => setSelectedAlgo(e.target.value)}
                  className="w-full font-body text-xs font-bold bg-[#F5F1E8] border border-[#1D3557] py-1.5 px-2"
                >
                  <option value="dijkstra">Dijkstra's Shortest Path</option>
                  <option value="bfs">Breadth-First Search (BFS)</option>
                  <option value="dfs">Depth-First Search (DFS)</option>
                  <option value="kruskal">Kruskal's Minimum Spanning Tree</option>
                </select>
              </div>

              {selectedAlgo !== 'kruskal' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block mb-1">SOURCE NODE:</label>
                    <select
                      value={sourceNode}
                      onChange={(e) => setSourceNode(parseInt(e.target.value))}
                      className="w-full font-body text-xs font-bold bg-[#F5F1E8] border border-[#1D3557] py-1.5 px-2"
                    >
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>Node {n.id}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold block mb-1">TARGET NODE:</label>
                    <select
                      value={targetNode}
                      onChange={(e) => setTargetNode(parseInt(e.target.value))}
                      className="w-full font-body text-xs font-bold bg-[#F5F1E8] border border-[#1D3557] py-1.5 px-2"
                    >
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>Node {n.id}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <button
                onClick={compileAlgorithm}
                className="w-full ticket-btn py-2 text-xs bg-[#E63946] hover:bg-[#1D3557] flex items-center justify-center gap-1.5"
              >
                [ RUN SOLVER & COMPILE STEPS ]
              </button>
            </div>
          </div>

          {/* Animation navigation player */}
          {animSteps.length > 0 && (
            <div className="scroll-reveal vintage-menu-card p-4 sm:p-5 flex items-center justify-between">
              <span className="font-display text-[10px] text-[#C5A059] font-bold">
                STEP: {currentStepIdx + 1} / {animSteps.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStepIdx <= 0}
                  className="ticket-btn py-1 px-3 text-[10px] bg-[#1D3557] disabled:opacity-50"
                >
                  [ BACK ]
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={currentStepIdx >= animSteps.length - 1}
                  className="ticket-btn py-1 px-3 text-[10px] bg-[#1D3557] disabled:opacity-50"
                >
                  [ NEXT ]
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Canvas drawer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              📐 BLUEPRINT NODE CONNECTOR
            </span>

            {/* Responsive grid scroll box */}
            <div className="bg-[#F4ECD8] border-2 border-[#C5A059] p-3 shadow-inner rounded-sm overflow-x-auto w-full">
              <canvas
                ref={canvasRef}
                width="500"
                height="320"
                onClick={handleCanvasClick}
                className="block bg-[#F4ECD8] border border-[#C5A059]/40 cursor-pointer max-w-full mx-auto"
              />
            </div>

            {/* Error box */}
            {errorBox && (
              <div className="error-ticket mt-4 font-bold text-xs leading-normal">
                {errorBox}
              </div>
            )}

            {/* Complexity and progress ledger */}
            <div className="relative mt-4">
              <span className="absolute top-2 right-4 font-display text-[9px] text-[#C5A059] font-bold tracking-widest z-10">THEORY LEDGER TICKET</span>
              <pre className="w-full text-[10px] bg-[#F4ECD8] text-[#332211] font-body p-4 border-2 border-[#C5A059] rounded-sm max-h-[220px] overflow-x-auto shadow-inner leading-relaxed whitespace-pre">
                {logOutput || 'READY. ADD NODES/EDGES OR SELECT SOURCE/TARGET TO CALCULATE PATHS.'}
              </pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GraphVisualizer;
