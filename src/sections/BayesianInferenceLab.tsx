import { useState, useEffect, useRef } from 'react';
import { Settings } from 'lucide-react';

interface DistributionPoint {
  x: number;
  prior: number;
  likelihood: number;
  posterior: number;
}

const BayesianInferenceLab = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Bayesian specifications
  const [priorType, setPriorType] = useState<'beta' | 'gaussian'>('beta');
  const [likelihoodModel, setLikelihoodModel] = useState<'binomial' | 'normal' | 'poisson'>('binomial');

  // Beta Prior parameters sliders
  const [alpha, setAlpha] = useState<number>(3.0); // prior successes
  const [beta, setBeta] = useState<number>(3.0);  // prior failures

  // Gaussian Prior parameters sliders
  const [mu0, setMu0] = useState<number>(50.0);    // prior mean
  const [sigma0, setSigma0] = useState<number>(10.0); // prior SD

  // Binomial Likelihood observed data inputs
  const [obsSuccesses, setObsSuccesses] = useState<number>(12); // k
  const [obsTrials, setObsTrials] = useState<number>(20);     // n

  // Normal Likelihood observed data inputs
  const [obsCount, setObsCount] = useState<number>(10);       // N samples
  const [obsMean, setObsMean] = useState<number>(62.0);       // sample mean
  const [knownSigma, setKnownSigma] = useState<number>(12.0); // population SD

  // Poisson Likelihood observed data inputs
  const [poissonObs, setPoissonObs] = useState<number>(8); // observed count
  const [poissonExposure, setPoissonExposure] = useState<number>(1); // time exposure

  // Analytical calculations outcome states
  const [points, setPoints] = useState<DistributionPoint[]>([]);
  const [priorStats, setPriorStats] = useState<string>('');
  const [likelihoodStats, setLikelihoodStats] = useState<string>('');
  const [posteriorStats, setPosteriorStats] = useState<string>('');
  const [hdiBounds, setHdiBounds] = useState<{ lower: number; upper: number } | null>(null);
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

  // Recalculate and plot when parameters change
  useEffect(() => {
    calculateBayesianPosteriors();
  }, [
    priorType, likelihoodModel,
    alpha, beta,
    mu0, sigma0,
    obsSuccesses, obsTrials,
    obsCount, obsMean, knownSigma,
    poissonObs, poissonExposure
  ]);

  // Probability density helper functions
  const betaPDF = (x: number, a: number, b: number): number => {
    if (x <= 0 || x >= 1) return 0;
    // Gamma function log approximation for Beta normalizing constant
    // Beta(a, b) = Gamma(a)*Gamma(b) / Gamma(a+b)
    const logBetaConst = lnGamma(a) + lnGamma(b) - lnGamma(a + b);
    return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - logBetaConst);
  };

  const gaussianPDF = (x: number, mean: number, sd: number): number => {
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(sd, 2));
    const denom = sd * Math.sqrt(2 * Math.PI);
    return Math.exp(exponent) / denom;
  };

  const binomialLikelihood = (theta: number, k: number, n: number): number => {
    if (theta <= 0 || theta >= 1) return 0;
    // P(k|theta) = (n choose k) * theta^k * (1-theta)^(n-k)
    // We scale likelihood to be in same visual dimensions by ignoring combination coefficient
    return Math.exp(k * Math.log(theta) + (n - k) * Math.log(1 - theta));
  };

  const normalLikelihood = (theta: number, mean: number, N: number, sd: number): number => {
    // Likelihood of parameter mean 'theta' given N samples with average 'mean'
    const exponent = -N * Math.pow(mean - theta, 2) / (2 * Math.pow(sd, 2));
    return Math.exp(exponent);
  };

  const poissonLikelihood = (theta: number, k: number, exposure: number): number => {
    if (theta <= 0) return 0;
    // P(k|theta) = (exposure*theta)^k * e^(-exposure*theta) / k!
    // We ignore denominator factorial for relative scaling
    return Math.exp(k * Math.log(exposure * theta) - exposure * theta);
  };

  // Lanczos log-gamma approximation
  const lnGamma = (z: number): number => {
    const g = 7;
    const C = [
      0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
    ];
    if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - lnGamma(1 - z);
    z -= 1;
    let x = C[0];
    for (let i = 1; i < g + 2; i++) x += C[i] / (z + i);
    const t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  };

  // Main calculations step
  const calculateBayesianPosteriors = () => {
    const isProbabilityScale = priorType === 'beta' || likelihoodModel === 'binomial';
    
    // 1. Establish Grid parameter range
    const gridPoints = 200;
    const minParam = isProbabilityScale ? 0.001 : 0.0;
    const maxParam = isProbabilityScale ? 0.999 : 100.0;
    const step = (maxParam - minParam) / (gridPoints - 1);

    const tempPoints: DistributionPoint[] = [];
    
    let sumPrior = 0;
    let sumLikelihood = 0;
    let sumPosterior = 0;

    // 2. Evaluate prior and likelihood on grid points
    for (let i = 0; i < gridPoints; i++) {
      const x = minParam + i * step;
      
      // Calculate Prior PDF
      let priorVal = 0;
      if (priorType === 'beta') {
        priorVal = betaPDF(x, alpha, beta);
      } else {
        priorVal = gaussianPDF(x, mu0, sigma0);
      }

      // Calculate Likelihood
      let likeVal = 0;
      if (likelihoodModel === 'binomial') {
        likeVal = binomialLikelihood(x, obsSuccesses, obsTrials);
      } else if (likelihoodModel === 'normal') {
        likeVal = normalLikelihood(x, obsMean, obsCount, knownSigma);
      } else {
        likeVal = poissonLikelihood(x, poissonObs, poissonExposure);
      }

      const postVal = priorVal * likeVal;

      sumPrior += priorVal;
      sumLikelihood += likeVal;
      sumPosterior += postVal;

      tempPoints.push({
        x,
        prior: priorVal,
        likelihood: likeVal,
        posterior: postVal
      });
    }

    // 3. Normalize distributions so that area under curve equals 1 (or sum of points scaled)
    const normPoints = tempPoints.map(p => {
      const prior = sumPrior > 0 ? p.prior / (sumPrior * step) : 0;
      const likelihood = sumLikelihood > 0 ? p.likelihood / (sumLikelihood * step) : 0;
      const posterior = sumPosterior > 0 ? p.posterior / (sumPosterior * step) : 0;
      return { x: p.x, prior, likelihood, posterior };
    });

    setPoints(normPoints);

    // 4. Calculate stats (mean, mode, credible intervals)
    let pMean = 0;
    let postMaxDensity = 0;
    let postMode = 0;
    let postVar = 0;

    normPoints.forEach(p => {
      pMean += p.x * p.posterior * step;
      if (p.posterior > postMaxDensity) {
        postMaxDensity = p.posterior;
        postMode = p.x;
      }
    });

    normPoints.forEach(p => {
      postVar += Math.pow(p.x - pMean, 2) * p.posterior * step;
    });
    const postSD = Math.sqrt(postVar);

    // 5. Compute 95% Credible Interval (Highest Density Interval - HDI bounds)
    // Sort grid elements by posterior density to find cumulative 95% cutoff
    const sortedPoints = [...normPoints].sort((a, b) => b.posterior - a.posterior);
    let cumulativeProb = 0;
    const hdiThreshold = 0.95;
    let hdiDensityCutoff = 0;

    for (let i = 0; i < sortedPoints.length; i++) {
      cumulativeProb += sortedPoints[i].posterior * step;
      if (cumulativeProb >= hdiThreshold) {
        hdiDensityCutoff = sortedPoints[i].posterior;
        break;
      }
    }

    // HDI interval consists of all grid coordinates where density exceeds cutoff
    const hdiCoordinates = normPoints.filter(p => p.posterior >= hdiDensityCutoff);
    let hdiLower = minParam;
    let hdiUpper = maxParam;
    if (hdiCoordinates.length > 0) {
      hdiLower = Math.min(...hdiCoordinates.map(p => p.x));
      hdiUpper = Math.max(...hdiCoordinates.map(p => p.x));
    }
    setHdiBounds({ lower: hdiLower, upper: hdiUpper });

    // Print text reports
    let priorMean = 0;
    let priorVar = 0;
    if (priorType === 'beta') {
      priorMean = alpha / (alpha + beta);
      priorVar = (alpha * beta) / (Math.pow(alpha + beta, 2) * (alpha + beta + 1));
    } else {
      priorMean = mu0;
      priorVar = Math.pow(sigma0, 2);
    }
    const priorSD = Math.sqrt(priorVar);

    let sampleSize = 0;
    let sampleEstimate = 0;
    if (likelihoodModel === 'binomial') {
      sampleSize = obsTrials;
      sampleEstimate = obsTrials > 0 ? obsSuccesses / obsTrials : 0;
    } else if (likelihoodModel === 'normal') {
      sampleSize = obsCount;
      sampleEstimate = obsMean;
    } else {
      sampleSize = poissonExposure;
      sampleEstimate = poissonExposure > 0 ? poissonObs / poissonExposure : 0;
    }

    // Update state text blocks
    setPriorStats(`Mean: ${priorMean.toFixed(3)} | SD: ${priorSD.toFixed(3)}`);
    setLikelihoodStats(`N Samples: ${sampleSize.toFixed(0)} | MLE: ${sampleEstimate.toFixed(3)}`);
    setPosteriorStats(`Mean: ${pMean.toFixed(3)} | Mode: ${postMode.toFixed(3)} | SD: ${postSD.toFixed(3)}`);

    // Build central log report
    let log = `INTERACTIVE BAYESIAN INFERENCE CALIBRATION LEDGER:\n`;
    log += `------------------------------------------------------------\n`;
    log += `PRIOR SPECIFICATION:  ${priorType.toUpperCase()} DISTRIBUTION\n`;
    if (priorType === 'beta') {
      log += `  - Hyperparameters:  Alpha (α) = ${alpha.toFixed(1)} | Beta (β) = ${beta.toFixed(1)}\n`;
    } else {
      log += `  - Hyperparameters:  Mean (μ₀) = ${mu0.toFixed(1)} | SD (σ₀) = ${sigma0.toFixed(1)}\n`;
    }
    log += `  - Prior Standard Dev: ${priorSD.toFixed(4)}\n`;
    log += `------------------------------------------------------------\n`;
    log += `OBSERVED DATA LIKELIHOOD MODEL: ${likelihoodModel.toUpperCase()}\n`;
    if (likelihoodModel === 'binomial') {
      log += `  - Data Coordinates: Successes (k) = ${obsSuccesses} | Trials (n) = ${obsTrials}\n`;
    } else if (likelihoodModel === 'normal') {
      log += `  - Data Coordinates: Samples (N) = ${obsCount} | Mean (X̄) = ${obsMean} | SD (σ) = ${knownSigma}\n`;
    } else {
      log += `  - Data Coordinates: Count (k) = ${poissonObs} | Exposure = ${poissonExposure}y\n`;
    }
    log += `  - Max Likelihood Est: ${sampleEstimate.toFixed(4)}\n`;
    log += `------------------------------------------------------------\n`;
    log += `POSTERIOR DENSITY PROFILE (GRID APPRX & CONJUGATE):\n`;
    log += `  - Computed Mean (Expected):  ${pMean.toFixed(4)}\n`;
    log += `  - Computed Mode (MAP Est):   ${postMode.toFixed(4)}\n`;
    log += `  - Computed Standard Dev:     ${postSD.toFixed(4)}\n`;
    log += `  - 95% Bayesian HDI Interval:  [ ${hdiLower.toFixed(3)}  ➔  ${hdiUpper.toFixed(3)} ]\n`;
    log += `------------------------------------------------------------\n`;
    log += `SYSTEM CODE: 1956-BAYES-CALIBRATOR`;

    setLogOutput(log);
  };

  // Convert points array to responsive SVG coordinate path
  const generatePath = (
    distPoints: DistributionPoint[],
    selector: 'prior' | 'likelihood' | 'posterior',
    width: number,
    height: number,
    isProbabilityScale: boolean
  ): string => {
    if (distPoints.length === 0) return '';
    const maxVal = Math.max(...distPoints.map(p => Math.max(p.prior, p.likelihood, p.posterior)), 1e-3);
    const scaleY = (height - 35) / maxVal;
    
    const minX = isProbabilityScale ? 0.001 : 0.0;
    const maxX = isProbabilityScale ? 0.999 : 100.0;

    let path = '';
    distPoints.forEach((p, idx) => {
      // Map x to SVG coordinate scope [20, width-20]
      const px = 25 + ((p.x - minX) / (maxX - minX)) * (width - 45);
      // Map density to SVG coordinate [height-25, 10]
      const density = selector === 'prior' ? p.prior : (selector === 'likelihood' ? p.likelihood : p.posterior);
      const py = height - 25 - density * scaleY;

      if (idx === 0) {
        path += `M ${px} ${py}`;
      } else {
        path += ` L ${px} ${py}`;
      }
    });

    return path;
  };

  // HDI Shaded Area coordinate path builder
  const generateHdiAreaPath = (
    distPoints: DistributionPoint[],
    lower: number,
    upper: number,
    width: number,
    height: number,
    isProbabilityScale: boolean
  ): string => {
    if (distPoints.length === 0) return '';
    const maxVal = Math.max(...distPoints.map(p => Math.max(p.prior, p.likelihood, p.posterior)), 1e-3);
    const scaleY = (height - 35) / maxVal;

    const minX = isProbabilityScale ? 0.001 : 0.0;
    const maxX = isProbabilityScale ? 0.999 : 100.0;

    // Filter points in range
    const inRange = distPoints.filter(p => p.x >= lower && p.x <= upper);
    if (inRange.length === 0) return '';

    let path = '';
    // Bottom left anchor
    const startPx = 25 + ((inRange[0].x - minX) / (maxX - minX)) * (width - 45);
    path += `M ${startPx} ${height - 25}`;

    // Top curve
    inRange.forEach(p => {
      const px = 25 + ((p.x - minX) / (maxX - minX)) * (width - 45);
      const py = height - 25 - p.posterior * scaleY;
      path += ` L ${px} ${py}`;
    });

    // Bottom right anchor
    const endPx = 25 + ((inRange[inRange.length - 1].x - minX) / (maxX - minX)) * (width - 45);
    path += ` L ${endPx} ${height - 25} Z`;

    return path;
  };

  const isProbabilityScale = priorType === 'beta' || likelihoodModel === 'binomial';

  return (
    <div ref={sectionRef} className="w-full py-4 space-y-6" id="bayesian-inference-lab">
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        
        {/* Left column hyperparameters inputs */}
        <div className="space-y-6">
          <div className="scroll-reveal">
            <span className="geo-block-red text-[11px] font-bold tracking-widest inline-flex items-center gap-2">
              <Settings className="w-4 h-4" />
              LABORATORY APPARATUS MODULE XVI
            </span>
            <h2 className="font-display text-xl sm:text-3xl text-[#1D3557] mt-3">BAYESIAN INFERENCE LAB</h2>
            <p className="font-body text-xs text-[#1D3557]/70 uppercase tracking-widest mt-1">Conjugate models & grid approximations what-if simulator</p>
            <div className="line-separator max-w-sm mt-3" />
          </div>

          {/* Model types configuration */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              🔬 CONJECTURAL MODEL SETUP
            </span>
            <div className="grid grid-cols-2 gap-4 font-body text-xs text-[#1D3557]">
              <div>
                <label className="font-bold block mb-1">SELECT PRIOR PROFILE:</label>
                <select
                  value={priorType}
                  onChange={(e) => {
                    const type = e.target.value as 'beta' | 'gaussian';
                    setPriorType(type);
                    // Standard matching adjustments to prevent boundary errors
                    if (type === 'beta') setLikelihoodModel('binomial');
                    else setLikelihoodModel('normal');
                  }}
                  className="w-full font-body text-xs font-bold bg-[#F5F1E8] border border-[#1D3557] py-1.5 px-2 mt-1"
                >
                  <option value="beta">Beta Prior (Bounded: [0, 1])</option>
                  <option value="gaussian">Gaussian Prior (Unbounded: [0, 100])</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">SELECT LIKELIHOOD MODEL:</label>
                <select
                  value={likelihoodModel}
                  onChange={(e) => setLikelihoodModel(e.target.value as any)}
                  className="w-full font-body text-xs font-bold bg-[#F5F1E8] border border-[#1D3557] py-1.5 px-2 mt-1"
                >
                  {priorType === 'beta' ? (
                    <>
                      <option value="binomial">Binomial (Successes / Trials)</option>
                      <option value="poisson">Poisson (Warped Grid count)</option>
                    </>
                  ) : (
                    <>
                      <option value="normal">Normal (Sample Avg / known SD)</option>
                      <option value="binomial">Binomial (Probability Grid)</option>
                      <option value="poisson">Poisson (Rate parameter)</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Prior Parameters Sliders Panel */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              📐 PRIOR DISTRIBUTIONS HYPERPARAMETERS (SLIDERS)
            </span>
            
            {priorType === 'beta' ? (
              <div className="space-y-4 font-body text-xs text-[#1D3557]">
                {/* Alpha slider */}
                <div>
                  <div className="flex justify-between font-bold">
                    <span>SUCCESS WEIGHT SHAPE PARAMETER (Alpha - α):</span>
                    <span className="text-[#E63946]">{alpha.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="15.0"
                    step="0.5"
                    value={alpha}
                    onChange={(e) => setAlpha(parseFloat(e.target.value))}
                    className="w-full h-1 bg-[#F5F1E8] border border-[#1D3557] outline-none accent-[#E63946] cursor-pointer mt-1"
                  />
                </div>

                {/* Beta slider */}
                <div>
                  <div className="flex justify-between font-bold">
                    <span>FAILURE WEIGHT SHAPE PARAMETER (Beta - β):</span>
                    <span className="text-[#E63946]">{beta.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="15.0"
                    step="0.5"
                    value={beta}
                    onChange={(e) => setBeta(parseFloat(e.target.value))}
                    className="w-full h-1 bg-[#F5F1E8] border border-[#1D3557] outline-none accent-[#E63946] cursor-pointer mt-1"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 font-body text-xs text-[#1D3557]">
                {/* Mu0 Mean slider */}
                <div>
                  <div className="flex justify-between font-bold">
                    <span>EXPECTED VALUE MEAN PARAMETER (Mu0 - μ₀):</span>
                    <span className="text-[#E63946]">{mu0.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="10.0"
                    max="90.0"
                    step="1.0"
                    value={mu0}
                    onChange={(e) => setMu0(parseFloat(e.target.value))}
                    className="w-full h-1 bg-[#F5F1E8] border border-[#1D3557] outline-none accent-[#E63946] cursor-pointer mt-1"
                  />
                </div>

                {/* Sigma0 SD slider */}
                <div>
                  <div className="flex justify-between font-bold">
                    <span>VARIABILITY STANDARD DEV PARAMETER (Sigma0 - σ₀):</span>
                    <span className="text-[#E63946]">{sigma0.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="2.0"
                    max="20.0"
                    step="0.5"
                    value={sigma0}
                    onChange={(e) => setSigma0(parseFloat(e.target.value))}
                    className="w-full h-1 bg-[#F5F1E8] border border-[#1D3557] outline-none accent-[#E63946] cursor-pointer mt-1"
                  />
                </div>
              </div>
            )}
            <div className="mt-3 bg-[#F5F1E8] p-2 border border-[#1D3557]/10 font-bold text-[9px] text-[#C5A059] uppercase text-center rounded-sm">
              ℹ️ Prior Stats Summary: {priorStats}
            </div>
          </div>

          {/* Observed empirical data inputs */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              📊 OBSERVED EXPERIMENTAL DATA POINTS
            </span>

            {likelihoodModel === 'binomial' && (
              <div className="grid grid-cols-2 gap-4 font-body text-xs text-[#1D3557]">
                <div>
                  <label className="font-bold block mb-1">OBSERVED SUCCESSES (k):</label>
                  <input
                    type="number"
                    value={obsSuccesses}
                    onChange={(e) => setObsSuccesses(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full input-vintage text-xs font-bold bg-transparent border-b border-[#1D3557] outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">OBSERVED TOTAL TRIALS (n):</label>
                  <input
                    type="number"
                    value={obsTrials}
                    onChange={(e) => setObsTrials(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full input-vintage text-xs font-bold bg-transparent border-b border-[#1D3557] outline-none"
                  />
                </div>
              </div>
            )}

            {likelihoodModel === 'normal' && (
              <div className="grid grid-cols-3 gap-3 font-body text-xs text-[#1D3557]">
                <div>
                  <label className="font-bold block mb-1">SAMPLE SIZE (N):</label>
                  <input
                    type="number"
                    value={obsCount}
                    onChange={(e) => setObsCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full input-vintage text-xs font-bold bg-transparent border-b border-[#1D3557] outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">SAMPLE AVERAGE (X̄):</label>
                  <input
                    type="number"
                    value={obsMean}
                    onChange={(e) => setObsMean(parseFloat(e.target.value) || 0)}
                    className="w-full input-vintage text-xs font-bold bg-transparent border-b border-[#1D3557] outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">KNOWN SD (σ):</label>
                  <input
                    type="number"
                    value={knownSigma}
                    onChange={(e) => setKnownSigma(Math.max(0.1, parseFloat(e.target.value) || 1))}
                    className="w-full input-vintage text-xs font-bold bg-transparent border-b border-[#1D3557] outline-none"
                  />
                </div>
              </div>
            )}

            {likelihoodModel === 'poisson' && (
              <div className="grid grid-cols-2 gap-4 font-body text-xs text-[#1D3557]">
                <div>
                  <label className="font-bold block mb-1">OBSERVED EVENT COUNT (k):</label>
                  <input
                    type="number"
                    value={poissonObs}
                    onChange={(e) => setPoissonObs(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full input-vintage text-xs font-bold bg-transparent border-b border-[#1D3557] outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">EXPOSURE (e.g. Years):</label>
                  <input
                    type="number"
                    value={poissonExposure}
                    step="0.1"
                    onChange={(e) => setPoissonExposure(Math.max(0.1, parseFloat(e.target.value) || 1))}
                    className="w-full input-vintage text-xs font-bold bg-transparent border-b border-[#1D3557] outline-none"
                  />
                </div>
              </div>
            )}
            <div className="mt-3 bg-[#F5F1E8] p-2 border border-[#1D3557]/10 font-bold text-[9px] text-[#C5A059] uppercase text-center rounded-sm">
              ℹ️ Likelihood Stats: {likelihoodStats}
            </div>
          </div>
        </div>

        {/* Right column SVG plot and analytical ledgers */}
        <div className="space-y-6">
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              📊 PROBABILITY SPECTRUM DENISITY PLOT (PDF)
            </span>

            {/* SVG density curves visual viewport */}
            <div className="bg-[#F4ECD8] border-2 border-[#C5A059] p-3 shadow-inner rounded-sm overflow-x-auto w-full relative">
              
              {/* Plot canvas */}
              <svg
                width="480"
                height="220"
                viewBox="0 0 480 220"
                className="block bg-[#F4ECD8] border border-[#C5A059]/40 w-full h-auto aspect-[24/11]"
              >
                {/* Horizontal grid ticks */}
                <line x1="25" y1="195" x2="465" y2="195" stroke="#1D3557" strokeWidth="1.5" />
                <line x1="25" y1="10" x2="25" y2="195" stroke="#1D3557" strokeWidth="1.5" />
                
                {/* PDF coordinate scale grid markers */}
                <text x="25" y="208" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#1D3557">
                  {isProbabilityScale ? '0.0' : '0'}
                </text>
                <text x="245" y="208" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#1D3557">
                  {isProbabilityScale ? '0.5' : '50'}
                </text>
                <text x="465" y="208" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#1D3557">
                  {isProbabilityScale ? '1.0' : '100'}
                </text>
                
                {/* 1. Shaded area HDI under posterior */}
                {hdiBounds && points.length > 0 && (
                  <path
                    d={generateHdiAreaPath(points, hdiBounds.lower, hdiBounds.upper, 480, 220, isProbabilityScale)}
                    fill="rgba(230, 57, 70, 0.08)"
                    stroke="none"
                  />
                )}

                {/* 2. Prior distribution path (dashed blue) */}
                {points.length > 0 && (
                  <path
                    d={generatePath(points, 'prior', 480, 220, isProbabilityScale)}
                    fill="none"
                    stroke="#1D3557"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                )}

                {/* 3. Likelihood distribution path (thin red) */}
                {points.length > 0 && (
                  <path
                    d={generatePath(points, 'likelihood', 480, 220, isProbabilityScale)}
                    fill="none"
                    stroke="#C5A059"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* 4. Posterior distribution path (thick red solid) */}
                {points.length > 0 && (
                  <path
                    d={generatePath(points, 'posterior', 480, 220, isProbabilityScale)}
                    fill="none"
                    stroke="#E63946"
                    strokeWidth="3.0"
                  />
                )}

                {/* Vertical credible bounds markers */}
                {hdiBounds && points.length > 0 && (() => {
                  const minX = isProbabilityScale ? 0.001 : 0.0;
                  const maxX = isProbabilityScale ? 0.999 : 100.0;
                  
                  const lx = 25 + ((hdiBounds.lower - minX) / (maxX - minX)) * 435;
                  const ux = 25 + ((hdiBounds.upper - minX) / (maxX - minX)) * 435;
                  
                  return (
                    <>
                      {/* Left bound */}
                      <line x1={lx} y1="35" x2={lx} y2="195" stroke="rgba(230,57,70,0.4)" strokeWidth="1" strokeDasharray="1 1" />
                      {/* Right bound */}
                      <line x1={ux} y1="35" x2={ux} y2="195" stroke="rgba(230,57,70,0.4)" strokeWidth="1" strokeDasharray="1 1" />
                      
                      {/* Interval bracket */}
                      <line x1={lx} y1="40" x2={ux} y2="40" stroke="#E63946" strokeWidth="1.5" />
                      <line x1={lx} y1="37" x2={lx} y2="43" stroke="#E63946" strokeWidth="2" />
                      <line x1={ux} y1="37" x2={ux} y2="43" stroke="#E63946" strokeWidth="2" />
                      
                      <text x={(lx + ux) / 2} y="35" textAnchor="middle" fontSize="7" fontWeight="bold" fontFamily="monospace" fill="#E63946">
                        95% HDI CREDIBLE INTERVAL
                      </text>
                    </>
                  );
                })()}
              </svg>

              {/* Legends indicators */}
              <div className="flex flex-wrap justify-between gap-2 mt-3 font-body text-[8px] text-[#1D3557] font-bold border-t border-[#1D3557]/10 pt-2 uppercase">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-0.5 border-t border-dashed border-[#1D3557]" />
                  <span>Prior Expectation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-0.5 border-t border-dashed border-[#C5A059]" />
                  <span>Sample Likelihood</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-1 bg-[#E63946]" />
                  <span className="text-[#E63946]">Posterior Convergence</span>
                </div>
              </div>
            </div>

            {/* Glowing Posterior result statistics banner */}
            <div className="border-4 double border-[#1D3557] p-5 text-center select-none bg-[#F5F1E8] mt-4">
              <span className="font-display text-sm text-[#1D3557]/60 block mb-1">CONVERGED POSTERIOR DENSITY PROFILE</span>
              <span className="font-display text-3xl text-[#E63946] block mb-1 animate-pulse">
                {posteriorStats.split(' | ')[0].split(': ')[1]} EXPECTED
              </span>
              <span className="font-display-alt text-[10px] text-[#1D3557] tracking-widest block font-bold">
                ({posteriorStats})
              </span>
            </div>
          </div>

          {/* Bayesian diagnostic analytical sheet printout */}
          <div className="scroll-reveal relative">
            <span className="absolute top-2 right-4 font-display text-[9px] text-[#C5A059] font-bold tracking-widest z-10">INFERENCE DIAGNOSTIC</span>
            <pre className="w-full text-[10px] bg-[#F4ECD8] text-[#332211] font-body p-4 border-2 border-[#C5A059] rounded-sm max-h-[220px] overflow-y-auto shadow-inner leading-relaxed whitespace-pre-wrap">
              {logOutput}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BayesianInferenceLab;
