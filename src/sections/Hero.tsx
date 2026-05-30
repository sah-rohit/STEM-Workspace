import { useEffect, useRef } from 'react';
import { Atom, Calendar, ChevronRight } from 'lucide-react';

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

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

    const elements = heroRef.current?.querySelectorAll('.scroll-reveal');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={heroRef}
      className="relative min-h-screen w-full flex items-center overflow-hidden"
      id="home"
    >
      {/* Background geometric shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#E63946]/5 transform rotate-45" />
        <div className="absolute bottom-40 right-20 w-48 h-48 bg-[#1D3557]/5 transform rotate-12" />
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-[#457B9D]/10" />
      </div>

      {/* Barber pole accent */}
      <div className="absolute left-0 top-0 h-full w-4 barber-pole-stripes hidden lg:block" />

      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 pt-32 pb-20 lg:pt-40 lg:pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left: Text Content */}
          <div ref={textRef} className="relative z-10 order-2 lg:order-1">
            {/* Subtitle */}
            <div className="scroll-reveal mb-6">
              <span className="inline-flex items-center gap-3 geo-block-blue text-sm tracking-widest">
                <Atom className="w-4 h-4 text-white animate-spin-slow" />
                ATOMIC MODEL CALIBRATION APPARATUS
              </span>
            </div>

            {/* Main Heading */}
            <div className="scroll-reveal mb-8" style={{ transitionDelay: '0.1s' }}>
              <h1 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-none mb-2">
                <span className="block text-[#1D3557]">STEM</span>
                <span className="block shimmer-text">WORKSHOP</span>
              </h1>
              <div className="line-separator max-w-md" />
            </div>

            {/* Tagline */}
            <div className="scroll-reveal mb-10" style={{ transitionDelay: '0.2s' }}>
              <p className="font-body text-base sm:text-lg text-[#1D3557]/80 max-w-md leading-relaxed">
                Where 1950s atomic craftsmanship meets high-precision modern computing. 
                Step into my computational laboratory to balance equations, manipulate matrices, analyze statistics, and model root methods.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="scroll-reveal flex flex-wrap gap-4" style={{ transitionDelay: '0.3s' }}>
              <button 
                onClick={() => {
                  const el = document.getElementById('blueprint-directory');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="ticket-btn flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                BROWSE DIRECTORY
              </button>
              <button 
                onClick={() => { if (window.changeSTEMApparatus) window.changeSTEMApparatus('matrix-lab'); }}
                className="inline-flex items-center gap-2 px-6 py-3 border-3 border-[#1D3557] text-[#1D3557] font-semibold tracking-wider text-sm hover:bg-[#1D3557] hover:text-white transition-all duration-300 shadow-sm"
              >
                LAUNCH WORKSPACE
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Stats */}
            <div className="scroll-reveal mt-16 grid grid-cols-3 gap-4 sm:gap-8 max-w-md" style={{ transitionDelay: '0.4s' }}>
              <div className="text-center">
                <div className="font-display text-2xl sm:text-4xl text-[#E63946]">13</div>
                <div className="font-body text-[10px] sm:text-xs tracking-wider text-[#1D3557]/70 uppercase mt-1">APPARATUS MODULES</div>
              </div>
              <div className="text-center">
                <div className="font-display text-2xl sm:text-4xl text-[#E63946]">100%</div>
                <div className="font-body text-[10px] sm:text-xs tracking-wider text-[#1D3557]/70 uppercase mt-1">CLIENT-SIDE MATH</div>
              </div>
              <div className="text-center">
                <div className="font-display text-2xl sm:text-4xl text-[#E63946]">1956</div>
                <div className="font-body text-[10px] sm:text-xs tracking-wider text-[#1D3557]/70 uppercase mt-1">MODEL CALIBRATION</div>
              </div>
            </div>
          </div>

          {/* Right: Interactive Atomic Blueprint Visual */}
          <div className="relative order-1 lg:order-2">
            <div className="scroll-reveal relative" style={{ transitionDelay: '0.2s' }}>
              {/* Main Blueprint Box */}
              <div className="relative z-10">
                <div className="thick-frame bg-[#F4ECD8] p-6 flex flex-col items-center justify-center min-h-[400px] lg:min-h-[480px]">
                  {/* Ledger-like blueprint header */}
                  <div className="w-full text-center border-b border-[#1D3557]/30 pb-3 mb-6">
                    <span className="font-display text-xs tracking-widest text-[#E63946] block mb-1">★ SCHEMATIC NO. ATOM-1956-V ★</span>
                    <span className="font-body text-lg text-[#1D3557] font-semibold block">ATOMIC CALIBRATOR ORBIT ENGINE</span>
                  </div>

                  {/* Animated Atomic SVG blueprint */}
                  <svg className="w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-80 lg:h-80 text-[#1D3557]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
                    {/* Background drafting grid */}
                    <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeDasharray="1 3" strokeOpacity="0.3" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeDasharray="1 3" strokeOpacity="0.3" />
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeDasharray="2 4" strokeOpacity="0.2" />
                    <circle cx="50" cy="50" r="25" stroke="currentColor" strokeDasharray="2 4" strokeOpacity="0.2" />

                    {/* Nucleus Core */}
                    <circle cx="50" cy="50" r="5" fill="#E63946" stroke="#1D3557" strokeWidth="1.5" />
                    <circle cx="48" cy="48" r="2" fill="#1D3557" />
                    <circle cx="52" cy="51" r="2.2" fill="#E63946" />

                    {/* Orbit Ring 1 */}
                    <ellipse cx="50" cy="50" rx="40" ry="12" className="animate-pulse" style={{ transformOrigin: '50px 50px', transform: 'rotate(30deg)' }} strokeWidth="1.2" />
                    {/* Orbit Ring 2 */}
                    <ellipse cx="50" cy="50" rx="40" ry="12" style={{ transformOrigin: '50px 50px', transform: 'rotate(90deg)' }} strokeWidth="1.2" />
                    {/* Orbit Ring 3 */}
                    <ellipse cx="50" cy="50" rx="40" ry="12" style={{ transformOrigin: '50px 50px', transform: 'rotate(150deg)' }} strokeWidth="1.2" />

                    {/* Orbiting particles (CSS animated) */}
                    <circle cx="90" cy="50" r="2.5" fill="#1D3557" className="animate-bounce" style={{ transformOrigin: '50px 50px', animationDuration: '4s' }} />
                    <circle cx="50" cy="10" r="2" fill="#E63946" className="animate-pulse" style={{ transformOrigin: '50px 50px', animationDuration: '3s' }} />
                    <circle cx="10" cy="50" r="2.2" fill="#1D3557" />
                  </svg>

                  {/* Calibration details below blueprint */}
                  <div className="w-full border-t border-[#1D3557]/30 pt-4 mt-6 text-center">
                    <p className="font-body text-xs text-[#1D3557]/70 uppercase tracking-widest">
                      CALIBRATED IN ATOM-1956 SYSTEM • REGISTER VERIFIED
                    </p>
                  </div>
                </div>
              </div>

              {/* Offset card to make it double frame */}
              <div className="absolute -bottom-6 -left-6 w-2/3 h-1/2 bg-[#E63946]/5 border-2 border-dashed border-[#E63946]/30 z-0 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E63946] via-[#1D3557] to-[#457B9D]" />
    </section>
  );
};

export default Hero;
