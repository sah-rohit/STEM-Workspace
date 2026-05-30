import { useState, useEffect, useRef } from 'react';
import { Sun, Search } from 'lucide-react';

const SolarROICalculator = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);

  // User input states
  const [address, setAddress] = useState<string>('San Diego, CA');
  const [systemSize, setSystemSize] = useState<string>('6.0'); // kW
  const [efficiency, setEfficiency] = useState<string>('20.0'); // %
  const [cost, setCost] = useState<string>('15000'); // $ upfront
  const [bill, setBill] = useState<string>('200'); // $ monthly
  const [utilityRate, setUtilityRate] = useState<string>('0.22'); // $ per kWh

  // Mapped physical variables
  const [coords, setCoords] = useState<{ lat: number; lon: number; name: string } | null>({
    lat: 32.7157, lon: -117.1611, name: 'San Diego, California'
  });
  const [irradiance, setIrradiance] = useState<number>(5.6); // kWh/m²/day (Standard California sun hours)
  const [isFetching, setIsFetching] = useState<boolean>(false);
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

  // Recalculate and redraw when inputs or fetched irradiance values change
  useEffect(() => {
    calculateROI();
  }, [coords, irradiance, systemSize, efficiency, cost, bill, utilityRate]);

  // Geocoding and API Surface Irradiance Fetcher
  const handleFetchSolarData = async () => {
    setErrorBox(null);
    setIsFetching(true);
    try {
      // 1. Geocode via OpenStreetMap Nominatim API
      const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
      const geoRes = await fetch(geoUrl, {
        headers: { 'User-Agent': 'STEM-Workshop-Solo-Project-Calibration-Engine' }
      });
      const geoData = await geoRes.json();

      if (!geoData || geoData.length === 0) {
        throw new Error("GEOLOCATION FAULT: Address query returned zero coordinate intersections.");
      }

      const loc = geoData[0];
      const lat = parseFloat(loc.lat);
      const lon = parseFloat(loc.lon);
      const name = loc.display_name;

      // 2. Fetch Irradiance from Open-Meteo Forecast API (shortwave radiation sum)
      // Standard annual daily avg can be estimated from Open-Meteo's historical or current surface radiation metrics
      const solarUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=shortwave_radiation_sum&timezone=auto&forecast_days=7`;
      const solarRes = await fetch(solarUrl);
      const solarData = await solarRes.json();

      if (!solarData || !solarData.daily || !solarData.daily.shortwave_radiation_sum) {
        throw new Error("API FAULT: Solar surface irradiance dataset unreachable.");
      }

      // Open-Meteo returns daily radiation in MJ/m².
      // Conversion: 1 MJ/m² = 0.2778 kWh/m² (equivalent peak sun hours!)
      const radiationMJ = solarData.daily.shortwave_radiation_sum;
      const sum = radiationMJ.reduce((s: number, v: number) => s + v, 0);
      const avgDailyMJ = sum / radiationMJ.length;
      const avgDailySunHours = avgDailyMJ * 0.2778;

      setCoords({ lat, lon, name });
      setIrradiance(parseFloat(avgDailySunHours.toFixed(2)));
      window.showAtelierToast("Solar irradiance retrieved successfully!", "success");
    } catch (e: any) {
      setErrorBox(`🚨 DATA ACQUISITION BLOCK:\n${e.message}\n(Falling back to historical default calibration values.)`);
    } finally {
      setIsFetching(false);
    }
  };

  // ROI math & Canvas monthly bar drawer
  const calculateROI = () => {
    const size = parseFloat(systemSize) || 0;
    const eff = (parseFloat(efficiency) || 20) / 100;
    const upCost = parseFloat(cost) || 0;
    const monthlyBill = parseFloat(bill) || 0;
    const rate = parseFloat(utilityRate) || 0.15;

    if (size <= 0 || upCost <= 0) {
      setLogOutput("Enter valid system size and upfront costs to begin ROI calculations.");
      return;
    }

    // PVWatts Equation: Energy (kWh) = Size (kW) * Irradiance (kWh/m²/day) * Efficiency * 365 * 0.85 (system derate)
    const annualGeneration = size * irradiance * 365 * 0.85 * (eff / 0.20); // normalized around 20% panel benchmark
    const monthlyAvgGeneration = annualGeneration / 12;

    // Monthly utility rate consumption estimation
    const monthlyConsumption = rate > 0 ? monthlyBill / rate : 0;
    const annualConsumption = monthlyConsumption * 12;

    const yearlySavings = Math.min(annualGeneration, annualConsumption) * rate;
    const paybackPeriod = yearlySavings > 0 ? upCost / yearlySavings : Infinity;
    const ROI25 = upCost > 0 ? (((yearlySavings * 25) - upCost) / upCost) * 100 : 0;
    
    // CO₂ Offset (average 0.4 kg / 0.85 lbs CO₂ offset per generated kWh)
    const co2OffsetKg = annualGeneration * 0.4;

    // Build printout report
    let log = `SOLAR PV APPARATUS DECARBONIZATION & ROI LEDGER:\n`;
    log += `------------------------------------------------------------\n`;
    if (coords) {
      log += `Location:   ${coords.name.substring(0, 48)}...\n`;
      log += `Coordinate: Latitude: ${coords.lat.toFixed(4)} | Longitude: ${coords.lon.toFixed(4)}\n`;
    }
    log += `Annual Irradiance (Avg Sun Hours): ${irradiance.toFixed(2)} kWh/m²/day\n`;
    log += `------------------------------------------------------------\n`;
    log += `PHYSICAL SYSTEM ESTIMATED METRICS:\n`;
    log += `  - Mapped Annual Energy Yield:   ${annualGeneration.toFixed(2)} kWh\n`;
    log += `  - Offset Carbon Dioxide (CO₂):  ${co2OffsetKg.toFixed(2)} kg/year\n`;
    log += `  - Household Annual Savings:     $${yearlySavings.toFixed(2)} / year\n\n`;
    log += `FINANCIAL CONVERGENCE & ANALYSIS:\n`;
    log += `  - Upfront Investment cost:     $${upCost.toFixed(2)}\n`;
    log += `  - Computed Payback Period:      ${paybackPeriod === Infinity ? 'Infinite' : paybackPeriod.toFixed(1)} years\n`;
    log += `  - Mapped 25-Year System ROI:    ${ROI25.toFixed(2)}%\n`;
    log += `------------------------------------------------------------\n`;
    log += `SYSTEM CODE: 1956-PV-CALIBRATOR`;

    setLogOutput(log);

    // Draw monthly comparison bar chart on canvas
    drawMonthlyBarChart(monthlyAvgGeneration, monthlyConsumption);
  };

  const drawMonthlyBarChart = (generation: number, consumption: number) => {
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
    const maxVal = Math.max(generation, consumption, 100) * 1.3;

    // Draw bottom baseline axis
    ctx.strokeStyle = '#1D3557';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad, canvas.height - pad);
    ctx.lineTo(canvas.width - pad, canvas.height - pad);
    ctx.stroke();

    // Months loops labels
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const barWidth = (canvas.width - 2 * pad) / months.length;

    months.forEach((m, idx) => {
      const bx = pad + idx * barWidth;
      
      // Add seasonal solar generation curve multiplier (e.g. peak in June/July)
      const seasonalFactor = 0.6 + 0.6 * Math.sin(((idx - 1) / 12) * Math.PI * 2);
      const mGen = generation * seasonalFactor;
      // standard slight consumption increase in summer A/C/winter heating
      const seasonalCons = 0.8 + 0.4 * Math.cos(((idx - 6) / 12) * Math.PI * 2);
      const mCons = consumption * seasonalCons;

      const genHeight = (mGen / maxVal) * (canvas.height - 2 * pad);
      const consHeight = (mCons / maxVal) * (canvas.height - 2 * pad);

      // Generation Bar (Red/Orange outline)
      ctx.fillStyle = '#FFFDF0';
      ctx.strokeStyle = '#E63946';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx + 4, canvas.height - pad - genHeight, barWidth / 2 - 6, genHeight, 1);
      ctx.fill();
      ctx.stroke();

      // Consumption Bar (Blue filled/striped)
      ctx.fillStyle = '#1D3557';
      ctx.strokeStyle = '#1D3557';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(bx + barWidth / 2 + 2, canvas.height - pad - consHeight, barWidth / 2 - 6, consHeight, 1);
      ctx.fill();
      ctx.stroke();

      // Month name
      ctx.fillStyle = '#1D3557';
      ctx.font = 'bold 9px "Cutive Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(m, bx + barWidth / 2, canvas.height - 18);
    });

    // Draw Legend indicators
    ctx.fillStyle = '#E63946';
    ctx.beginPath(); ctx.arc(canvas.width - 240, 20, 5, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#1D3557';
    ctx.font = 'bold 8px "Special Elite", monospace';
    ctx.textAlign = 'left';
    ctx.fillText("ESTIMATED GENERATION (kWh)", canvas.width - 230, 23);

    ctx.fillStyle = '#1D3557';
    ctx.beginPath(); ctx.arc(canvas.width - 120, 20, 5, 0, 2 * Math.PI); ctx.fill();
    ctx.fillText("ESTIMATED CONSUMPTION (kWh)", canvas.width - 110, 23);
  };

  return (
    <div ref={sectionRef} className="w-full py-4 space-y-6" id="solar-roi-calculator">
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Inputs form panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="scroll-reveal">
            <span className="geo-block-red text-[11px] font-bold tracking-widest inline-flex items-center gap-2">
              <Sun className="w-4 h-4 animate-pulse" />
              LABORATORY APPARATUS MODULE X
            </span>
            <h2 className="font-display text-xl sm:text-3xl text-[#1D3557] mt-3">SOLAR ROI ESTIMATOR</h2>
            <p className="font-body text-xs text-[#1D3557]/70 uppercase tracking-widest mt-1">Geocoded Irradiance PVWatts Payback model</p>
            <div className="line-separator max-w-sm mt-3" />
          </div>

          {/* Address API Geocoding Panel */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              🌍 APPARATUS GEOGRAPHIC REGISTER
            </span>
            <div className="space-y-3 font-body text-xs">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="City, State / ZIP code"
                  className="flex-1 input-vintage text-xs font-bold text-[#1D3557] bg-[#F5F1E8] border border-[#1D3557] py-2 px-3 outline-none"
                />
                <button
                  onClick={handleFetchSolarData}
                  disabled={isFetching || !address.trim()}
                  className="ticket-btn py-1.5 px-3.5 bg-[#1D3557] hover:bg-[#E63946] flex items-center justify-center disabled:opacity-50"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
              <span className="font-body text-[9px] text-[#1D3557]/50 block leading-normal">
                Fetches geographic coordinates and active solar irradiance values via Nominatim & Open-Meteo APIs.
              </span>
            </div>
          </div>

          {/* System physical settings */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              🔌 PHOTOVOLTAIC PANEL METRICS
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-body text-xs text-[#1D3557]">
              <div>
                <label className="font-bold block mb-1">SYSTEM SIZE (kW):</label>
                <input
                  type="number"
                  value={systemSize}
                  onChange={(e) => setSystemSize(e.target.value)}
                  className="w-full input-vintage text-xs font-bold bg-transparent border-b border-[#1D3557]"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">PANEL EFFICIENCY (%):</label>
                <input
                  type="number"
                  value={efficiency}
                  onChange={(e) => setEfficiency(e.target.value)}
                  className="w-full input-vintage text-xs font-bold bg-transparent border-b border-[#1D3557]"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">UPFRONT COST ($):</label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-full input-vintage text-xs font-bold bg-transparent border-b border-[#1D3557]"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">MONTHLY ELECTRIC BILL ($):</label>
                <input
                  type="number"
                  value={bill}
                  onChange={(e) => setBill(e.target.value)}
                  className="w-full input-vintage text-xs font-bold bg-transparent border-b border-[#1D3557]"
                />
              </div>

              <div className="col-span-2">
                <label className="font-bold block mb-1">UTILITY COST RATE ($ per kWh):</label>
                <input
                  type="number"
                  value={utilityRate}
                  step="0.01"
                  onChange={(e) => setUtilityRate(e.target.value)}
                  className="w-full input-vintage text-xs font-bold bg-transparent border-b border-[#1D3557]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right monthly bar chart plotting (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              📊 ESTIMATED MONTHLY YIELD VS UTILITY CONSUMPTION
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

            {/* Error box */}
            {errorBox && (
              <div className="error-ticket mt-4 font-bold text-xs leading-normal">
                {errorBox}
              </div>
            )}

            {/* ROI analytical printouts */}
            <div className="relative mt-4">
              <span className="absolute top-2 right-4 font-display text-[9px] text-[#C5A059] font-bold tracking-widest z-10">FINANCIAL SHEET OUT</span>
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

export default SolarROICalculator;
