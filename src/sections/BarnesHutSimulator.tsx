import { useState, useEffect, useRef } from 'react';
import { Activity, Play, Pause, Trash2, Download, Upload } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  color: string;
  fixed?: boolean;
}

// Barnes-Hut Quadtree Node structure
class QuadNode {
  x: number; // boundary center x
  y: number; // boundary center y
  size: number; // boundary size (width/height)
  
  mass = 0; // cumulative mass
  cx = 0; // center of mass x
  cy = 0; // center of mass y
  
  particle: Particle | null = null;
  children: QuadNode[] | null = null; // [NW, NE, SW, SE]
  divided = false;

  constructor(x: number, y: number, size: number) {
    this.x = x;
    this.y = y;
    this.size = size;
  }

  insert(p: Particle) {
    // If no mass, simply assign particle
    if (this.mass === 0) {
      this.particle = p;
      this.cx = p.x;
      this.cy = p.y;
      this.mass = p.mass;
      return;
    }

    // If it's currently a leaf node, we must subdivide
    if (!this.divided) {
      this.subdivide();
      if (this.particle) {
        this.insertToChild(this.particle);
        this.particle = null;
      }
    }

    this.insertToChild(p);
    this.updateCenterOfMass();
  }

  subdivide() {
    const half = this.size / 4;
    const size = this.size / 2;
    this.children = [
      new QuadNode(this.x - half, this.y - half, size), // NW
      new QuadNode(this.x + half, this.y - half, size), // NE
      new QuadNode(this.x - half, this.y + half, size), // SW
      new QuadNode(this.x + half, this.y + half, size)  // SE
    ];
    this.divided = true;
  }

  insertToChild(p: Particle) {
    if (!this.children) return;
    const nw = p.x < this.x && p.y < this.y;
    const ne = p.x >= this.x && p.y < this.y;
    const sw = p.x < this.x && p.y >= this.y;
    
    if (nw) this.children[0].insert(p);
    else if (ne) this.children[1].insert(p);
    else if (sw) this.children[2].insert(p);
    else this.children[3].insert(p); // SE
  }

  updateCenterOfMass() {
    if (!this.children) return;
    let totalMass = 0;
    let sumX = 0;
    let sumY = 0;

    this.children.forEach(child => {
      if (child.mass > 0) {
        totalMass += child.mass;
        sumX += child.cx * child.mass;
        sumY += child.cy * child.mass;
      }
    });

    this.mass = totalMass;
    if (totalMass > 0) {
      this.cx = sumX / totalMass;
      this.cy = sumY / totalMass;
    }
  }

  // Calculate gravity force on body using Barnes-Hut approximation
  calculateForce(
    p: Particle,
    G: number,
    theta: number,
    epsilon: number,
    forceRef: { fx: number; fy: number; evals: number }
  ) {
    if (this.mass === 0) return;

    const dx = this.cx - p.x;
    const dy = this.cy - p.y;
    const distSq = dx * dx + dy * dy;
    const d = Math.sqrt(distSq + epsilon * epsilon);

    if (d < 1e-3) return; // avoid singularity at zero distance

    // Check if node is leaf, or if theta ratio s/d < theta
    const s_d = this.size / d;
    
    if (!this.divided || s_d < theta) {
      // Treat as single massive point particle
      // F = G * m1 * m2 / (d^2)
      const forceMag = (G * p.mass * this.mass) / (distSq + epsilon * epsilon);
      forceRef.fx += forceMag * (dx / d);
      forceRef.fy += forceMag * (dy / d);
      forceRef.evals += 1;
    } else {
      // Recursively traverse children
      if (this.children) {
        this.children.forEach(child => {
          child.calculateForce(p, G, theta, epsilon, forceRef);
        });
      }
    }
  }

  // Helper to collect all quadtree bounds to draw them
  collectBounds(boundsList: Array<{ x: number; y: number; size: number }>) {
    if (this.mass === 0) return;
    boundsList.push({ x: this.x, y: this.y, size: this.size });
    if (this.children) {
      this.children.forEach(child => child.collectBounds(boundsList));
    }
  }
}

