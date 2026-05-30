import { useState, useEffect, useRef } from 'react';
import { Droplet } from 'lucide-react';

interface LeakEquivalent {
  label: string;
  volumePerUnit: number; // liters per unit
  icon: string;
}

const EQUIVALENTS: LeakEquivalent[] = [
  { label: "Standard 8-minute Showers", volumePerUnit: 65, icon: "🚿" },
  { label: "Loads of Laundry", volumePerUnit: 75, icon: "🧺" },
  { label: "Olympic-sized Swimming Pools", volumePerUnit: 2500000, icon: "🏊" },
  { label: "Fills of 10-Gallon Fish Tanks", volumePerUnit: 37.8, icon: "🐠" },
  { label: "Standard Toilet Flushes", volumePerUnit: 6, icon: "🚽" }
];

const LeakCostCalculator = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Leak parameters
  const [dripRate, setDripRate] = useState<number>(30); // drips per minute
  const [utilityCost, setUtilityCost] = useState<string>('0.008'); // $ per liter (approx $8 per 1000 liters)
  
  // Custom slider values
  const [waterUnit, setWaterUnit] = useState<'liters' | 'gallons'>('liters');

  // Calculation outputs
  const [annualWaste, setAnnualWaste] = useState<number>(0);
  const [annualCost, setAnnualCost] = useState<number>(0);
  
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

  // Recalculate calculations when parameters update
  useEffect(() => {
    calculateWaste();
  }, [dripRate, utilityCost, waterUnit]);

  const calculateWaste = () => {
    const dripsMin = parseFloat(String(dripRate)) || 0;
    const costPerLiter = parseFloat(utilityCost) || 0.008;

    if (dripsMin <= 0) {
      setLogOutput("Enter a non-zero drips-per-minute leak rate to estimate utility impact.");
      return;
    }

    // 1 Drip is standard estimated at 0.05 mL of water
    const volumePerDripML = 0.05;
    const volumePerMinML = dripsMin * volumePerDripML;
    const volumePerHourL = (volumePerMinML * 60) / 1000;
    
    const dL = volumePerHourL * 24;
    const wL = dL * 7;
    const aL = dL * 365;

    // Convert to target units for storage
    const litersToGallons = 0.264172;
    
    setAnnualWaste(waterUnit === 'liters' ? aL : aL * litersToGallons);

    const yearCost = aL * costPerLiter;
    setAnnualCost(yearCost);

    // Build printout ledger
    let log = `HOUSEHOLD HYDRAULIC LEAK & UTILITY COST SHEET:\n`;
    log += `------------------------------------------------------------\n`;
    log += `Drip frequency:       ${dripsMin} drips / minute\n`;
    log += `Equivalent Rate:      ${(volumePerHourL * 24).toFixed(2)} liters wasted / day\n`;
    log += `Utility Water Rate:   $${(costPerLiter * 1000).toFixed(2)} per 1000 Liters ($${costPerLiter.toFixed(4)}/L)\n`;
    log += `------------------------------------------------------------\n`;
    log += `WASTED WATER QUANTITY ESTIMATE:\n`;
    log += `  - Daily Waste:        ${(waterUnit === 'liters' ? dL : dL * litersToGallons).toFixed(2)} ${waterUnit}\n`;
    log += `  - Weekly Waste:       ${(waterUnit === 'liters' ? wL : wL * litersToGallons).toFixed(2)} ${waterUnit}\n`;
    log += `  - Annual Waste:       ${(waterUnit === 'liters' ? aL : aL * litersToGallons).toFixed(2)} ${waterUnit}\n\n`;
    log += `FINANCIAL ACCUMULATED IMPACT:\n`;
    log += `  >> YEARLY SURCHARGE:  $${yearCost.toFixed(2)} / year added to utility bills\n`;
    log += `------------------------------------------------------------\n`;
    log += `SYSTEM CODE: 1956-HYDRAULIC-LEAKS`;

    setLogOutput(log);
  };

  return (
    <div ref={sectionRef} className="w-full py-4 space-y-6" id="leak-cost-calculator">
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Control card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="scroll-reveal">
            <span className="geo-block-red text-[11px] font-bold tracking-widest inline-flex items-center gap-2">
              <Droplet className="w-4 h-4 text-white" />
              LABORATORY APPARATUS MODULE XII
            </span>
            <h2 className="font-display text-xl sm:text-3xl text-[#1D3557] mt-3">WATER LEAK ESTIMATOR</h2>
            <p className="font-body text-xs text-[#1D3557]/70 uppercase tracking-widest mt-1">Drip conversions, financial surcharges & equivalents</p>
            <div className="line-separator max-w-sm mt-3" />
          </div>

          {/* Drips rate slider knob */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              💧 LEAK DRIP MEASUREMENT
            </span>
            <div className="space-y-3 font-body text-xs text-[#1D3557]">
              <div>
                <label className="font-bold block mb-1">
                  DRIPS RATE: <span className="text-[#E63946]">{dripRate} drips/min</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="180"
                  step="5"
                  value={dripRate}
                  onChange={(e) => setDripRate(parseInt(e.target.value))}
                  className="w-full h-1 bg-[#1D3557] outline-none cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 border-t border-dashed border-[#1D3557]/15 pt-3">
                <div>
                  <label className="font-bold block mb-1">MEASUREMENT UNIT:</label>
                  <select
                    value={waterUnit}
                    onChange={(e: any) => setWaterUnit(e.target.value)}
                    className="w-full font-body text-xs font-bold bg-[#F5F1E8] border border-[#1D3557] py-1 px-1.5"
                  >
                    <option value="liters">Liters</option>
                    <option value="gallons">Gallons</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">UTILITY COST RATE ($/L):</label>
                  <input
                    type="text"
                    value={utilityCost}
                    onChange={(e) => setUtilityCost(e.target.value)}
                    className="w-full input-vintage text-xs font-bold bg-transparent border-b border-[#1D3557] py-1 px-1.5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Checklist of common leaks */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5 font-body text-xs text-[#1D3557]">
            <span className="font-display text-xs text-[#E63946] block mb-2 font-bold uppercase tracking-wider">🔧 DIAGNOSTIC LEAK CHECKLIST</span>
            <div className="space-y-2 text-[11px] leading-relaxed text-[#1D3557]/80">
              <div className="flex items-start gap-2 border-b border-dashed border-[#1D3557]/10 pb-1.5">
                <input type="checkbox" className="mt-1" defaultChecked />
                <div>
                  <strong>Worn Faucet Washer</strong>
                  <span className="block text-[9px] text-[#1D3557]/60">Typical waste: 3,000 gallons/year</span>
                </div>
              </div>
              <div className="flex items-start gap-2 border-b border-dashed border-[#1D3557]/10 pb-1.5">
                <input type="checkbox" className="mt-1" />
                <div>
                  <strong>Faulty Toilet Flapper</strong>
                  <span className="block text-[9px] text-[#1D3557]/60">Typical waste: Up to 200 gallons/day!</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" />
                <div>
                  <strong>Irrigation Pipeline Fracture</strong>
                  <span className="block text-[9px] text-[#1D3557]/60">Typical waste: 6,000 gallons/month</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right ledger & Waste equivalents (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              📊 REAL-WORLD WASTE COMPARISONS (ANNUALIZED)
            </span>

            {/* Equivalents list visual */}
            <div className="grid sm:grid-cols-2 gap-3 mb-4 font-body text-xs text-[#1D3557]">
              {EQUIVALENTS.map((eq, idx) => {
                // Convert annual liters back to unit equivalency
                const annualLiters = waterUnit === 'liters' ? annualWaste : annualWaste / 0.264172;
                const ratio = annualLiters / eq.volumePerUnit;

                return (
                  <div key={idx} className="bg-[#F5F1E8] p-3 border border-[#1D3557]/15 flex items-center gap-3">
                    <span className="text-2xl">{eq.icon}</span>
                    <div>
                      <span className="font-display text-[#E63946] text-lg block leading-none font-bold">
                        {ratio.toFixed(1)}x
                      </span>
                      <span className="text-[10px] text-[#1D3557]/80 block font-bold leading-tight mt-1">{eq.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Glowing ROI badge */}
            <div className="border-4 double border-[#1D3557] p-4 text-center select-none bg-[#FFFDF0] mb-4">
              <span className="font-display text-3xl text-[#E63946] block mb-1 animate-pulse">
                ${annualCost.toFixed(2)} / year
              </span>
              <span className="font-display-alt text-[9px] text-[#1D3557] tracking-widest block font-bold">
                (Equivalent pure volume: {annualWaste.toFixed(0)} {waterUnit})
              </span>
            </div>

            {/* Printout ledger */}
            <div className="relative mt-4">
              <span className="absolute top-2 right-4 font-display text-[9px] text-[#C5A059] font-bold tracking-widest z-10">LEAK LEDGER OUT</span>
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

export default LeakCostCalculator;
