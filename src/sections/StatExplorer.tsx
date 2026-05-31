import { useState, useEffect, useRef } from 'react';
import { BarChart, Check, FileText, AlertTriangle } from 'lucide-react';

const StatExplorer = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const histCanvasRef = useRef<HTMLCanvasElement>(null);
  const regCanvasRef = useRef<HTMLCanvasElement>(null);

  const [inputMode, setInputMode] = useState<'single' | 'paired'>('single');
  const [rawData, setRawData] = useState<string>(() => {
    return localStorage.getItem('stem_stat_raw') || '12.5, 14.2, 13.8, 15.1, 14.9, 13.2, 14.5, 15.3, 14.0, 13.9, 14.7, 14.1, 13.6, 15.5, 14.3';
  });
  const [pairedData, setPairedData] = useState<string>(() => {
    return localStorage.getItem('stem_stat_paired') || '(1, 1.2), (2, 2.5), (3, 2.8), (4, 4.2), (5, 5.0), (6, 5.8), (7, 7.1)';
  });

  const [stats, setStats] = useState<any>(null);
  const [regression, setRegression] = useState<any>(null);

  const [logOutput, setLogOutput] = useState<string>('');
  const [errorBox, setErrorBox] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('stem_stat_raw', rawData);
  }, [rawData]);

  useEffect(() => {
    localStorage.setItem('stem_stat_paired', pairedData);
  }, [pairedData]);

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

  // Initial draw / Swap mode
  useEffect(() => {
    setErrorBox(null);
    setStats(null);
    setRegression(null);
    setLogOutput(
      `STATISTICAL LOG LEDGER ACTIVE.\nPASTE SEQUENCES ON THE LEFT BOARD AND CLICK "COMPUTE DATA" ACTION TICKETS.`
    );
    setTimeout(() => {
      drawPlaceholders();
    }, 100);
  }, [inputMode]);

  const drawPlaceholders = () => {
    const histCanvas = histCanvasRef.current;
    if (histCanvas) {
      const ctx = histCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, histCanvas.width, histCanvas.height);
        drawGridPattern(ctx, histCanvas.width, histCanvas.height);
        ctx.fillStyle = '#002868';
        ctx.font = 'italic 12px "Courier Prime", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('[ SINGLE VARIABLE HISTOGRAM / BOX-PLOT PRINTER ]', histCanvas.width / 2, histCanvas.height / 2);
      }
    }

    const regCanvas = regCanvasRef.current;
    if (regCanvas) {
      const ctx = regCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, regCanvas.width, regCanvas.height);
        drawGridPattern(ctx, regCanvas.width, regCanvas.height);
        ctx.fillStyle = '#002868';
        ctx.font = 'italic 12px "Courier Prime", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('[ PAIRED X-Y SCATTER / TRENDLINE PLOTTER ]', regCanvas.width / 2, regCanvas.height / 2);
      }
    }
  };

  const drawGridPattern = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = 'rgba(0, 40, 104, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 20; x < w; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 20; y < h; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  };

  const loadPreset = (type: 'normal' | 'skewed' | 'paired') => {
    setErrorBox(null);
    if (type === 'normal') {
      setInputMode('single');
      setRawData('12.5, 14.2, 13.8, 15.1, 14.9, 13.2, 14.5, 15.3, 14.0, 13.9, 14.7, 14.1, 13.6, 15.5, 14.3');
    } else if (type === 'skewed') {
      setInputMode('single');
      setRawData('1.2, 2.5, 1.8, 4.2, 8.5, 3.1, 1.9, 2.8, 12.1, 5.4, 2.2, 1.5, 3.6, 15.8, 1.1, 6.7');
    } else if (type === 'paired') {
      setInputMode('paired');
      setPairedData('(1, 1.2), (2, 2.5), (3, 2.8), (4, 4.2), (5, 5.0), (6, 5.8), (7, 7.1), (8, 8.5), (9, 9.2)');
    }
  };

  const executeAnalysis = () => {
    setErrorBox(null);
    setStats(null);
    setRegression(null);

    try {
      if (inputMode === 'single') {
        const parsed = rawData
          .split(/[\s,;\n]+/)
          .map(s => parseFloat(s.trim()))
          .filter(v => !isNaN(v) && isFinite(v));

        if (parsed.length < 2) {
          throw new Error('Statistical logs require at least two numerical readings.');
        }

        // Calculations
        parsed.sort((a, b) => a - b);
        const N = parsed.length;
        const sum = parsed.reduce((s, v) => s + v, 0);
        const mean = sum / N;

        // Median
        const median = N % 2 !== 0 ? parsed[(N - 1) / 2] : (parsed[N / 2 - 1] + parsed[N / 2]) / 2;

        // Mode
        const freqs: { [key: number]: number } = {};
        let maxFreq = 0;
        parsed.forEach(v => {
          freqs[v] = (freqs[v] || 0) + 1;
          if (freqs[v] > maxFreq) maxFreq = freqs[v];
        });

        const modes: number[] = [];
        Object.keys(freqs).forEach(k => {
          const num = parseFloat(k);
          if (freqs[num] === maxFreq) modes.push(num);
        });
        const modeStr = maxFreq > 1 ? modes.join(', ') : 'No Recurrent Mode';

        // Variance
        const varianceSum = parsed.reduce((s, v) => s + Math.pow(v - mean, 2), 0);
        const variance = varianceSum / (N - 1);
        const stdDev = Math.sqrt(variance);

        // Percentiles
        const getPercentile = (p: number) => {
          const pos = p * (N - 1);
          const base = Math.floor(pos);
          const diff = pos - base;
          if (base + 1 < N) {
            return parsed[base] + diff * (parsed[base + 1] - parsed[base]);
          }
          return parsed[base];
        };

        const Q1 = getPercentile(0.25);
        const Q3 = getPercentile(0.75);
        const IQR = Q3 - Q1;

        const lowerFence = Q1 - 1.5 * IQR;
        const upperFence = Q3 + 1.5 * IQR;
        const outliers = parsed.filter(v => v < lowerFence || v > upperFence);
        const outlierStr = outliers.length > 0 ? outliers.join(', ') : 'None Detected';

        const resultObj = { N, mean, median, modeStr, variance, stdDev, Q1, Q3, IQR, outlierStr, lowerFence, upperFence, min: parsed[0], max: parsed[N - 1] };
        setStats(resultObj);

        // Print log
        let log = `STATISTICAL LEDGER PRINTER -- READINGS ANALYZER: SINGLE VARIABLE\n`;
        log += `------------------------------------------------------------\n`;
        log += `Total Readings Count N = ${N}\n`;
        log += `Range: Min = ${parsed[0].toFixed(2)} | Max = ${parsed[N - 1].toFixed(2)}\n\n`;
        log += `STATISTICAL INDICATORS TABLE:\n`;
        log += `  - Arithmetic Mean (μ):    ${mean.toFixed(6)}\n`;
        log += `  - Median (50th Perc):     ${median.toFixed(6)}\n`;
        log += `  - Mode (Recurrent):       ${modeStr}\n`;
        log += `  - Sample Variance (s²):   ${variance.toFixed(6)}\n`;
        log += `  - Std Deviation (s):      ${stdDev.toFixed(6)}\n`;
        log += `  - Interquartile (IQR):    ${IQR.toFixed(6)} [Q1: ${Q1.toFixed(4)}, Q3: ${Q3.toFixed(4)}]\n`;
        log += `  - Tukey Fence Outliers:   ${outlierStr}\n`;

        setLogOutput(log);
        drawSinglePlots(parsed, resultObj);
      } 
      else {
        // Paired regression mode
        // Match format like (1, 1.2) or 1 1.2
        const matches = pairedData.match(/\(?\s*(-?\d+\.?\d*)\s*[\s,;:\t]+\s*(-?\d+\.?\d*)\s*\)?/g);
        if (!matches || matches.length < 2) {
          throw new Error('Linear regression requires at least two paired coordinate points, e.g. (x,y).');
        }

        const pts = matches.map(str => {
          const vals = str.replace(/[()]/g, '').split(/[\s,;:\t]+/).map(s => parseFloat(s.trim()));
          return { x: vals[0], y: vals[1] };
        });

        const N = pts.length;
        const sumX = pts.reduce((sum, p) => sum + p.x, 0);
        const sumY = pts.reduce((sum, p) => sum + p.y, 0);
        const meanX = sumX / N;
        const meanY = sumY / N;

        let num = 0;
        let den = 0;
        let sumX2 = 0;
        let sumY2 = 0;
        let sumXY = 0;

        pts.forEach(p => {
          num += (p.x - meanX) * (p.y - meanY);
          den += Math.pow(p.x - meanX, 2);
          sumX2 += Math.pow(p.x - meanX, 2);
          sumY2 += Math.pow(p.y - meanY, 2);
          sumXY += (p.x - meanX) * (p.y - meanY);
        });

        if (den === 0) {
          throw new Error('REGRESSION FAILURE: Denominator is zero. All X values are identical.');
        }

        const slope = num / den;
        const intercept = meanY - slope * meanX;

        // Pearson Correlation Coefficient r
        const r = sumXY / Math.sqrt(sumX2 * sumY2);
        const r2 = r * r;

        const regObj = { N, slope, intercept, r, r2, meanX, meanY, pts };
        setRegression(regObj);

        // Print log
        let log = `STATISTICAL LEDGER PRINTER -- LINEAR REGRESSION ANALYZER\n`;
        log += `------------------------------------------------------------\n`;
        log += `Total Paired Points N = ${N}\n\n`;
        log += `COMPUTED REGRESSION COEFFICIENTS (y = mx + c):\n`;
        log += `  - Slope (m):              ${slope.toFixed(6)}\n`;
        log += `  - Intercept (c):          ${intercept.toFixed(6)}\n`;
        log += `  - Equation:               y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}\n\n`;
        log += `CORRELATION ESTIMATIONS:\n`;
        log += `  - Pearson Coefficient r:  ${r.toFixed(6)}  (${Math.abs(r) > 0.8 ? 'STRONG CORRELATION' : (Math.abs(r) > 0.5 ? 'MODERATE' : 'WEAK')})\n`;
        log += `  - Coeff of Determ R²:     ${r2.toFixed(6)}\n`;

        setLogOutput(log);
        drawRegressionPlot(regObj);
      }
    } catch (e: any) {
      setErrorBox(`🚨 ANALYSIS FAULT:\n${e.message}`);
      setLogOutput('LEDGER READING ABORTED DUE TO DATA QUALITY ISSUES.');
    }
  };

  // Dual Single Plot Drawing: Sturges Histogram + Box Plot below it aligned to same X scale
  const drawSinglePlots = (data: number[], statsObj: any) => {
    const canvas = histCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGridPattern(ctx, canvas.width, canvas.height);

    // Dynamic bins Sturges
    const k = Math.ceil(Math.log2(data.length) + 1);
    const min = statsObj.min;
    const max = statsObj.max;
    const range = max - min;
    const binWidth = range === 0 ? 1 : range / k;

    const bins = Array.from({ length: k }, (_, idx) => ({
      minVal: min + idx * binWidth,
      maxVal: min + (idx + 1) * binWidth,
      count: 0
    }));

    data.forEach(v => {
      for (let i = 0; i < k; i++) {
        if (v >= bins[i].minVal && (v < bins[i].maxVal || (i === k - 1 && v <= bins[i].maxVal))) {
          bins[i].count++;
          break;
        }
      }
    });

    const maxCount = Math.max(...bins.map(b => b.count));

    // Pad space
    const pad = 40;
    const plotW = canvas.width - 2 * pad;
    const histH = canvas.height * 0.6 - pad; // 60% height for histogram
    const boxY = canvas.height * 0.78; // Y center of Box-Plot

    // Map X coordinate to fit bounds
    const toPxX = (v: number) => pad + ((v - min) / (range || 1)) * plotW;

    // Draw Histogram Columns
    const colW = plotW / k;
    ctx.fillStyle = 'rgba(0, 40, 104, 0.12)';
    ctx.strokeStyle = 'var(--color-navy)';
    ctx.lineWidth = 1.8;

    for (let i = 0; i < k; i++) {
      const b = bins[i];
      if (b.count === 0) continue;

      const pxL = pad + i * colW;
      const hPx = (b.count / (maxCount || 1)) * histH;
      const pyTop = canvas.height * 0.6 - hPx;

      ctx.fillRect(pxL + 3, pyTop, colW - 6, hPx);
      ctx.strokeRect(pxL + 3, pyTop, colW - 6, hPx);

      // Label counts
      ctx.fillStyle = 'var(--color-navy)';
      ctx.font = 'bold 9px "Special Elite", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(b.count.toString(), pxL + colW / 2, pyTop - 5);
    }

    // Baseline axis for histogram
    ctx.beginPath();
    ctx.moveTo(pad, canvas.height * 0.6);
    ctx.lineTo(canvas.width - pad, canvas.height * 0.6);
    ctx.stroke();

    // 2. Draw Box and Whisker Plot below aligned
    const q1Px = toPxX(statsObj.Q1);
    const q3Px = toPxX(statsObj.Q3);
    const medPx = toPxX(statsObj.median);
    const minPx = toPxX(Math.max(statsObj.min, statsObj.lowerFence));
    const maxPx = toPxX(Math.min(statsObj.max, statsObj.upperFence));

    ctx.strokeStyle = 'var(--color-navy)';
    ctx.lineWidth = 2;

    // Whiskers horizontal lines
    ctx.beginPath();
    ctx.moveTo(minPx, boxY);
    ctx.lineTo(q1Px, boxY);
    ctx.moveTo(q3Px, boxY);
    ctx.lineTo(maxPx, boxY);
    ctx.stroke();

    // Whisker vertical caps
    ctx.beginPath();
    ctx.moveTo(minPx, boxY - 8); ctx.lineTo(minPx, boxY + 8);
    ctx.moveTo(maxPx, boxY - 8); ctx.lineTo(maxPx, boxY + 8);
    ctx.stroke();

    // Inner Box Fill
    ctx.fillStyle = 'rgba(230, 57, 70, 0.08)';
    ctx.fillRect(q1Px, boxY - 14, q3Px - q1Px, 28);
    ctx.strokeRect(q1Px, boxY - 14, q3Px - q1Px, 28);

    // Median vertical line
    ctx.strokeStyle = 'var(--color-red)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(medPx, boxY - 14);
    ctx.lineTo(medPx, boxY + 14);
    ctx.stroke();

    // Outliers markers
    ctx.fillStyle = 'var(--color-red)';
    data.forEach(v => {
      if (v < statsObj.lowerFence || v > statsObj.upperFence) {
        const px = toPxX(v);
        ctx.beginPath();
        ctx.arc(px, boxY, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }
    });

    // Label coordinates
    ctx.fillStyle = 'var(--color-charcoal)';
    ctx.font = 'bold 9px "Courier Prime", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(min.toFixed(1), pad, canvas.height - 10);
    ctx.fillText(max.toFixed(1), canvas.width - pad, canvas.height - 10);
    ctx.fillText(`μ: ${statsObj.mean.toFixed(2)}`, toPxX(statsObj.mean), canvas.height - 10);
  };

  // Draw paired regression scatter plot
  const drawRegressionPlot = (regObj: any) => {
    const canvas = regCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGridPattern(ctx, canvas.width, canvas.height);

    const pts: { x: number; y: number }[] = regObj.pts;
    const xVals = pts.map(p => p.x);
    const yVals = pts.map(p => p.y);

    const xMin = Math.min(...xVals);
    const xMax = Math.max(...xVals);
    const yMin = Math.min(...yVals);
    const yMax = Math.max(...yVals);

    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    const pad = 40;
    const plotW = canvas.width - 2 * pad;
    const plotH = canvas.height - 2 * pad;

    const toPxX = (x: number) => pad + ((x - xMin) / xRange) * plotW;
    const toPxY = (y: number) => canvas.height - pad - ((y - yMin) / yRange) * plotH;

    // Draw coordinate axis boundaries
    ctx.strokeStyle = 'var(--color-navy)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad, canvas.height - pad);
    ctx.lineTo(canvas.width - pad, canvas.height - pad);
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, canvas.height - pad);
    ctx.stroke();

    // Plot Scatter Dots
    ctx.fillStyle = 'var(--color-red)';
    ctx.strokeStyle = 'var(--color-navy)';
    ctx.lineWidth = 1.5;

    pts.forEach(p => {
      const px = toPxX(p.x);
      const py = toPxY(p.y);
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });

    // Draw Regression Line (Fitted line)
    ctx.strokeStyle = 'var(--color-navy)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(toPxX(xMin), toPxY(regObj.slope * xMin + regObj.intercept));
    ctx.lineTo(toPxX(xMax), toPxY(regObj.slope * xMax + regObj.intercept));
    ctx.stroke();

    // Labels
    ctx.fillStyle = 'var(--color-charcoal)';
    ctx.font = 'bold 9px "Courier Prime", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`X_min: ${xMin.toFixed(1)}`, pad, canvas.height - 10);
    ctx.fillText(`X_max: ${xMax.toFixed(1)}`, canvas.width - pad, canvas.height - 10);
    ctx.textAlign = 'left';
    ctx.fillText(`Y_min: ${yMin.toFixed(1)}`, 5, canvas.height - pad);
    ctx.fillText(`Y_max: ${yMax.toFixed(1)}`, 5, pad + 10);
  };

  const wipeLabRecord = () => {
    setRawData('');
    setPairedData('');
    setStats(null);
    setRegression(null);
    setErrorBox(null);
    setLogOutput('STATISTICAL WORKBENCH DEPLOY WIPE.');
    drawPlaceholders();
  };

  return (
    <div 
      ref={sectionRef}
      className="w-full py-4 space-y-6"
      id="stats-explorer"
    >
      <div className="relative">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Data Sequence Inputs & Metrics */}
          <div className="space-y-8">
            <div className="scroll-reveal">
              <span className="geo-block-red text-sm tracking-widest inline-flex items-center gap-2">
                <BarChart className="w-4 h-4" />
                LABORATORY APPARATUS MODULE V
              </span>
            </div>

            <div className="scroll-reveal" style={{ transitionDelay: '0.1s' }}>
              <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl text-[#1D3557] leading-tight mb-2">
                STATISTICAL DATA EXPLORER
              </h2>
              <p className="font-body text-md text-[#1D3557]/70 italic uppercase tracking-wider">
                FREQUENCY DISTRIBUTION & LINEAR TREND ANALYZER
              </p>
              <div className="line-separator max-w-sm mt-4" />
            </div>

            <div className="scroll-reveal vintage-menu-card p-3 sm:p-6" style={{ transitionDelay: '0.2s' }}>
              
              <div className="border-b-2 dashed border-[#1D3557]/20 pb-4 mb-6">
                <span className="font-display text-lg text-[#1D3557] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#E63946]" />
                  SEQUENCE PARAMETERS DATA SHEET
                </span>
              </div>

              {/* Mode Selection */}
              <div className="flex gap-4 mb-6 bg-[#F5F1E8] p-2 border border-[#1D3557]/20">
                <button
                  onClick={() => setInputMode('single')}
                  className={`flex-1 font-display text-xs py-2 font-bold transition-all text-center ${
                    inputMode === 'single' ? 'bg-[#1D3557] text-[#F5F1E8]' : 'text-[#1D3557]/65 hover:text-[#1D3557]'
                  }`}
                >
                  SINGLE VARIABLE LEDGER
                </button>
                <button
                  onClick={() => setInputMode('paired')}
                  className={`flex-1 font-display text-xs py-2 font-bold transition-all text-center ${
                    inputMode === 'paired' ? 'bg-[#1D3557] text-[#F5F1E8]' : 'text-[#1D3557]/65 hover:text-[#1D3557]'
                  }`}
                >
                  PAIRED SCATTER REGRESSION
                </button>
              </div>

              {/* Labeled sequence text paste area */}
              <div className="mb-6">
                {inputMode === 'single' ? (
                  <div>
                    <label className="font-body text-xs font-bold text-[#1D3557] block mb-2">PASTE SINGLE VALUE LOG SEQUENCE:</label>
                    <textarea
                      value={rawData}
                      onChange={(e) => setRawData(e.target.value)}
                      placeholder="e.g., 12, 15, 18, 22, 19, 14, 15, 17..."
                      className="w-full h-24 p-2 bg-[#F5F1E8] text-xs border-2 border-[#1D3557] font-body outline-none leading-relaxed"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="font-body text-xs font-bold text-[#1D3557] block mb-2">PASTE PAIRED X-Y SCATTER POINTS:</label>
                    <textarea
                      value={pairedData}
                      onChange={(e) => setPairedData(e.target.value)}
                      placeholder="e.g., (1, 1.2), (2, 2.5), (3, 2.8), (4, 4.2)..."
                      className="w-full h-24 p-2 bg-[#F5F1E8] text-xs border-2 border-[#1D3557] font-body outline-none leading-relaxed"
                    />
                  </div>
                )}
                <span className="font-body text-[10px] text-[#1D3557]/60 block mt-2">
                  Supports spaces, commas, or newline delimiters. Out-of-bounds readings are filtered.
                </span>
              </div>

              {/* Presets */}
              <div className="mb-6">
                <label className="font-body text-xs font-bold text-[#1D3557] block mb-1.5">ATELIER METADATA PRESETS:</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => loadPreset('normal')} className="ticket-btn text-[10px] py-1 px-3 bg-[#1D3557] text-white">Standard Cage Readings</button>
                  <button onClick={() => loadPreset('skewed')} className="ticket-btn text-[10px] py-1 px-3 bg-[#1D3557] text-white">Exponential Skew</button>
                  <button onClick={() => loadPreset('paired')} className="ticket-btn text-[10px] py-1 px-3 bg-[#E63946] text-white">Paired Gage Trend</button>
                </div>
              </div>

              {/* Action tickets */}
              <div className="flex flex-wrap gap-3 border-t border-dashed border-[#1D3557]/10 pt-4">
                <button 
                  onClick={executeAnalysis}
                  className="ticket-btn flex-1 min-w-[200px] bg-[#E63946] text-white hover:bg-[#1D3557] font-bold text-xs py-2.5 px-4 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  COMPUTE GAGE DATA
                </button>
                <button 
                  onClick={wipeLabRecord}
                  className="ticket-btn flex-1 sm:flex-initial bg-[#1D3557] text-white hover:bg-red-800 font-bold text-xs py-2.5 px-4 text-center"
                >
                  SHRED LEDGER
                </button>
              </div>

              {/* Error Box */}
              {errorBox && (
                <div className="error-ticket mt-4 bg-red-50 border border-red-300 text-red-700 p-3 font-body text-xs flex gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <div className="font-bold leading-relaxed">{errorBox}</div>
                </div>
              )}

              {/* Single Stats computed table */}
              {stats && inputMode === 'single' && (
                <div className="mt-6 pt-4 border-t border-dashed border-[#1D3557]/10 animate-fadeIn">
                  <span className="font-display text-md text-[#E63946] block mb-3">V. DETAILED ATELIER SUMMARY LEDGER</span>
                  <div className="w-full overflow-x-auto select-text">
                    <table className="ledger-table min-w-[340px] m-0">
                      <thead>
                        <tr>
                          <th>Statistical Gage Indicator</th>
                          <th>Atelier Computed Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td><strong>Total Counts (N)</strong></td><td>{stats.N}</td></tr>
                        <tr><td><strong>Arithmetic Mean (μ)</strong></td><td>{stats.mean.toFixed(4)}</td></tr>
                        <tr><td><strong>Apparatus Median</strong></td><td>{stats.median.toFixed(4)}</td></tr>
                        <tr><td><strong>Recurrent Mode</strong></td><td>{stats.modeStr}</td></tr>
                        <tr><td><strong>Sample Variance (s²)</strong></td><td>{stats.variance.toFixed(4)}</td></tr>
                        <tr><td><strong>Standard Deviation (s)</strong></td><td>{stats.stdDev.toFixed(4)}</td></tr>
                        <tr><td><strong>Lower Quartile (Q1)</strong></td><td>{stats.Q1.toFixed(4)}</td></tr>
                        <tr><td><strong>Upper Quartile (Q3)</strong></td><td>{stats.Q3.toFixed(4)}</td></tr>
                        <tr><td><strong>Interquartile Range (IQR)</strong></td><td>{stats.IQR.toFixed(4)}</td></tr>
                        <tr><td className="text-red-700"><strong>Tukey Fences Outliers</strong></td><td className="text-red-700 font-bold">{stats.outlierStr}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Paired Stats computed table */}
              {regression && inputMode === 'paired' && (
                <div className="mt-6 pt-4 border-t border-dashed border-[#1D3557]/10 animate-fadeIn">
                  <span className="font-display text-md text-[#E63946] block mb-3">V. LINEAR TREND SPECIFICATION SHEET</span>
                  <div className="w-full overflow-x-auto select-text">
                    <table className="ledger-table min-w-[340px] m-0">
                      <thead>
                        <tr>
                          <th>Trendline Variable Parameter</th>
                          <th>Atelier Mapped Coefficient</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td><strong>Gage Counts (N)</strong></td><td>{regression.N}</td></tr>
                        <tr><td><strong>Trendline Formula</strong></td><td><strong>y = {regression.slope.toFixed(4)}x + {regression.intercept.toFixed(4)}</strong></td></tr>
                        <tr><td><strong>Line Slope (m)</strong></td><td>{regression.slope.toFixed(6)}</td></tr>
                        <tr><td><strong>Y-Intercept (c)</strong></td><td>{regression.intercept.toFixed(6)}</td></tr>
                        <tr><td><strong>Pearson Correlation Coefficient (r)</strong></td><td>{regression.r.toFixed(6)}</td></tr>
                        <tr><td><strong>Coefficient of Determination (R²)</strong></td><td>{regression.r2.toFixed(6)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Right Column: Visualization Plots */}
          <div className="space-y-6 w-full">
            <div className="scroll-reveal vintage-menu-card p-3 sm:p-6" style={{ transitionDelay: '0.3s' }}>
              
              <div className="border-b-2 dashed border-[#1D3557]/20 pb-4 mb-4">
                <span className="font-display text-lg text-[#1D3557] flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-[#E63946]" />
                  DATA EXPLORER GRAPH BLUEPRINT
                </span>
              </div>

              {/* Canvas visualizer */}
              {inputMode === 'single' ? (
                <div className="bg-[#F4ECD8] border-2 border-[#C5A059] p-2 sm:p-3 shadow-inner rounded-sm overflow-x-auto w-full">
                  <canvas 
                    ref={histCanvasRef} 
                    width="420" 
                    height="240" 
                    className="block bg-[#F4ECD8] border border-[#C5A059]/40 w-full min-h-[200px] sm:min-h-[280px]"
                  />
                </div>
              ) : (
                <div className="bg-[#F4ECD8] border-2 border-[#C5A059] p-2 sm:p-3 shadow-inner rounded-sm overflow-x-auto w-full animate-fadeIn">
                  <canvas 
                    ref={regCanvasRef} 
                    width="420" 
                    height="240" 
                    className="block bg-[#F4ECD8] border border-[#C5A059]/40 w-full min-h-[200px] sm:min-h-[280px]"
                  />
                </div>
              )}

              {/* Separator log paper */}
              <div className="relative mt-3 sm:mt-4">
                <span className="absolute top-2 right-3 sm:right-4 font-display text-[9px] text-[#C5A059] font-bold tracking-widest z-10">ANALYSIS PRINT</span>
                <pre className="w-full text-xs sm:text-sm bg-[#F4ECD8] text-[#332211] font-body p-3 sm:p-5 border-2 border-[#C5A059] rounded-sm max-h-[180px] sm:max-h-[220px] overflow-y-auto shadow-inner leading-relaxed whitespace-pre-wrap">
                  {logOutput || 'STATISTICAL PRINTER SYSTEM ACTIVE. ENTER CODES TO COMPUTE.'}
                </pre>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StatExplorer;
