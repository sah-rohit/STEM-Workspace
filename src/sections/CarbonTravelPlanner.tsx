import { useState, useEffect, useRef } from 'react';
import { Globe } from 'lucide-react';

interface TransportMode {
  key: string;
  label: string;
  baseCO2PerKm: number; // g CO2e per km (single passenger)
  occupancyAdjustable: boolean;
  requiresGrid: boolean;
  icon: string;
}

const MODES: TransportMode[] = [
  { key: 'car-gas', label: "Gasoline Car", baseCO2PerKm: 180, occupancyAdjustable: true, requiresGrid: false, icon: "🚗" },
  { key: 'car-ev', label: "Electric Vehicle (EV)", baseCO2PerKm: 50, occupancyAdjustable: true, requiresGrid: true, icon: "⚡" },
  { key: 'bus', label: "Transit Bus", baseCO2PerKm: 80, occupancyAdjustable: false, requiresGrid: false, icon: "🚌" },
  { key: 'train', label: "Electric Train", baseCO2PerKm: 25, occupancyAdjustable: false, requiresGrid: true, icon: "🚆" },
  { key: 'flight', label: "Commercial Flight", baseCO2PerKm: 150, occupancyAdjustable: false, requiresGrid: false, icon: "✈️" }
];

const GRID_INTENSITIES: { [key: string]: { name: string; intensity: number } } = {
  FR: { name: "France (Low Carbon - Nuclear Mix)", intensity: 60 }, // gCO2e / kWh
  DE: { name: "Germany (Moderate Carbon - Solar/Coal)", intensity: 380 },
  US: { name: "United States (Average Grid Mix)", intensity: 360 },
  IN: { name: "India (High Carbon - Coal Grid)", intensity: 710 },
  CA: { name: "Canada (Hydroelectric / Natural Gas)", intensity: 120 }
};