const BarnesHutSimulator = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulation controls
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showQuadtree, setShowQuadtree] = useState<boolean>(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [newMass, setNewMass] = useState<string>('100.0');
  const [theta, setTheta] = useState<number>(0.5); // BH accuracy threshold
  const [gravConstant, setGravConstant] = useState<number>(0.15); // G
  const [collisionType, setCollisionType] = useState<string>('elastic'); // elastic, merge
  const [logOutput, setLogOutput] = useState<string>('');

  // Zoom and Pan states
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingCanvas = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Custom particle launch drag states
  const [launchOrigin, setLaunchOrigin] = useState<{ x: number; y: number } | null>(null);
  const [launchTarget, setLaunchTarget] = useState<{ x: number; y: number } | null>(null);

  // Performance metrics tracking
  const forceEvalsRef = useRef<number>(0);
  const totalEvalsSqRef = useRef<number>(0);
  const fpsRef = useRef<number>(60);
  const lastTimeRef = useRef<number>(performance.now());
  const requestRef = useRef<number>(0);

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
    
    // Load default preset on mount
    loadPreset('solar-system');

    return () => {
      observer.disconnect();
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Main canvas rendering loops & physics integrations
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (time: number) => {
      // 1. Calculate FPS
      const dt = time - lastTimeRef.current;
      lastTimeRef.current = time;
      fpsRef.current = Math.round(1000 / Math.max(dt, 1e-3));

      // 2. Physics step if playing
      if (isPlaying && particles.length > 0) {
        stepPhysics();
      }

      // 3. Clear canvas with blueprint overlay grid
      ctx.fillStyle = '#FFFDF0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid lines
      ctx.strokeStyle = 'rgba(29, 53, 87, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 40 * zoom;
      const startX = pan.x % gridSize;
      const startY = pan.y % gridSize;
      for (let x = startX; x < canvas.width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = startY; y < canvas.height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Compute coordinate boundary of particles to build Quadtree
      let minX = -1000;
      let maxX = 1000;
      let minY = -1000;
      let maxY = 1000;

      if (particles.length > 0) {
        minX = Math.min(...particles.map(p => p.x)) - 100;
        maxX = Math.max(...particles.map(p => p.x)) + 100;
        minY = Math.min(...particles.map(p => p.y)) - 100;
        maxY = Math.max(...particles.map(p => p.y)) + 100;
      }
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const size = Math.max(maxX - minX, maxY - minY, 2000);

      // Build recursive Quadtree
      const rootNode = new QuadNode(centerX, centerY, size);
      particles.forEach(p => rootNode.insert(p));

      // 4. Draw Quadtree grid layers if enabled
      if (showQuadtree && particles.length > 0) {
        const bounds: Array<{ x: number; y: number; size: number }> = [];
        rootNode.collectBounds(bounds);
        
        ctx.strokeStyle = 'rgba(230, 57, 70, 0.08)';
        ctx.lineWidth = 1;
        bounds.forEach(b => {
          // Project quadtree coordinate to canvas space
          const px = canvas.width / 2 + (b.x - centerX) * zoom + pan.x;
          const py = canvas.height / 2 + (b.y - centerY) * zoom + pan.y;
          const w = b.size * zoom;
          ctx.strokeRect(px - w / 2, py - w / 2, w, w);
        });
      }

      // 5. Draw particles
      particles.forEach(p => {
        const cx = canvas.width / 2 + (p.x - centerX) * zoom + pan.x;
        const cy = canvas.height / 2 + (p.y - centerY) * zoom + pan.y;
        
        // Scale radius proportional to mass log scale
        const r = Math.max(Math.log(p.mass + 1.2) * 1.5 * zoom, 2);

        // Keep inside canvas bounds check
        if (cx > -50 && cx < canvas.width + 50 && cy > -50 && cy < canvas.height + 50) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, 2 * Math.PI);
          ctx.fillStyle = p.color;
          ctx.strokeStyle = '#1D3557';
          ctx.lineWidth = 1.5;
          ctx.fill();
          ctx.stroke();

          // Render coordinate labels for heavy fixed particles
          if (p.fixed || p.mass > 500) {
            ctx.fillStyle = '#1D3557';
            ctx.font = 'bold 8px "Cutive Mono", monospace';
            ctx.fillText(`${p.fixed ? '⭐️ SUN' : 'PLANET'} (M:${p.mass.toFixed(0)})`, cx + r + 5, cy + 3);
          }
        }
      });

      // 6. Draw dynamic launching vector guide
      if (launchOrigin && launchTarget) {
        ctx.strokeStyle = '#E63946';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(launchOrigin.x, launchOrigin.y);
        ctx.lineTo(launchTarget.x, launchTarget.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Head arrow
        const angle = Math.atan2(launchTarget.y - launchOrigin.y, launchTarget.x - launchOrigin.x);
        ctx.fillStyle = '#E63946';
        ctx.beginPath();
        ctx.moveTo(launchTarget.x, launchTarget.y);
        ctx.lineTo(launchTarget.x - 8 * Math.cos(angle - Math.PI / 6), launchTarget.y - 8 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(launchTarget.x - 8 * Math.cos(angle + Math.PI / 6), launchTarget.y - 8 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#E63946';
        ctx.font = 'bold 9px "Cutive Mono", monospace';
        const dX = launchOrigin.x - launchTarget.x;
        const dY = launchOrigin.y - launchTarget.y;
        const speed = Math.sqrt(dX * dX + dY * dY) * 0.05;
        ctx.fillText(`LAUNCH VELOCITY VECTOR: V = ${speed.toFixed(2)}`, launchOrigin.x + 10, launchOrigin.y - 10);
      }

      // 7. Update diagnostics log ledger
      const densityReduction = totalEvalsSqRef.current > 0
        ? ((totalEvalsSqRef.current - forceEvalsRef.current) / totalEvalsSqRef.current * 100).toFixed(1)
        : '0.0';

      let log = `N-BODY BARNES-HUT SIMULATION BLUEPRINT LEDGER:\n`;
      log += `------------------------------------------------------------\n`;
      log += `Active Particles:   ${particles.length} Gravitational Bodies\n`;
      log += `Barnes-Hut Theta:   θ = ${theta.toFixed(2)} (Accuracy Threshold)\n`;
      log += `Newtonian Gravity:  G = ${gravConstant.toFixed(2)} | Collision: ${collisionType.toUpperCase()}\n`;
      log += `Coordinate Bounds:  Width: ${size.toFixed(0)}m | Scale: ${zoom.toFixed(2)}x\n`;
      log += `------------------------------------------------------------\n`;
      log += `COMPUTATIONAL TREE PERFORMANCE METRICS:\n`;
      log += `  - Framerate (FPS):           ${fpsRef.current} frames/second\n`;
      log += `  - Barnes-Hut Evaluated:      ${forceEvalsRef.current} force sums\n`;
      log += `  - Standard O(N²) Evaluated:   ${totalEvalsSqRef.current} force sums\n`;
      log += `  - Numerical Complexity Reduction: ${densityReduction}% reduction!\n`;
      log += `------------------------------------------------------------\n`;
      log += `WORKSPACE STATUS: ORBITING PHYSICS DECOUPLED`;
      setLogOutput(log);

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [particles, isPlaying, showQuadtree, theta, gravConstant, zoom, pan, launchOrigin, launchTarget, collisionType]);

  // physics Euler-Cromer force solver integration step
  const stepPhysics = () => {
    let minX = Math.min(...particles.map(p => p.x)) - 100;
    let maxX = Math.max(...particles.map(p => p.x)) + 100;
    let minY = Math.min(...particles.map(p => p.y)) - 100;
    let maxY = Math.max(...particles.map(p => p.y)) + 100;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const size = Math.max(maxX - minX, maxY - minY, 2000);

    const rootNode = new QuadNode(centerX, centerY, size);
    particles.forEach(p => rootNode.insert(p));

    const updated = particles.map(p => ({ ...p }));
    let evalsSum = 0;

    // 1. Calculate and apply force vectors
    for (let i = 0; i < updated.length; i++) {
      const p = updated[i];
      if (p.fixed) continue;

      const forceRef = { fx: 0, fy: 0, evals: 0 };
      rootNode.calculateForce(p, gravConstant, theta, 15, forceRef);
      evalsSum += forceRef.evals;

      // Acceleration: a = F / m
      const ax = forceRef.fx / p.mass;
      const ay = forceRef.fy / p.mass;

      // Euler-Cromer step velocities
      p.vx += ax;
      p.vy += ay;
      
      // Update coordinates
      p.x += p.vx;
      p.y += p.vy;
    }

    forceEvalsRef.current = evalsSum;
    totalEvalsSqRef.current = updated.length * updated.length;

    // 2. Collision / merging handling
    const mergedList: Particle[] = [];
    const shredded = new Set<number>();

    for (let i = 0; i < updated.length; i++) {
      if (shredded.has(updated[i].id)) continue;
      
      let pA = updated[i];
      
      for (let j = i + 1; j < updated.length; j++) {
        if (shredded.has(updated[j].id)) continue;
        
        const pB = updated[j];
        const dx = pB.x - pA.x;
        const dy = pB.y - pA.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Dynamic collision threshold radius
        const rA = Math.max(Math.log(pA.mass + 1.2) * 1.5, 2);
        const rB = Math.max(Math.log(pB.mass + 1.2) * 1.5, 2);

        if (dist < rA + rB) {
          if (collisionType === 'merge') {
            // Conserve momentum: Vf = (mA * Va + mB * Vb) / (mA + mB)
            const totalM = pA.mass + pB.mass;
            const newVx = (pA.vx * pA.mass + pB.vx * pB.mass) / totalM;
            const newVy = (pA.vy * pA.mass + pB.vy * pB.mass) / totalM;

            pA = {
              ...pA,
              // Place at heavier coordinate or center of mass
              x: (pA.x * pA.mass + pB.x * pB.mass) / totalM,
              y: (pA.y * pA.mass + pB.y * pB.mass) / totalM,
              vx: newVx,
              vy: newVy,
              mass: totalM,
              fixed: pA.fixed || pB.fixed,
              color: pA.mass >= pB.mass ? pA.color : pB.color
            };
            shredded.add(pB.id);
          } else {
            // Elastic collision rebound bounce
            const nx = dx / dist;
            const ny = dy / dist;
            
            // Relative velocity
            const kx = pA.vx - pB.vx;
            const ky = pA.vy - pB.vy;
            const impulse = (2 * (kx * nx + ky * ny)) / (pA.mass + pB.mass);

            if (impulse > 0) { // Moving towards each other
              pA.vx -= impulse * pB.mass * nx;
              pA.vy -= impulse * pB.mass * ny;
              
              if (!pB.fixed) {
                pB.vx += impulse * pA.mass * nx;
                pB.vy += impulse * pA.mass * ny;
              }
            }
          }
        }
      }
      if (!shredded.has(pA.id)) {
        mergedList.push(pA);
      }
    }

    setParticles(mergedList);
  };

  // presets definitions
  const loadPreset = (type: 'solar-system' | 'galaxy-collision' | 'lagrange' | 'chaotic') => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    cancelAnimationFrame(requestRef.current);

    let list: Particle[] = [];
    
    if (type === 'solar-system') {
      // 1. Massive central sun
      list.push({ id: 1, x: 0, y: 0, vx: 0, vy: 0, mass: 2500, color: '#C5A059', fixed: true });
      // 2. orbit planets
      list.push({ id: 2, x: 0, y: -250, vx: 1.25, vy: 0, mass: 50, color: '#E63946' });
      list.push({ id: 3, x: 0, y: 400, vx: -0.98, vy: 0, mass: 120, color: '#1D3557' });
      list.push({ id: 4, x: -550, y: 0, vx: 0, vy: -0.83, mass: 80, color: '#457B9D' });
      list.push({ id: 5, x: 700, y: 0, vx: 0, vy: 0.73, mass: 200, color: '#2A9D8F' });
    } 
    else if (type === 'galaxy-collision') {
      // Create two clusters of rotating particles colliding
      const clusterA = Array(80).fill(null).map((_, idx) => {
        const radius = Math.random() * 200 + 40;
        const angle = Math.random() * 2 * Math.PI;
        // Circular orbit velocity: v = sqrt(G*M/r)
        const speed = Math.sqrt((0.15 * 1000) / radius);
        return {
          id: idx,
          x: -250 + radius * Math.cos(angle),
          y: radius * Math.sin(angle),
          vx: speed * -Math.sin(angle) + 0.1, // rotating + drifting right
          vy: speed * Math.cos(angle) + 0.05,
          mass: Math.random() * 5 + 1,
          color: '#E63946'
        };
      });
      // Giant central mass for cluster A
      list.push({ id: 81, x: -250, y: 0, vx: 0.1, vy: 0.05, mass: 1000, color: '#C5A059' });

      const clusterB = Array(80).fill(null).map((_, idx) => {
        const radius = Math.random() * 200 + 40;
        const angle = Math.random() * 2 * Math.PI;
        const speed = Math.sqrt((0.15 * 1000) / radius);
        return {
          id: idx + 100,
          x: 250 + radius * Math.cos(angle),
          y: radius * Math.sin(angle),
          vx: speed * Math.sin(angle) - 0.1, // counter rotating + drifting left
          vy: speed * -Math.cos(angle) - 0.05,
          mass: Math.random() * 5 + 1,
          color: '#1D3557'
        };
      });
      // Giant central mass for cluster B
      list.push({ id: 182, x: 250, y: 0, vx: -0.1, vy: -0.05, mass: 1000, color: '#457B9D' });

      list = list.concat(clusterA).concat(clusterB);
    } 
    else if (type === 'lagrange') {
      // 3-body equal mass orbit coordinates (Figure-8 orbital trajectory preset)
      // Normalized coordinates
      list.push({ id: 1, x: -350, y: 0, vx: 0.35, vy: 0.45, mass: 800, color: '#E63946' });
      list.push({ id: 2, x: 350, y: 0, vx: 0.35, vy: 0.45, mass: 800, color: '#1D3557' });
      list.push({ id: 3, x: 0, y: 0, vx: -0.7, vy: -0.9, mass: 800, color: '#C5A059' });
    } 
    else if (type === 'chaotic') {
      list = Array(120).fill(null).map((_, idx) => {
        const radius = Math.random() * 600 + 100;
        const angle = Math.random() * 2 * Math.PI;
        const speed = Math.random() * 1.5 + 0.2;
        return {
          id: idx,
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle),
          vx: speed * -Math.sin(angle),
          vy: speed * Math.cos(angle),
          mass: Math.random() * 45 + 5,
          color: idx % 2 === 0 ? '#E63946' : '#1D3557'
        };
      });
    }

    setParticles(list);
    window.showAtelierToast(`Loaded N-Body Simulator ${type.replace('-', ' ')} preset!`, 'success');
  };

  // Drag pan Canvas logic
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (e.button === 1 || e.button === 2 || e.shiftKey) {
      // Canvas Drag panning
      isDraggingCanvas.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
    } else if (e.button === 0) {
      // Particle launch trajectory setup
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      setLaunchOrigin({ x: cx, y: cy });
      setLaunchTarget({ x: cx, y: cy });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingCanvas.current) {
      const dX = e.clientX - dragStart.current.x;
      const dY = e.clientY - dragStart.current.y;
      dragStart.current = { x: e.clientX, y: e.clientY };
      setPan(prev => ({ x: prev.x + dX, y: prev.y + dY }));
    } else if (launchOrigin) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      setLaunchTarget({ x: cx, y: cy });
    }
  };

  const handleMouseUp = (_e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingCanvas.current) {
      isDraggingCanvas.current = false;
      return;
    }

    if (launchOrigin && launchTarget) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Project launch coordinates to simulation coordinates
      let minX = Math.min(...particles.map(p => p.x)) - 100;
      let maxX = Math.max(...particles.map(p => p.x)) + 100;
      let minY = Math.min(...particles.map(p => p.y)) - 100;
      let maxY = Math.max(...particles.map(p => p.y)) + 100;
      if (particles.length === 0) {
        minX = -1000; maxX = 1000; minY = -1000; maxY = 1000;
      }
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // Click position in canvas units relative to center
      const canvasCenterX = canvasRef.current!.width / 2;
      const canvasCenterY = canvasRef.current!.height / 2;
      
      const pSimX = centerX + (launchOrigin.x - canvasCenterX - pan.x) / zoom;
      const pSimY = centerY + (launchOrigin.y - canvasCenterY - pan.y) / zoom;

      // Calculate velocity vector magnitude and direction
      // drag length defines velocity (x0.05 speed factor)
      const vx = (launchOrigin.x - launchTarget.x) * 0.05 / zoom;
      const vy = (launchOrigin.y - launchTarget.y) * 0.05 / zoom;

      const m = parseFloat(newMass) || 100;
      const id = Date.now();
      const color = m >= 500 ? '#C5A059' : (particles.length % 2 === 0 ? '#E63946' : '#1D3557');

      const newParticle: Particle = {
        id,
        x: pSimX,
        y: pSimY,
        vx,
        vy,
        mass: m,
        color
      };

      setParticles(prev => [...prev, newParticle]);
      setLaunchOrigin(null);
      setLaunchTarget(null);
      window.showAtelierToast("Orbiting particle launched successfully!", "success");
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom(prev => Math.min(Math.max(prev * factor, 0.05), 15));
  };

  const handleExportState = () => {
    try {
      const stateString = JSON.stringify(particles, null, 2);
      navigator.clipboard.writeText(stateString);
      window.showAtelierToast("Gravitational system state copied to clipboard!", "success");
    } catch (e) {
      window.showAtelierToast("Could not export system state.", "warning");
    }
  };

  const handleImportState = () => {
    window.showAtelierConfirm(
      "IMPORT STATE FROM CLIPBOARD",
      "This will shred all active stars and replace them with the parsed clipboard JSON coordinates. Continue?",
      async () => {
        try {
          const text = await navigator.clipboard.readText();
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.every(p => 'x' in p && 'y' in p && 'mass' in p)) {
            setParticles(parsed);
            window.showAtelierToast("System particles imported successfully!", "success");
          } else {
            throw new Error("Invalid N-body state array schema.");
          }
        } catch (e: any) {
          window.showAtelierToast(`Import Failed: ${e.message}`, "warning");
        }
      }
    );
  };

  return (
    <div ref={sectionRef} className="w-full py-4 space-y-6" id="barnes-hut-simulator">
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        
        {/* Left canvas simulator viewport */}
        <div className="space-y-6">
          <div className="scroll-reveal">
            <span className="geo-block-red text-[11px] font-bold tracking-widest inline-flex items-center gap-2">
              <Activity className="w-4 h-4" />
              LABORATORY APPARATUS MODULE XV
            </span>
            <h2 className="font-display text-xl sm:text-3xl text-[#1D3557] mt-3">N-BODY GRAVITY SIMULATOR</h2>
            <p className="font-body text-xs text-[#1D3557]/70 uppercase tracking-widest mt-1">Barnes-Hut Spatial Indexing Quadtree O(N log N) solver</p>
            <div className="line-separator max-w-sm mt-3" />
          </div>

          {/* Interactive simulator window */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between border-b border-dashed border-[#1D3557]/20 pb-2 mb-3 gap-3">
              <span className="font-display text-sm text-[#1D3557]">
                🖥 DRAFT LABORATORY OSCILLOSCOPE GAUGE
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`ticket-btn text-[9px] py-1 px-3 flex items-center gap-1 ${isPlaying ? 'bg-[#1D3557]' : 'bg-[#E63946]'}`}
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isPlaying ? 'PAUSE' : 'RUN Physics'}</span>
                </button>
                <button
                  onClick={() => setParticles([])}
                  className="ticket-btn text-[9px] py-1 px-3 bg-red-800 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>CLEAR</span>
                </button>
              </div>
            </div>

            {/* Sim viewport */}
            <div className="relative bg-[#FFFDF0] border-2 border-[#C5A059] p-2 shadow-inner rounded-sm overflow-hidden w-full select-none">
              <canvas
                ref={canvasRef}
                width="600"
                height="400"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                onContextMenu={e => e.preventDefault()}
                className="block bg-[#FFFDF0] border border-[#C5A059]/40 w-full h-auto aspect-[3/2] cursor-crosshair"
              />
              
              {/* Dynamic Coordinate Compass Watermark */}
              <div className="absolute bottom-4 left-4 font-mono text-[9px] text-[#1D3557]/50 pointer-events-none">
                PAN X: {pan.x.toFixed(0)}m | Y: {pan.y.toFixed(0)}m | ZOOM: {zoom.toFixed(2)}x
              </div>

              {/* Instructions watermark overlays */}
              <div className="absolute top-4 right-4 bg-white/75 backdrop-blur-sm border border-[#1D3557]/20 p-2 font-body text-[8px] text-[#1D3557]/70 space-y-0.5 leading-normal rounded-sm pointer-events-none">
                <div>• Left Click & Drag: Launch particle with velocity vector</div>
                <div>• Shift + Drag / Right Click: Pan simulator coordinates</div>
                <div>• Scroll Wheel: Zoom simulation viewport bounds</div>
              </div>
            </div>

            {/* Sim presets quick loaders */}
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              <button onClick={() => loadPreset('solar-system')} className="ticket-btn text-[9px] py-1.5 px-3">⭐️ Solar System</button>
              <button onClick={() => loadPreset('galaxy-collision')} className="ticket-btn text-[9px] py-1.5 px-3">🌀 Galaxy Collision</button>
              <button onClick={() => loadPreset('lagrange')} className="ticket-btn text-[9px] py-1.5 px-3">♾ Figure-8 Orbit</button>
              <button onClick={() => loadPreset('chaotic')} className="ticket-btn text-[9px] py-1.5 px-3">🎲 Chaos Orbit</button>
            </div>
          </div>
        </div>

        {/* Right Settings panel & diagnostics log ledger */}
        <div className="space-y-6">
          
          {/* Simulation physical parameters */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              🔌 GRAVITATIONAL SYSTEM CALIBRATIONS
            </span>
            <div className="space-y-4 font-body text-xs text-[#1D3557]">
              
              {/* Launcher mass */}
              <div>
                <label className="font-bold block mb-1">LAUNCH MASS FOR NEW BODIES (kg):</label>
                <input
                  type="number"
                  value={newMass}
                  onChange={(e) => setNewMass(e.target.value)}
                  className="w-full input-vintage text-xs font-bold bg-transparent border-b border-[#1D3557] outline-none"
                  placeholder="100.0"
                />
              </div>

              {/* Gravity G slider */}
              <div>
                <div className="flex justify-between font-bold">
                  <span>NEWTONIAN GRAVITY FACTOR G:</span>
                  <span className="text-[#E63946]">{gravConstant.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="1.50"
                  step="0.01"
                  value={gravConstant}
                  onChange={(e) => setGravConstant(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[#F5F1E8] border border-[#1D3557] outline-none accent-[#E63946] cursor-pointer mt-1"
                />
              </div>

              {/* Theta BH slider */}
              <div>
                <div className="flex justify-between font-bold">
                  <span>BARNES-HUT THETA RATIO θ:</span>
                  <span className="text-[#E63946]">{theta.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.50"
                  step="0.05"
                  value={theta}
                  onChange={(e) => setTheta(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[#F5F1E8] border border-[#1D3557] outline-none accent-[#E63946] cursor-pointer mt-1"
                />
                <span className="font-body text-[8px] text-[#1D3557]/50 block leading-normal mt-1">
                  Higher θ speeds up calculations ($O(N \log N)$), lower θ approaches exact $O(N^2)$ orbits.
                </span>
              </div>

              {/* Checks */}
              <div className="grid grid-cols-2 gap-4 border-t border-dashed border-[#1D3557]/15 pt-3">
                <div>
                  <label className="font-bold block mb-1">COLLISION PROTOCOL:</label>
                  <select
                    value={collisionType}
                    onChange={(e) => setCollisionType(e.target.value)}
                    className="w-full font-body text-xs font-bold bg-[#F5F1E8] border border-[#1D3557] py-1 px-2 mt-1"
                  >
                    <option value="elastic">Elastic Rebounds</option>
                    <option value="merge">Coalescing Merges</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="showQuad"
                    checked={showQuadtree}
                    onChange={(e) => setShowQuadtree(e.target.checked)}
                    className="w-4 h-4 accent-[#E63946] border border-[#1D3557]"
                  />
                  <label htmlFor="showQuad" className="font-bold cursor-pointer">VISUALIZE QUADTREE</label>
                </div>
              </div>

              {/* Copy/Paste states */}
              <div className="flex gap-2 pt-2 border-t border-dashed border-[#1D3557]/10">
                <button
                  onClick={handleExportState}
                  className="flex-1 ticket-btn text-[9px] py-1 px-3 bg-[#1D3557] hover:bg-[#E63946] text-white flex items-center justify-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>EXPORT SYSTEM STATE</span>
                </button>
                <button
                  onClick={handleImportState}
                  className="flex-1 ticket-btn text-[9px] py-1 px-3 bg-[#1D3557] hover:bg-[#E63946] text-white flex items-center justify-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  <span>IMPORT SYSTEM STATE</span>
                </button>
              </div>

            </div>
          </div>

          {/* Performance ledger diagnostic typewriter block */}
          <div className="scroll-reveal relative">
            <span className="absolute top-2 right-4 font-display text-[9px] text-[#C5A059] font-bold tracking-widest z-10">GRAVITY DIAGNOSTIC</span>
            <pre className="w-full text-[10px] bg-[#F4ECD8] text-[#332211] font-body p-4 border-2 border-[#C5A059] rounded-sm max-h-[220px] overflow-y-auto shadow-inner leading-relaxed whitespace-pre-wrap">
              {logOutput}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BarnesHutSimulator;
