import { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

interface MedicineSpec {
  name: string;
  defaultConc: number; // mg per mL
  defaultDose: number; // mg per kg
  maxDailyDose: number; // mg per kg per 24 hours
  absoluteMaxDaily: number; // mg absolute limit per 24 hours
  description: string;
}

const MEDICINES: { [key: string]: MedicineSpec } = {
  acetaminophen: {
    name: "Acetaminophen (Tylenol)",
    defaultConc: 32, // 160mg / 5mL = 32mg/mL
    defaultDose: 12.5, // 10-15 mg/kg standard (avg 12.5)
    maxDailyDose: 75, // max 75 mg/kg/day
    absoluteMaxDaily: 4000,
    description: "Analgesic and antipyretic. Safe interval: every 4 to 6 hours. DO NOT exceed 5 doses in 24 hours."
  },
  ibuprofen: {
    name: "Ibuprofen (Advil/Motrin)",
    defaultConc: 20, // 100mg / 5mL = 20mg/mL
    defaultDose: 10.0, // 10 mg/kg standard
    maxDailyDose: 40, // max 40 mg/kg/day
    absoluteMaxDaily: 1200,
    description: "NSAID for fever and pain. Safe interval: every 6 to 8 hours. DO NOT exceed 4 doses in 24 hours."
  }
};

const PediatricDoseHelper = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Dosing Inputs
  const [selectedMed, setSelectedMed] = useState<string>('acetaminophen');
  const [weight, setWeight] = useState<string>('22.0'); // lbs or kg
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');
  const [customConc, setCustomConc] = useState<string>('32'); // mg/mL
  const [customDose, setCustomDose] = useState<string>('12.5'); // mg/kg

  // Calculations states
  const [doseML, setDoseML] = useState<number>(0);
  const [doseMG, setDoseMG] = useState<number>(0);
  const [syringeTip, setSyringeTip] = useState<string>('');
  const [warningFlags, setWarningFlags] = useState<string[]>([]);
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

  // Recalculate dosage curve when inputs change
  useEffect(() => {
    calculateDosage();
  }, [selectedMed, weight, weightUnit, customConc, customDose]);

  const calculateDosage = () => {
    const wVal = parseFloat(weight) || 0;
    if (wVal <= 0) {
      setLogOutput("Waiting for patient weight parameters to calibrate dosage ledger.");
      return;
    }

    // 1. Convert weight to kg
    const kgWeight = weightUnit === 'lbs' ? wVal * 0.453592 : wVal;

    // 2. Select concentration and standard dose specs
    const isCustom = selectedMed === 'custom';
    const spec = isCustom ? null : MEDICINES[selectedMed];
    const conc = isCustom ? parseFloat(customConc) || 32 : spec!.defaultConc;
    const prescribedDose = isCustom ? parseFloat(customDose) || 10 : spec!.defaultDose;

    // 3. Math calculations
    const mgDose = kgWeight * prescribedDose;
    const mlDose = conc > 0 ? mgDose / conc : 0;

    setDoseMG(mgDose);
    setDoseML(mlDose);

    // 4. Clinical safety range warnings
    const flags: string[] = [];
    const maxDailyKg = isCustom ? 40 : spec!.maxDailyDose;
    const absMaxDaily = isCustom ? 1200 : spec!.absoluteMaxDaily;

    const singleMaxMg = kgWeight * (isCustom ? 15 : spec!.defaultDose * 1.5);
    const dailyMaxMg = Math.min(kgWeight * maxDailyKg, absMaxDaily);

    if (mgDose > singleMaxMg) {
      flags.push(`⚠️ WARNING: Prescribed dose of ${mgDose.toFixed(1)}mg exceeds typical single safety threshold (${singleMaxMg.toFixed(1)}mg).`);
    }

    if (mgDose * 4 > dailyMaxMg) {
      flags.push(`🛑 OVERDOSE RED-FLAG: Cumulative 24h intake (${(mgDose * 4).toFixed(1)}mg) threatens daily FDA safe limit (${dailyMaxMg.toFixed(1)}mg).`);
    }

    setWarningFlags(flags);

    // 5. Syringe recommendation
    if (mlDose <= 1) {
      setSyringeTip("1.0 mL Precision Graduated Oral Syringe (Standard tip)");
    } else if (mlDose <= 5) {
      setSyringeTip("5.0 mL Pediatric Measuring Syringe");
    } else {
      setSyringeTip("Standard Oral Dosing Calibrated Medicine Cup / Spoon");
    }

    // Build printout log
    let log = `CLINICAL MEDICATION DOSING LEDGER PRINTOUT:\n`;
    log += `------------------------------------------------------------\n`;
    log += `Patient Weight:       ${wVal.toFixed(1)} ${weightUnit} (SI Equivalent: ${kgWeight.toFixed(2)} kg)\n`;
    log += `Medication Model:     ${isCustom ? 'Custom parameters' : spec!.name}\n`;
    log += `Liquid Concentration: ${conc.toFixed(1)} mg/mL\n`;
    log += `Standard Dose Rate:   ${prescribedDose.toFixed(1)} mg/kg\n`;
    log += `------------------------------------------------------------\n`;
    log += `CALCULATED LIQUID QUANTITY:\n`;
    log += `  >> EXACT DOSE SIZE:   ${mlDose.toFixed(2)} mL  (SI: ${mgDose.toFixed(1)} mg)\n\n`;
    log += `DELIVERY MECHANISM RECOMMENDATION:\n`;
    log += `  - Suggested Tool:     ${mlDose <= 5 ? 'ORAL SYRINGE' : 'MEDICINE CUP'}\n`;
    log += `  - Tool Details:       ${syringeTip}\n`;
    log += `------------------------------------------------------------\n`;
    log += `SYSTEM CODE: 1956-DOSAGE-CALIBRATOR`;

    setLogOutput(log);
  };

  return (
    <div ref={sectionRef} className="w-full py-4 space-y-6" id="pediatric-dose-helper">
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Inputs form */}
        <div className="space-y-6">
          <div className="scroll-reveal">
            <span className="geo-block-red text-[11px] font-bold tracking-widest inline-flex items-center gap-2">
              <Shield className="w-4 h-4" />
              LABORATORY APPARATUS MODULE XI
            </span>
            <h2 className="font-display text-xl sm:text-3xl text-[#1D3557] mt-3">PEDIATRIC DOSING HELPER</h2>
            <p className="font-body text-xs text-[#1D3557]/70 uppercase tracking-widest mt-1">Weight-based mL conversions & FDA safety thresholds</p>
            <div className="line-separator max-w-sm mt-3" />
          </div>

          {/* Active Medication settings */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              🔬 SELECT MEDICATION SPEC
            </span>
            <div className="space-y-3 font-body text-xs text-[#1D3557]">
              <div>
                <label className="font-bold block mb-1">MEDICATION DRUG TYPE:</label>
                <select
                  value={selectedMed}
                  onChange={(e) => setSelectedMed(e.target.value)}
                  className="w-full font-body text-xs font-bold bg-[#F5F1E8] border border-[#1D3557] py-1.5 px-2"
                >
                  <option value="acetaminophen">Acetaminophen (Tylenol)</option>
                  <option value="ibuprofen">Ibuprofen (Advil/Motrin)</option>
                  <option value="custom">Custom Dosing Parameters</option>
                </select>
              </div>

              {selectedMed !== 'custom' && (
                <div className="bg-[#FFFDF0] p-3 border border-[#1D3557]/10 text-[#1D3557]/80 rounded-sm">
                  <span className="font-display text-[9px] text-[#C5A059] block mb-1 font-bold">DRUG INFO PROTOCOL:</span>
                  <p className="text-[10px] leading-relaxed">{MEDICINES[selectedMed].description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Weight and Concentrated Metrics */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              📐 PATIENT SPECS & CONCENTRATIONS
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-body text-xs text-[#1D3557]">
              <div>
                <label className="font-bold block mb-1">PATIENT WEIGHT:</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full input-vintage text-xs font-bold bg-transparent border-b border-[#1D3557] outline-none"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">WEIGHT UNIT:</label>
                <select
                  value={weightUnit}
                  onChange={(e: any) => setWeightUnit(e.target.value)}
                  className="w-full font-body text-xs font-bold bg-[#F5F1E8] border border-[#1D3557] py-1.5 px-2 mt-1"
                >
                  <option value="lbs">Pounds (lbs)</option>
                  <option value="kg">Kilograms (kg)</option>
                </select>
              </div>

              {selectedMed === 'custom' && (
                <>
                  <div>
                    <label className="font-bold block mb-1">CONCENTRATION (mg/mL):</label>
                    <input
                      type="number"
                      value={customConc}
                      onChange={(e) => setCustomConc(e.target.value)}
                      className="w-full input-vintage text-xs font-bold bg-transparent border-b border-[#1D3557]"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">DOSE LEVEL (mg/kg):</label>
                    <input
                      type="number"
                      value={customDose}
                      onChange={(e) => setCustomDose(e.target.value)}
                      className="w-full input-vintage text-xs font-bold bg-transparent border-b border-[#1D3557]"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Output ledger & graphics */}
        <div className="space-y-6">
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              💉 ESTIMATED MEDICATION DOSE GRAPHICS
            </span>

            {/* Glowing Dosing result badge */}
            <div className="border-4 double border-[#1D3557] p-6 text-center select-none bg-[#F5F1E8] mb-4">
              <span className="font-display text-4xl text-[#E63946] block mb-1 animate-pulse">
                {doseML.toFixed(2)} mL
              </span>
              <span className="font-display-alt text-[10px] text-[#1D3557] tracking-widest block font-bold">
                (Equivalent dry mass: {doseMG.toFixed(1)} mg)
              </span>
            </div>

            {/* Dynamic dose curve SVG */}
            <div className="bg-[#FFFDF0] p-3 border border-[#1D3557]/15 rounded-sm">
              <span className="font-display text-[9px] text-[#C5A059] block mb-2 font-bold uppercase tracking-wider">📈 PATIENT WEIGHT DOSAGE CURVE SCHEMATIC:</span>
              <svg className="w-full h-32 text-[#1D3557]" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="0.5">
                <line x1="5" y1="25" x2="95" y2="25" stroke="currentColor" />
                <line x1="5" y1="5" x2="5" y2="25" stroke="currentColor" />
                
                {/* Reference diagonal dosing curve */}
                <line x1="5" y1="25" x2="90" y2="8" stroke="#E63946" strokeWidth="1" strokeDasharray="1 1" />
                
                {/* Active dosage point indicator */}
                {parseFloat(weight) > 0 && (
                  <circle 
                    cx={Math.min(10 + (parseFloat(weight) / (weightUnit==='lbs' ? 60 : 30)) * 75, 90)} 
                    cy={Math.max(25 - (doseML / 15) * 15, 6)} 
                    r="2" 
                    fill="#E63946" 
                    className="animate-ping"
                  />
                )}
                
                {/* Labels */}
                <text x="9" y="29" fill="currentColor" fontSize="2" fontFamily="monospace">0</text>
                <text x="80" y="29" fill="currentColor" fontSize="2" fontFamily="monospace">Patient Wt ➔</text>
              </svg>
            </div>

            {/* Safety Alerts */}
            {warningFlags.length > 0 && (
              <div className="mt-4 space-y-2">
                {warningFlags.map((flag, idx) => (
                  <div key={idx} className="error-ticket p-3 bg-red-50 border-2 border-dashed border-red-300 text-red-700 font-body text-xs flex gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div className="font-bold leading-relaxed">{flag}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Printout ticket */}
            <div className="relative mt-4">
              <span className="absolute top-2 right-4 font-display text-[9px] text-[#C5A059] font-bold tracking-widest z-10">DOSAGE TICKET OUT</span>
              <pre className="w-full text-[10px] bg-[#F4ECD8] text-[#332211] font-body p-4 border-2 border-[#C5A059] rounded-sm max-h-[220px] overflow-x-auto shadow-inner leading-relaxed whitespace-pre-wrap">
                {logOutput}
              </pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PediatricDoseHelper;