const CarbonTravelPlanner = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);

  // Travel inputs
  const [distance, setDistance] = useState<string>('300'); // km
  const [occupancy, setOccupancy] = useState<string>('1.5'); // passengers avg
  const [gridRegion, setGridRegion] = useState<string>('US');
  const [radiativeForcing, setRadiativeForcing] = useState<boolean>(true);

  // Outputs
  const [logOutput, setLogOutput] = useState<string>('');

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

  // Recalculate carbon values when parameters update
  useEffect(() => {
    calculateFootprints();
  }, [distance, occupancy, gridRegion, radiativeForcing]);

  const calculateFootprints = () => {
    const distKm = parseFloat(distance) || 0;
    const occ = parseFloat(occupancy) || 1;
    const gridMix = GRID_INTENSITIES[gridRegion]?.intensity || 360;

    if (distKm <= 0) {
      setLogOutput("Enter a valid travel distance to run carbon planners.");
      return;
    }

    const calculated: { [key: string]: number } = {};

    MODES.forEach(mode => {
      let co2 = mode.baseCO2PerKm;

      // Grid factor adjustment for trains/EVs
      if (mode.requiresGrid) {
        // base rating adjusted proportionally based on local grid mix vs. US base standard
        const gridScale = gridMix / 360;
        co2 = mode.baseCO2PerKm * gridScale;
      }

      // Occupancy division scaling
      if (mode.occupancyAdjustable) {
        co2 = co2 / occ;
      }

      // Aviation radiative forcing factor (high altitude ozone thermal scaling x1.9)
      if (mode.key === 'flight' && radiativeForcing) {
        co2 = co2 * 1.9;
      }

      // Total footprint in kg CO2e
      calculated[mode.key] = (co2 * distKm) / 1000;
    });

    // Build printout ledger
    let log = `CARBON EMISSIONS QUANTIFICATION & ANALYSIS LEDGER:\n`;
    log += `------------------------------------------------------------\n`;
    log += `Trip Distance:        ${distKm} km\n`;
    log += `Vehicle Occupancy:    ${occ} passengers (adjustable modes)\n`;
    log += `Local Power Grid Mix: ${GRID_INTENSITIES[gridRegion].name} (${gridMix} gCO2e/kWh)\n`;
    log += `High Altitude RF:     ${radiativeForcing ? 'ACTIVE (×1.9 multiplier applied)' : 'INACTIVE'}\n`;
    log += `------------------------------------------------------------\n`;
    log += `TOTAL QUANTIFIED EMISSIONS (kg CO₂e):\n`;

    Object.keys(calculated).forEach(key => {
      const mode = MODES.find(m => m.key === key);
      if (mode) {
        // Plant offset calculation: a mature tree absorbs approx 22kg CO2 per year
        const treesRequired = calculated[key] / 22;
        log += `  - ${mode.label.padEnd(20)}: ${calculated[key].toFixed(1).padStart(6)} kg CO₂e | Offset: ${treesRequired.toFixed(1).padStart(4)} tree-years\n`;
      }
    });

    log += `------------------------------------------------------------\n`;
    log += `SYSTEM CODE: 1956-CARBON-PLANNER`;

    setLogOutput(log);

    // Draw canvas vertical bars
    drawChart(calculated);
  };

  const drawChart = (calc: { [key: string]: number }) => {
    const canvas = chartCanvasRef.current;
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

    const pad = 40;
    const maxVal = Math.max(...Object.values(calc), 10) * 1.25;

    // Baseline axis
    ctx.strokeStyle = '#1D3557';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pad, canvas.height - pad);
    ctx.lineTo(canvas.width - pad, canvas.height - pad);
    ctx.stroke();

    const barSpacing = (canvas.width - 2 * pad) / MODES.length;
    const barWidth = 32;

    MODES.forEach((mode, idx) => {
      const val = calc[mode.key] ?? 0;
      const bHeight = (val / maxVal) * (canvas.height - 2 * pad);
      const bx = pad + idx * barSpacing + (barSpacing - barWidth) / 2;
      const by = canvas.height - pad - bHeight;

      // Draw metallic card bar
      ctx.fillStyle = mode.key === 'flight' || mode.key.startsWith('car-gas') ? '#E63946' : '#1D3557';
      ctx.strokeStyle = '#1D3557';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(bx, by, barWidth, bHeight, 2);
      ctx.fill();
      ctx.stroke();

      // Labels below
      ctx.fillStyle = '#1D3557';
      ctx.font = 'bold 8px "Cutive Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(mode.label.split(' ')[0], bx + barWidth / 2, canvas.height - 24);
      ctx.fillText(mode.icon, bx + barWidth / 2, canvas.height - 12);

      // Value above
      ctx.fillText(`${val.toFixed(0)}kg`, bx + barWidth / 2, by - 6);
    });
  };

  return (
    <div ref={sectionRef} className="w-full py-4 space-y-6" id="carbon-travel-planner">
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Inputs form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="scroll-reveal">
            <span className="geo-block-red text-[11px] font-bold tracking-widest inline-flex items-center gap-2">
              <Globe className="w-4 h-4 text-white" />
              LABORATORY APPARATUS MODULE XIII
            </span>
            <h2 className="font-display text-xl sm:text-3xl text-[#1D3557] mt-3">CARBON TRAVEL PLANNER</h2>
            <p className="font-body text-xs text-[#1D3557]/70 uppercase tracking-widest mt-1">Multi-mode CO2e trip comparison & grid multipliers</p>
            <div className="line-separator max-w-sm mt-3" />
          </div>

          {/* Core trip values settings */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              ✈️ TRIP SPECS REGISTER
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-body text-xs text-[#1D3557]">
              <div>
                <label className="font-bold block mb-1">TRIP DISTANCE (km):</label>
                <input
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="w-full input-vintage text-xs font-bold bg-transparent border-b border-[#1D3557]"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">VEHICLE OCCUPANCY:</label>
                <input
                  type="number"
                  step="0.5"
                  value={occupancy}
                  onChange={(e) => setOccupancy(e.target.value)}
                  className="w-full input-vintage text-xs font-bold bg-transparent border-b border-[#1D3557]"
                />
              </div>
            </div>
          </div>

          {/* Grid mixes and radiative forcing toggles */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              🔋 POWER GRID MIX & AVIATION FACTORS
            </span>
            <div className="space-y-3 font-body text-xs text-[#1D3557]">
              <div>
                <label className="font-bold block mb-1">ELECTRIC GRID REGION Mix:</label>
                <select
                  value={gridRegion}
                  onChange={(e) => setGridRegion(e.target.value)}
                  className="w-full font-body text-xs font-bold bg-[#F5F1E8] border border-[#1D3557] py-1.5 px-2"
                >
                  {Object.keys(GRID_INTENSITIES).map(key => (
                    <option key={key} value={key}>{GRID_INTENSITIES[key].name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 border-t border-dashed border-[#1D3557]/15 pt-3">
                <input
                  type="checkbox"
                  id="rf-toggle"
                  checked={radiativeForcing}
                  onChange={(e) => setRadiativeForcing(e.target.checked)}
                  className="mt-0.5"
                />
                <label htmlFor="rf-toggle" className="font-bold cursor-pointer">
                  Apply Aviation Radiative Forcing (×1.9)
                </label>
              </div>
              <span className="font-body text-[9px] text-[#1D3557]/50 block leading-normal">
                High-altitude flights release nitrogen oxides and water vapor, magnifying global greenhouse effects compared to surface travel.
              </span>
            </div>
          </div>
        </div>

        {/* Right Output visualizer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              📊 CO₂e EMISSIONS COMPARISON (kg)
            </span>

            {/* Responsive chart container */}
            <div className="bg-[#F4ECD8] border-2 border-[#C5A059] p-3 shadow-inner rounded-sm overflow-x-auto w-full">
              <canvas
                ref={chartCanvasRef}
                width="500"
                height="240"
                className="block bg-[#F4ECD8] border border-[#C5A059]/40 max-w-full mx-auto"
              />
            </div>

            {/* Printout ticket */}
            <div className="relative mt-4">
              <span className="absolute top-2 right-4 font-display text-[9px] text-[#C5A059] font-bold tracking-widest z-10">PLANNER TICKET OUT</span>
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

export default CarbonTravelPlanner;
