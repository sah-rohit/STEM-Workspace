import { useState, useEffect, useRef } from 'react';
import { Compass } from 'lucide-react';

interface Point {
  id: number;
  x: number; // grid coords, e.g., -5 to 5
  y: number;
}

interface Segment {
  id: number;
  p1Id: number;
  p2Id: number;
}

interface Circle {
  id: number;
  centerId: number;
  edgeId: number;
}

interface Polygon {
  id: number;
  pointIds: number[]; // sequential points ID list
}

const GeometryLab = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Geometry entities list
  const [points, setPoints] = useState<Point[]>([
    { id: 1, x: -3, y: -2 },
    { id: 2, x: 3, y: -2 },
    { id: 3, x: 0, y: 3 }
  ]);
  const [segments, setSegments] = useState<Segment[]>([
    { id: 1, p1Id: 1, p2Id: 2 },
    { id: 2, p1Id: 2, p2Id: 3 },
    { id: 3, p1Id: 3, p2Id: 1 }
  ]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [polygons, setPolygons] = useState<Polygon[]>([
    { id: 1, pointIds: [1, 2, 3] }
  ]);

  // Construction States
  const [mode, setMode] = useState<'point' | 'segment' | 'circle' | 'polygon' | 'select'>('select');
  const [selectedEntity, setSelectedEntity] = useState<{ type: 'point' | 'segment' | 'circle' | 'polygon'; id: number } | null>(null);

  // In-progress creation buffers
  const [segmentBuffer, setSegmentBuffer] = useState<number | null>(null);
  const [circleBuffer, setCircleBuffer] = useState<number | null>(null);
  const [polygonBuffer, setPolygonBuffer] = useState<number[]>([]);

  // Local calculation reports
  const [logOutput, setLogOutput] = useState<string>('');

  // Coordinate mapping variables
  const gridRange = 10; // -10 to 10 on both axes

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

  // Redraw when geometries or states change
  useEffect(() => {
    drawGeometryGrid();
    calculateSelectedMetrics();
  }, [points, segments, circles, polygons, selectedEntity, mode, segmentBuffer, circleBuffer, polygonBuffer]);

  // Grid Coordinate converter helpers
  const getCoords = (clientX: number, clientY: number, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * canvas.width;
    const py = ((clientY - rect.top) / rect.height) * canvas.height;

    const pad = 40;
    // Map back from px to grid coords
    const gridX = ((px - pad) / (canvas.width - 2 * pad)) * (2 * gridRange) - gridRange;
    const gridY = gridRange - ((py - pad) / (canvas.height - 2 * pad)) * (2 * gridRange);

    // Snap to nearest integer grid coordinates for perfect physical drawing snaps!
    return {
      x: Math.round(gridX),
      y: Math.round(gridY)
    };
  };

  const toPx = (gx: number, gy: number, canvas: HTMLCanvasElement) => {
    const pad = 40;
    const px = pad + ((gx + gridRange) / (2 * gridRange)) * (canvas.width - 2 * pad);
    const py = pad + ((gridRange - gy) / (2 * gridRange)) * (canvas.height - 2 * pad);
    return { x: px, y: py };
  };

  // Canvas drawing loop
  const drawGeometryGrid = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Grid lines
    ctx.strokeStyle = 'rgba(0, 40, 104, 0.05)';
    ctx.lineWidth = 1;

    for (let g = -gridRange; g <= gridRange; g++) {
      const pHoriz1 = toPx(-gridRange, g, canvas);
      const pHoriz2 = toPx(gridRange, g, canvas);
      ctx.beginPath(); ctx.moveTo(pHoriz1.x, pHoriz1.y); ctx.lineTo(pHoriz2.x, pHoriz2.y); ctx.stroke();

      const pVert1 = toPx(g, -gridRange, canvas);
      const pVert2 = toPx(g, gridRange, canvas);
      ctx.beginPath(); ctx.moveTo(pVert1.x, pVert1.y); ctx.lineTo(pVert2.x, pVert2.y); ctx.stroke();
    }

    // 2. Axes Lines
    ctx.strokeStyle = '#1D3557';
    ctx.lineWidth = 2.5;

    const pYAxisTop = toPx(0, gridRange, canvas);
    const pYAxisBottom = toPx(0, -gridRange, canvas);
    ctx.beginPath(); ctx.moveTo(pYAxisTop.x, pYAxisTop.y); ctx.lineTo(pYAxisBottom.x, pYAxisBottom.y); ctx.stroke();

    const pXAxisLeft = toPx(-gridRange, 0, canvas);
    const pXAxisRight = toPx(gridRange, 0, canvas);
    ctx.beginPath(); ctx.moveTo(pXAxisLeft.x, pXAxisLeft.y); ctx.lineTo(pXAxisRight.x, pXAxisRight.y); ctx.stroke();

    // Axis tick numbers
    ctx.fillStyle = '#1D3557';
    ctx.font = '8px "Special Elite", monospace';
    ctx.textAlign = 'center';

    for (let tick = -gridRange; tick <= gridRange; tick += 2) {
      if (tick === 0) continue;
      // X Axis ticks
      const pxX = toPx(tick, 0, canvas);
      ctx.fillText(String(tick), pxX.x, pxX.y + 12);
      ctx.beginPath(); ctx.moveTo(pxX.x, pxX.y - 4); ctx.lineTo(pxX.x, pxX.y + 4); ctx.stroke();

      // Y Axis ticks
      const pxY = toPx(0, tick, canvas);
      ctx.fillText(String(tick), pxY.x - 12, pxY.y + 3);
      ctx.beginPath(); ctx.moveTo(pxY.x - 4, pxY.y); ctx.lineTo(pxY.x + 4, pxY.y); ctx.stroke();
    }

    // 3. Draw Polygons
    ctx.fillStyle = 'rgba(0, 40, 104, 0.04)';
    ctx.strokeStyle = 'rgba(0, 40, 104, 0.3)';
    ctx.lineWidth = 1.5;

    polygons.forEach(poly => {
      const isSelected = selectedEntity?.type === 'polygon' && selectedEntity.id === poly.id;
      ctx.fillStyle = isSelected ? 'rgba(230, 57, 70, 0.08)' : 'rgba(0, 40, 104, 0.04)';

      ctx.beginPath();
      poly.pointIds.forEach((pId, idx) => {
        const pt = points.find(p => p.id === pId);
        if (pt) {
          const px = toPx(pt.x, pt.y, canvas);
          if (idx === 0) ctx.moveTo(px.x, px.y);
          else ctx.lineTo(px.x, px.y);
        }
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // 4. Draw Circles
    circles.forEach(circ => {
      const center = points.find(p => p.id === circ.centerId);
      const edge = points.find(p => p.id === circ.edgeId);
      if (center && edge) {
        const isSelected = selectedEntity?.type === 'circle' && selectedEntity.id === circ.id;

        const cPx = toPx(center.x, center.y, canvas);
        const ePx = toPx(edge.x, edge.y, canvas);
        const radius = Math.sqrt(Math.pow(ePx.x - cPx.x, 2) + Math.pow(ePx.y - cPx.y, 2));

        ctx.strokeStyle = isSelected ? '#E63946' : '#1D3557';
        ctx.lineWidth = isSelected ? 3 : 1.5;

        // Draw Circle Line
        ctx.beginPath();
        ctx.arc(cPx.x, cPx.y, radius, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw dashed radius
        ctx.strokeStyle = 'rgba(29, 53, 87, 0.3)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(cPx.x, cPx.y);
        ctx.lineTo(ePx.x, ePx.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // 5. Draw Line Segments
    segments.forEach(seg => {
      const p1 = points.find(p => p.id === seg.p1Id);
      const p2 = points.find(p => p.id === seg.p2Id);
      if (p1 && p2) {
        const isSelected = selectedEntity?.type === 'segment' && selectedEntity.id === seg.id;
        const px1 = toPx(p1.x, p1.y, canvas);
        const px2 = toPx(p2.x, p2.y, canvas);

        ctx.strokeStyle = isSelected ? '#E63946' : '#1D3557';
        ctx.lineWidth = isSelected ? 3.5 : 2;

        ctx.beginPath();
        ctx.moveTo(px1.x, px1.y);
        ctx.lineTo(px2.x, px2.y);
        ctx.stroke();
      }
    });

    // 6. Draw point buffers
    if (segmentBuffer !== null) {
      const pt = points.find(p => p.id === segmentBuffer);
      if (pt) {
        const px = toPx(pt.x, pt.y, canvas);
        ctx.strokeStyle = '#E63946';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px.x, px.y, 8, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }

    if (circleBuffer !== null) {
      const pt = points.find(p => p.id === circleBuffer);
      if (pt) {
        const px = toPx(pt.x, pt.y, canvas);
        ctx.strokeStyle = '#C5A059';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px.x, px.y, 8, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }

    if (polygonBuffer.length > 0) {
      ctx.strokeStyle = '#E63946';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      polygonBuffer.forEach((pId, idx) => {
        const pt = points.find(p => p.id === pId);
        if (pt) {
          const px = toPx(pt.x, pt.y, canvas);
          if (idx === 0) ctx.moveTo(px.x, px.y);
          else ctx.lineTo(px.x, px.y);
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 7. Draw Point Nodes
    points.forEach(pt => {
      const isSelected = selectedEntity?.type === 'point' && selectedEntity.id === pt.id;
      const px = toPx(pt.x, pt.y, canvas);

      ctx.fillStyle = isSelected ? '#E63946' : '#1D3557';
      ctx.strokeStyle = '#FFFDF0';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.arc(px.x, px.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Point label
      ctx.fillStyle = '#1D3557';
      ctx.font = 'bold 9px "Cutive Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`P${pt.id}(${pt.x},${pt.y})`, px.x + 8, px.y - 4);
    });
  };

  // Click handler on grid
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCoords(e.clientX, e.clientY, canvas);
    
    // Bounds check to avoid drawing off the patent canvas
    if (Math.abs(coords.x) > gridRange || Math.abs(coords.y) > gridRange) return;

    if (mode === 'point') {
      // Avoid duplicate points on exactly the same coordinate grids
      const exists = points.find(p => p.x === coords.x && p.y === coords.y);
      if (exists) {
        window.showAtelierToast("A point already exists at this grid coordinate intersection.", "warning");
        return;
      }
      const nextId = points.length > 0 ? Math.max(...points.map(p => p.id)) + 1 : 1;
      setPoints(prev => [...prev, { id: nextId, x: coords.x, y: coords.y }]);
      window.showAtelierToast(`Point P${nextId} created at grid coordinates (${coords.x}, ${coords.y}).`, "info");
    } 
    else if (mode === 'segment') {
      // Find if clicked on an existing point node
      const clickedPt = findClickedPoint(coords.x, coords.y);
      if (clickedPt) {
        if (segmentBuffer === null) {
          setSegmentBuffer(clickedPt.id);
          window.showAtelierToast("Base point selected. Click a target point to connect segment.", "info");
        } else {
          if (segmentBuffer === clickedPt.id) {
            setSegmentBuffer(null);
            return;
          }
          // Create line segment
          const nextId = segments.length > 0 ? Math.max(...segments.map(s => s.id)) + 1 : 1;
          setSegments(prev => [...prev, { id: nextId, p1Id: segmentBuffer, p2Id: clickedPt.id }]);
          setSegmentBuffer(null);
          window.showAtelierToast(`Line segment S${nextId} established.`, "success");
        }
      }
    } 
    else if (mode === 'circle') {
      const clickedPt = findClickedPoint(coords.x, coords.y);
      if (clickedPt) {
        if (circleBuffer === null) {
          setCircleBuffer(clickedPt.id);
          window.showAtelierToast("Center point selected. Click another point to specify radius bounds.", "info");
        } else {
          if (circleBuffer === clickedPt.id) {
            setCircleBuffer(null);
            return;
          }
          const nextId = circles.length > 0 ? Math.max(...circles.map(c => c.id)) + 1 : 1;
          setCircles(prev => [...prev, { id: nextId, centerId: circleBuffer, edgeId: clickedPt.id }]);
          setCircleBuffer(null);
          window.showAtelierToast(`Euclidean circle C${nextId} constructed.`, "success");
        }
      }
    } 
    else if (mode === 'polygon') {
      const clickedPt = findClickedPoint(coords.x, coords.y);
      if (clickedPt) {
        if (polygonBuffer.includes(clickedPt.id)) {
          // Close polygon if clicked on the first point in buffer and length >= 3
          if (polygonBuffer[0] === clickedPt.id && polygonBuffer.length >= 3) {
            const nextId = polygons.length > 0 ? Math.max(...polygons.map(p => p.id)) + 1 : 1;
            setPolygons(prev => [...prev, { id: nextId, pointIds: [...polygonBuffer] }]);
            setPolygonBuffer([]);
            window.showAtelierToast(`Polygon L${nextId} construction sealed.`, "success");
          } else {
            setPolygonBuffer([]);
            window.showAtelierToast("Polygon building discarded. Points must be sequential without self-intersections.", "warning");
          }
        } else {
          setPolygonBuffer(prev => [...prev, clickedPt.id]);
          window.showAtelierToast(`Point P${clickedPt.id} queued in polygon buffer. Click starting point to seal.`, "info");
        }
      }
    } 
    else if (mode === 'select') {
      // Find nearest element clicked
      const clickedPt = findClickedPoint(coords.x, coords.y);
      if (clickedPt) {
        setSelectedEntity({ type: 'point', id: clickedPt.id });
        return;
      }

      // Check segments
      const clickedSeg = findClickedSegment(coords.x, coords.y);
      if (clickedSeg) {
        setSelectedEntity({ type: 'segment', id: clickedSeg.id });
        return;
      }

      // Check circle bounds
      const clickedCirc = findClickedCircle(coords.x, coords.y);
      if (clickedCirc) {
        setSelectedEntity({ type: 'circle', id: clickedCirc.id });
        return;
      }

      // Check polygons
      const clickedPoly = findClickedPolygon(coords.x, coords.y);
      if (clickedPoly) {
        setSelectedEntity({ type: 'polygon', id: clickedPoly.id });
        return;
      }

      setSelectedEntity(null);
    }
  };

  const findClickedPoint = (gx: number, gy: number) => {
    return points.find(p => Math.abs(p.x - gx) <= 0.6 && Math.abs(p.y - gy) <= 0.6);
  };

  const findClickedSegment = (gx: number, gy: number) => {
    return segments.find(seg => {
      const p1 = points.find(p => p.id === seg.p1Id);
      const p2 = points.find(p => p.id === seg.p2Id);
      if (p1 && p2) {
        // Point-to-line distance formula
        const num = Math.abs((p2.y - p1.y) * gx - (p2.x - p1.x) * gy + p2.x * p1.y - p2.y * p1.x);
        const den = Math.sqrt(Math.pow(p2.y - p1.y, 2) + Math.pow(p2.x - p1.x, 2));
        const dist = num / (den || 1);

        // Check if inside bounding box bounds
        const minX = Math.min(p1.x, p2.x) - 0.5;
        const maxX = Math.max(p1.x, p2.x) + 0.5;
        const minY = Math.min(p1.y, p2.y) - 0.5;
        const maxY = Math.max(p1.y, p2.y) + 0.5;

        return dist <= 0.4 && gx >= minX && gx <= maxX && gy >= minY && gy <= maxY;
      }
      return false;
    });
  };

  const findClickedCircle = (gx: number, gy: number) => {
    return circles.find(circ => {
      const c = points.find(p => p.id === circ.centerId);
      const e = points.find(p => p.id === circ.edgeId);
      if (c && e) {
        const rad = Math.sqrt(Math.pow(e.x - c.x, 2) + Math.pow(e.y - c.y, 2));
        const dist = Math.sqrt(Math.pow(gx - c.x, 2) + Math.pow(gy - c.y, 2));
        return Math.abs(dist - rad) <= 0.5;
      }
      return false;
    });
  };

  const findClickedPolygon = (gx: number, gy: number) => {
    // Simple Ray-casting / winding number poly point check
    return polygons.find(poly => {
      let inside = false;
      const polyPts = poly.pointIds.map(pId => points.find(p => p.id === pId)).filter(p => p !== undefined) as Point[];

      for (let i = 0, j = polyPts.length - 1; i < polyPts.length; j = i++) {
        const xi = polyPts[i].x, yi = polyPts[i].y;
        const xj = polyPts[j].x, yj = polyPts[j].y;

        const intersect = ((yi > gy) !== (yj > gy)) && (gx < (xj - xi) * (gy - yi) / ((yj - yi) || 1) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    });
  };

  // Perform Coordinate & Euclidean analysis calculations
  const calculateSelectedMetrics = () => {
    if (!selectedEntity) {
      setLogOutput("GEOMETRY PLOTTER MODULE ACTIVE.\nPlace points, connect lines, draw circles and select objects to measure metrics.");
      return;
    }

    let report = `ANALYTIC GEOMETRY MEASUREMENT PRINTOUT:\n`;
    report += `------------------------------------------------------------\n`;

    if (selectedEntity.type === 'point') {
      const pt = points.find(p => p.id === selectedEntity.id);
      if (pt) {
        report += `ENTITY IDENTIFIER: POINT P${pt.id}\n\n`;
        report += `  - Coordinate Position:  x = ${pt.x}, y = ${pt.y}\n`;
        report += `  - Distance to Origin:   ${Math.sqrt(pt.x * pt.x + pt.y * pt.y).toFixed(4)} units\n`;
        report += `  - Quadrant Location:     ${pt.x > 0 ? (pt.y > 0 ? 'Quadrant I' : 'Quadrant IV') : (pt.y > 0 ? 'Quadrant II' : 'Quadrant III')}\n`;
      }
    } 
    else if (selectedEntity.type === 'segment') {
      const seg = segments.find(s => s.id === selectedEntity.id);
      const p1 = points.find(p => p && p.id === seg?.p1Id);
      const p2 = points.find(p => p && p.id === seg?.p2Id);

      if (seg && p1 && p2) {
        const length = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        const slope = (p2.x - p1.x) !== 0 ? (p2.y - p1.y) / (p2.x - p1.x) : Infinity;
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        report += `ENTITY IDENTIFIER: SEGMENT S${seg.id}\n\n`;
        report += `  - Terminal point 1:     P${p1.id} (${p1.x}, ${p1.y})\n`;
        report += `  - Terminal point 2:     P${p2.id} (${p2.x}, ${p2.y})\n`;
        report += `  - Euclidean Length:     ${length.toFixed(4)} units\n`;
        report += `  - Cartesian Slope (m):   ${slope === Infinity ? 'UNDEFINED (VERTICAL)' : slope.toFixed(4)}\n`;
        report += `  - Angle of Inclination:  ${slope === Infinity ? 90 : (Math.atan(slope) * 180 / Math.PI).toFixed(2)}°\n`;
        report += `  - Midpoint Coordinate:  M(${midX.toFixed(2)}, ${midY.toFixed(2)})\n`;
      }
    } 
    else if (selectedEntity.type === 'circle') {
      const circ = circles.find(c => c.id === selectedEntity.id);
      const c = points.find(p => p && p.id === circ?.centerId);
      const e = points.find(p => p && p.id === circ?.edgeId);

      if (circ && c && e) {
        const rad = Math.sqrt(Math.pow(e.x - c.x, 2) + Math.pow(e.y - c.y, 2));
        const circVal = 2 * Math.PI * rad;
        const areaVal = Math.PI * rad * rad;

        report += `ENTITY IDENTIFIER: CIRCLE C${circ.id}\n\n`;
        report += `  - Center point Node:    P${c.id} (${c.x}, ${c.y})\n`;
        report += `  - Radial edge point:    P${e.id} (${e.x}, ${e.y})\n`;
        report += `  - Radial Length (r):    ${rad.toFixed(4)} units\n`;
        report += `  - Circumference (C):    ${circVal.toFixed(4)} units\n`;
        report += `  - Area (A) metric:      ${areaVal.toFixed(4)} sq. units\n`;
      }
    } 
    else if (selectedEntity.type === 'polygon') {
      const poly = polygons.find(p => p.id === selectedEntity.id);
      if (poly) {
        const polyPts = poly.pointIds.map(pId => points.find(p => p.id === pId)).filter(p => p !== undefined) as Point[];
        
        // Shoelace Polygon Area Formula
        let shoelaceSum = 0;
        let perimeter = 0;
        const N = polyPts.length;

        for (let i = 0; i < N; i++) {
          const next = (i + 1) % N;
          const pCurr = polyPts[i];
          const pNext = polyPts[next];

          shoelaceSum += pCurr.x * pNext.y - pNext.x * pCurr.y;
          perimeter += Math.sqrt(Math.pow(pNext.x - pCurr.x, 2) + Math.pow(pNext.y - pCurr.y, 2));
        }

        const areaVal = Math.abs(shoelaceSum) / 2;

        report += `ENTITY IDENTIFIER: POLYGON L${poly.id} (${N}-gon)\n\n`;
        report += `  - Vertices count:       ${N} corners\n`;
        report += `  - Perimeter path:       ${perimeter.toFixed(4)} units\n`;
        report += `  - Shoelace Area (A):    ${areaVal.toFixed(4)} sq. units\n`;
        report += `  - Vertices coordinates:  \n`;
        polyPts.forEach((pt, idx) => {
          report += `     Vertex ${idx + 1} ➔ P${pt.id} (${pt.x}, ${pt.y})\n`;
        });
      }
    }

    report += `------------------------------------------------------------\n`;
    report += `SYSTEM CODE: 1956-EUCLIDEAN-METRICS`;
    setLogOutput(report);
  };

  const wipeDraftingBoard = () => {
    setPoints([]);
    setSegments([]);
    setCircles([]);
    setPolygons([]);
    setSelectedEntity(null);
    setSegmentBuffer(null);
    setCircleBuffer(null);
    setPolygonBuffer([]);
    setLogOutput("DRAFTING CONSTRUCTOR BOARD COMPLETELY WIPED.");
  };

  return (
    <div ref={sectionRef} className="w-full py-4 space-y-6" id="geometry-lab">
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Control card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="scroll-reveal">
            <span className="geo-block-red text-[11px] font-bold tracking-widest inline-flex items-center gap-2">
              <Compass className="w-4 h-4" />
              LABORATORY APPARATUS MODULE VII
            </span>
            <h2 className="font-display text-xl sm:text-3xl text-[#1D3557] mt-3">GEOMETRY GRID CONSTRUCTOR</h2>
            <p className="font-body text-xs text-[#1D3557]/70 uppercase tracking-widest mt-1">Euclidean construction & Shoelace Area Solver</p>
            <div className="line-separator max-w-sm mt-3" />
          </div>

          {/* Mode Selector buttons */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              📐 CONSTRUCTION UTILITIES
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-center mb-4">
              {[
                { name: 'select', label: '🔍 Select / Measure' },
                { name: 'point', label: '● Place Point' },
                { name: 'segment', label: '─ Draw Segment' },
                { name: 'circle', label: '○ Construct Circle' },
                { name: 'polygon', label: '⬡ Seal Polygon' }
              ].map((m) => (
                <button
                  key={m.name}
                  onClick={() => {
                    setMode(m.name as any);
                    setSegmentBuffer(null);
                    setCircleBuffer(null);
                    setPolygonBuffer([]);
                  }}
                  className={`ticket-btn py-2 px-1 text-[10px] sm:text-xs font-bold leading-none ${
                    mode === m.name ? 'bg-[#E63946] text-[#FFFDF0]' : 'bg-[#1D3557] text-[#FFFDF0]'
                  }`}
                  style={{ gridColumn: m.name === 'select' ? 'span 2' : 'auto' }}
                >
                  {m.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={wipeDraftingBoard}
              className="w-full ticket-btn py-1.5 text-xs bg-red-800 hover:bg-[#1D3557] flex items-center justify-center gap-1.5"
            >
              [ WIPE DRAFTING BOARD ]
            </button>
          </div>

          {/* Help card */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5 font-body text-xs text-[#1D3557] leading-relaxed">
            <span className="font-display text-xs text-[#E63946] block mb-2 font-bold uppercase tracking-wider">🔬 CONSTRUCTOR PROCEDURES:</span>
            <ul className="list-disc list-inside space-y-1.5 text-[11px] text-[#1D3557]/80">
              <li><strong>Place Point</strong>: Click the grid to snap a point to integer coordinates.</li>
              <li><strong>Draw Segment</strong>: Click point A, then click point B to wire a line.</li>
              <li><strong>Construct Circle</strong>: Click center point A, then edge point B.</li>
              <li><strong>Seal Polygon</strong>: Click sequential points A, B, C, then click A again to seal a shape.</li>
              <li><strong>Select / Measure</strong>: Click any line, point, circle or shape to run analytic calculations.</li>
            </ul>
          </div>
        </div>

        {/* Right Canvas plotter (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              📐 BLUEPRINT GEOMETRY SHEET
            </span>

            {/* Responsive scroll canvas grid */}
            <div className="bg-[#F4ECD8] border-2 border-[#C5A059] p-3 shadow-inner rounded-sm overflow-x-auto w-full">
              <canvas
                ref={canvasRef}
                width="480"
                height="480"
                onClick={handleCanvasClick}
                className="block bg-[#F4ECD8] border border-[#C5A059]/40 cursor-crosshair mx-auto max-w-full"
              />
            </div>

            {/* Calculations printout */}
            <div className="relative mt-4">
              <span className="absolute top-2 right-4 font-display text-[9px] text-[#C5A059] font-bold tracking-widest z-10">CALCULATION TICKET OUT</span>
              <pre className="w-full text-[10px] bg-[#F4ECD8] text-[#332211] font-body p-4 border-2 border-[#C5A059] rounded-sm max-h-[220px] overflow-x-auto shadow-inner leading-relaxed whitespace-pre">
                {logOutput}
              </pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GeometryLab;
