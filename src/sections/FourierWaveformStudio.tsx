import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Radio } from 'lucide-react';

const FourierWaveformStudio = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const timeCanvasRef = useRef<HTMLCanvasElement>(null);
  const freqCanvasRef = useRef<HTMLCanvasElement>(null);

  // Fundamental frequency of the sound (Hz)
  const [baseFreq, setBaseFreq] = useState<number>(220); // A3 note
  // Harmonic Amplitudes (Harmonics 1 to 6)
  const [harmonics, setHarmonics] = useState<number[]>([1.0, 0.0, 0.3, 0.0, 0.2, 0.0]); // odd harmonics fundamental
  
  // Audio Synthesis Web Audio API State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

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

  // Redraw canvases and update Web Audio node parameters when state changes
  useEffect(() => {
    drawWaveforms();
    if (isPlaying) {
      updateSynthesizerWave();
    }
  }, [harmonics, baseFreq]);

  // Clean up Audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  // Web Audio Synth Controllers
  const toggleAudio = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  const startAudio = () => {
    setErrorBox(null);
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        throw new Error("Web Audio API is not supported by your browser software.");
      }

      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      // Create periodic wave mapping
      const real = new Float32Array(harmonics.length + 1);
      const imag = new Float32Array(harmonics.length + 1);
      
      // index 0 is DC offset (always 0)
      real[0] = 0;
      imag[0] = 0;

      // Map harmonics: imag coefficients represent SINE terms (standard for audio wave synthesis)
      harmonics.forEach((h, idx) => {
        real[idx + 1] = 0;
        imag[idx + 1] = h;
      });

      const wave = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
      const osc = ctx.createOscillator();
      osc.setPeriodicWave(wave);
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime); // keep volume low and soft

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscillatorRef.current = osc;
      gainNodeRef.current = gain;
      setIsPlaying(true);
      window.showAtelierToast("Acoustic Vacuum Tube Synth activated.", "success");
    } catch (e: any) {
      setErrorBox(`🚨 WEB AUDIO FAULT:\n${e.message}`);
    }
  };

  const updateSynthesizerWave = () => {
    const ctx = audioCtxRef.current;
    const osc = oscillatorRef.current;
    if (!ctx || !osc) return;

    try {
      const real = new Float32Array(harmonics.length + 1);
      const imag = new Float32Array(harmonics.length + 1);
      real[0] = 0;
      imag[0] = 0;

      harmonics.forEach((h, idx) => {
        real[idx + 1] = 0;
        imag[idx + 1] = h;
      });

      const wave = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
      osc.setPeriodicWave(wave);
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    } catch (e) {}
  };

  const stopAudio = () => {
    try {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    } catch (e) {}
    oscillatorRef.current = null;
    audioCtxRef.current = null;
    gainNodeRef.current = null;
    setIsPlaying(false);
  };

  // Preset Waveform math coefficients generators
  const loadPreset = (type: 'sine' | 'square' | 'sawtooth' | 'triangle') => {
    setErrorBox(null);
    let newHarms = [1.0, 0.0, 0.0, 0.0, 0.0, 0.0];

    switch (type) {
      case 'sine':
        newHarms = [1.0, 0.0, 0.0, 0.0, 0.0, 0.0];
        break;
      case 'square':
        // Odd harmonics: 1/n
        newHarms = [1.0, 0.0, 0.333, 0.0, 0.200, 0.0];
        break;
      case 'sawtooth':
        // All harmonics: 1/n
        newHarms = [1.0, 0.5, 0.333, 0.25, 0.200, 0.166];
        break;
      case 'triangle':
        // Odd harmonics alternate signs: 1/n^2
        newHarms = [1.0, 0.0, -0.111, 0.0, 0.040, 0.0];
        break;
    }

    setHarmonics(newHarms);
    window.showAtelierToast(`Loaded periodic preset wave: ${type.toUpperCase()}`, "info");
  };

  // Draw plots
  const drawWaveforms = () => {
    const timeCanvas = timeCanvasRef.current;
    const freqCanvas = freqCanvasRef.current;
    if (!timeCanvas || !freqCanvas) return;

    const tCtx = timeCanvas.getContext('2d');
    const fCtx = freqCanvas.getContext('2d');
    if (!tCtx || !fCtx) return;

    tCtx.clearRect(0, 0, timeCanvas.width, timeCanvas.height);
    fCtx.clearRect(0, 0, freqCanvas.width, freqCanvas.height);

    // 1. Draw Time Domain Waveform Curve
    // Grid paper
    tCtx.strokeStyle = 'rgba(0, 40, 104, 0.04)';
    tCtx.lineWidth = 1;
    for (let x = 20; x < timeCanvas.width; x += 20) {
      tCtx.beginPath(); tCtx.moveTo(x, 0); tCtx.lineTo(x, timeCanvas.height); tCtx.stroke();
    }
    for (let y = 20; y < timeCanvas.height; y += 20) {
      tCtx.beginPath(); tCtx.moveTo(0, y); tCtx.lineTo(timeCanvas.width, y); tCtx.stroke();
    }

    // Central horizontal axis
    tCtx.strokeStyle = '#1D3557';
    tCtx.lineWidth = 2;
    tCtx.beginPath();
    tCtx.moveTo(0, timeCanvas.height / 2);
    tCtx.lineTo(timeCanvas.width, timeCanvas.height / 2);
    tCtx.stroke();

    // Wave synthesis plotter
    tCtx.strokeStyle = '#E63946';
    tCtx.lineWidth = 3;
    tCtx.beginPath();

    const amplitudeScale = 50; // max px height offset
    const samples = timeCanvas.width;

    for (let px = 0; px < samples; px++) {
      // Scale px to standard time window $t \in [0, 2\pi]$
      const t = (px / samples) * 2 * Math.PI * 2; // draw 2 complete cycles
      let yVal = 0;

      harmonics.forEach((h, idx) => {
        const order = idx + 1;
        yVal += h * Math.sin(order * t);
      });

      const py = timeCanvas.height / 2 - yVal * amplitudeScale;
      if (px === 0) tCtx.moveTo(px, py);
      else tCtx.lineTo(px, py);
    }
    tCtx.stroke();

    // 2. Draw Frequency Spectrum Bars (1950s Spectrum Analyzer)
    fCtx.strokeStyle = 'rgba(0, 40, 104, 0.04)';
    fCtx.lineWidth = 1;
    for (let x = 20; x < freqCanvas.width; x += 20) {
      fCtx.beginPath(); fCtx.moveTo(x, 0); fCtx.lineTo(x, freqCanvas.height); fCtx.stroke();
    }
    for (let y = 20; y < freqCanvas.height; y += 20) {
      fCtx.beginPath(); fCtx.moveTo(0, y); fCtx.lineTo(freqCanvas.width, y); fCtx.stroke();
    }

    const barWidth = 36;
    const barSpacing = (freqCanvas.width - 40) / harmonics.length;

    harmonics.forEach((h, idx) => {
      const order = idx + 1;
      const val = Math.abs(h);
      const bx = 30 + idx * barSpacing;
      const bHeight = val * (freqCanvas.height - 60);
      const by = freqCanvas.height - 30 - bHeight;

      // Draw metallic retro spectrum bar
      fCtx.fillStyle = '#1D3557';
      fCtx.strokeStyle = '#FFFDF0';
      fCtx.lineWidth = 1.5;
      fCtx.beginPath();
      fCtx.roundRect(bx, by, barWidth, bHeight, 2);
      fCtx.fill();
      fCtx.stroke();

      // Label below bar
      fCtx.fillStyle = '#1D3557';
      fCtx.font = 'bold 9px "Cutive Mono", monospace';
      fCtx.textAlign = 'center';
      fCtx.fillText(`${order}f`, bx + barWidth / 2, freqCanvas.height - 14);

      // Amplitude value above bar
      fCtx.fillText(val.toFixed(2), bx + barWidth / 2, by - 6);
    });

    compileFourierReport();
  };

  const compileFourierReport = () => {
    let log = `FOURIER HARMONIC SPECTRUM LEDGER REPORT:\n`;
    log += `------------------------------------------------------------\n`;
    log += `Fundamental Frequency (1f):  ${baseFreq} Hz\n`;
    log += `Active Waveform Synthesis:   A * sin(2πft)\n\n`;
    log += `HARMONIC SERIES SUMMARY REGISTER:\n`;
    
    harmonics.forEach((h, idx) => {
      const order = idx + 1;
      const f = baseFreq * order;
      log += `  - Harmonic ${order}f: Frequency: ${String(f).padStart(4)} Hz | Amplitude: ${h.toFixed(3).padStart(6)} (ratio: ${(Math.abs(h)*100).toFixed(1)}%)\n`;
    });
    log += `------------------------------------------------------------\n`;
    log += `ACOUSTIC APPARATUS STATS: CLIENT AUDIO CHASSIS SECURED.`;
    setLogOutput(log);
  };

  const handleHarmonicChange = (idx: number, val: number) => {
    const copy = [...harmonics];
    copy[idx] = val;
    setHarmonics(copy);
  };

  return (
    <div ref={sectionRef} className="w-full py-4 space-y-6" id="fourier-waveform-studio">
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Control card (5 cols) */}
        <div className="space-y-6">
          <div className="scroll-reveal">
            <span className="geo-block-red text-[11px] font-bold tracking-widest inline-flex items-center gap-2">
              <Radio className="w-4 h-4" />
              LABORATORY APPARATUS MODULE VIII
            </span>
            <h2 className="font-display text-xl sm:text-3xl text-[#1D3557] mt-3">FOURIER WAVEFORM SYNTH</h2>
            <p className="font-body text-xs text-[#1D3557]/70 uppercase tracking-widest mt-1">Web Audio Harmonic Wave Synthesizer</p>
            <div className="line-separator max-w-sm mt-3" />
          </div>

          {/* Wave Presets Toggles */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              👁 LOAD HARMONIC WAVE MODEL
            </span>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {['sine', 'square', 'sawtooth', 'triangle'].map(type => (
                <button
                  key={type}
                  onClick={() => loadPreset(type as any)}
                  className="ticket-btn py-2 px-2.5 text-[9px] font-bold uppercase flex-1 min-w-[70px]"
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Radio Frequency control knob */}
            <div className="border-t border-dashed border-[#1D3557]/25 pt-3">
              <label className="font-body text-xs font-bold text-[#1D3557] block mb-2">
                📻 FUNDAMENTAL PITCH FREQUENCY: <span className="text-[#E63946]">{baseFreq} Hz</span>
              </label>
              <input
                type="range"
                min="110"
                max="880"
                step="5"
                value={baseFreq}
                onChange={(e) => setBaseFreq(parseInt(e.target.value))}
                className="w-full h-1 bg-[#1D3557] outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Audio Synthesizer Toggle */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              🔊 ACOUSTIC VACUUM TUBE OSCILLATOR
            </span>
            <div className="flex flex-wrap gap-3 items-center w-full">
              <button
                onClick={toggleAudio}
                className={`ticket-btn flex-1 min-w-[200px] py-3 text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  isPlaying ? 'bg-[#E63946] text-white animate-pulse' : 'bg-[#1D3557] text-[#FFFDF0]'
                }`}
              >
                {isPlaying ? (
                  <>
                    <VolumeX className="w-4 h-4 animate-bounce" />
                    [ SHUT OFF SYNTH ]
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    [ PLAY SYNTH SOUND ]
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Harmonic sliders drawer */}
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5 font-body text-xs text-[#1D3557]">
            <span className="font-display text-xs text-[#E63946] block mb-3 font-bold uppercase tracking-wider">🎚 HARMONIC AMPLITUDE DRAWER</span>
            <div className="space-y-3">
              {harmonics.map((h, idx) => {
                const order = idx + 1;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="font-bold w-6">{order}f:</span>
                    <input
                      type="range"
                      min="-1.0"
                      max="1.0"
                      step="0.05"
                      value={h}
                      onChange={(e) => handleHarmonicChange(idx, parseFloat(e.target.value))}
                      className="flex-1 h-1 bg-[#1D3557]/20 outline-none cursor-pointer"
                    />
                    <span className="w-10 text-right font-bold text-[#E63946]">{h.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right spectrum canvas (7 cols) */}
        <div className="space-y-6">
          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              📈 TIME DOMAIN SYNTHESIZED WAVEFORM
            </span>
            <div className="bg-[#F4ECD8] border-2 border-[#C5A059] p-3 shadow-inner rounded-sm w-full overflow-x-auto">
              <canvas
                ref={timeCanvasRef}
                width="500"
                height="160"
                className="block bg-[#F4ECD8] border border-[#C5A059]/40 w-full h-auto aspect-[25/8] mx-auto"
              />
            </div>
          </div>

          <div className="scroll-reveal vintage-menu-card p-4 sm:p-5">
            <span className="font-display text-sm text-[#1D3557] block mb-3 border-b border-dashed border-[#1D3557]/20 pb-1.5">
              📊 FOURIER HARMONIC SPECTRUM ANALYZER
            </span>
            <div className="bg-[#F4ECD8] border-2 border-[#C5A059] p-3 shadow-inner rounded-sm w-full overflow-x-auto">
              <canvas
                ref={freqCanvasRef}
                width="500"
                height="160"
                className="block bg-[#F4ECD8] border border-[#C5A059]/40 w-full h-auto aspect-[25/8] mx-auto"
              />
            </div>

            {/* Error box */}
            {errorBox && (
              <div className="error-ticket mt-4 font-bold text-xs leading-normal">
                {errorBox}
              </div>
            )}

            {/* Logs printout */}
            <div className="relative mt-4">
              <span className="absolute top-2 right-4 font-display text-[9px] text-[#C5A059] font-bold tracking-widest z-10">SPECTRUM TICKET</span>
              <pre className="w-full text-[10px] bg-[#F4ECD8] text-[#332211] font-body p-4 border-2 border-[#C5A059] rounded-sm max-h-[200px] overflow-x-auto shadow-inner leading-relaxed whitespace-pre-wrap">
                {logOutput}
              </pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FourierWaveformStudio;
