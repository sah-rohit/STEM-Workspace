import { Atom, Github, Award, Book } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full bg-[#1D3557] text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#E63946] flex items-center justify-center">
                <Atom className="w-6 h-6 text-white animate-spin-slow" style={{ animationDuration: '12s' }} />
              </div>
              <div>
                <span className="font-display text-2xl block">STEM</span>
                <span className="font-display text-2xl text-[#E63946]">WORKSHOP</span>
              </div>
            </div>
            <p className="font-body text-white/70 leading-relaxed mb-6 max-w-md">
              A premium client-side mathematical and physical computational workshop. 
              Designed strictly to model complex scientific systems using modern 
              web standards and vintage drafting aesthetics.
            </p>
            <div className="flex gap-3">
              <a 
                href="https://github.com/sah-rohit/STEM-Workspace" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border-2 border-white/30 flex items-center justify-center hover:border-[#E63946] hover:bg-[#E63946] transition-all duration-300"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg mb-6">WORKBENCHES</h4>
            <ul className="space-y-3">
              {[
                { label: 'I. Matrix Workbench', id: 'matrix-lab' },
                { label: 'II. Equation Solver', id: 'equation-solver' },
                { label: 'VI. Circuit Simulator', id: 'logic-gate-simulator' },
                { label: 'VII. Geometry Lab', id: 'geometry-lab' },
                { label: 'VIII. Fourier Studio', id: 'fourier-waveform-studio' },
                { label: 'X. Solar ROI Calculator', id: 'solar-roi-calculator' }
              ].map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => {
                      if (window.changeSTEMApparatus) {
                        window.changeSTEMApparatus(link.id);
                      }
                    }}
                    className="font-body text-white/70 hover:text-[#E63946] text-left transition-colors duration-300 razor-underline text-xs"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Technical Info */}
          <div>
            <h4 className="font-display text-lg mb-6">SPECIFICATION</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Award className="w-5 h-5 text-[#E63946] flex-shrink-0 mt-0.5" />
                <span className="font-body text-xs text-white/70">
                  Calibrated Atomic Engine<br />Registered Serial ATOM-1956-V
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Book className="w-5 h-5 text-[#E63946] flex-shrink-0" />
                <span className="font-body text-xs text-white/70">
                  Mathematics Powered by Math.js
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Atom className="w-5 h-5 text-[#E63946] flex-shrink-0" />
                <span className="font-body text-xs text-white/70">
                  React + TypeScript + Tailwind
                </span>
              </li>
            </ul>

            <div className="mt-6 pt-6 border-t border-white/10">
              <h5 className="font-body text-[10px] text-white/50 uppercase tracking-wider mb-2">
                WORKSHOP STATUS
              </h5>
              <p className="font-body text-xs text-white/70 uppercase">
                System: CALIBRATED & VERIFIED<br />
                Nullspace Solver: ACTIVE
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-body text-xs text-white/50 uppercase">
              © {currentYear} STEM Workshop. Designed as a solo student project • MIT License.
            </p>
            <div className="flex flex-wrap items-center gap-4 md:gap-6 justify-center md:justify-end">
              <button 
                onClick={() => window.openStudentManifesto('about')}
                className="font-body text-xs text-white/50 hover:text-[#E63946] transition-colors uppercase cursor-pointer"
              >
                I. About Lab
              </button>
              <button 
                onClick={() => window.openStudentManifesto('privacy')}
                className="font-body text-xs text-white/50 hover:text-[#E63946] transition-colors uppercase cursor-pointer"
              >
                II. Privacy Ledger
              </button>
              <button 
                onClick={() => window.openStudentManifesto('terms')}
                className="font-body text-xs text-white/50 hover:text-[#E63946] transition-colors uppercase cursor-pointer"
              >
                III. Terms
              </button>
              <button 
                onClick={() => window.openStudentManifesto('pricing')}
                className="font-body text-xs text-white/50 hover:text-[#E63946] transition-colors uppercase cursor-pointer"
              >
                IV. Pricing (Free)
              </button>
              <button 
                onClick={() => window.openStudentManifesto('open-source')}
                className="font-body text-xs text-white/50 hover:text-[#E63946] transition-colors uppercase cursor-pointer"
              >
                V. Open Source (MIT)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Barber pole accent */}
      <div className="absolute bottom-0 right-0 w-4 h-full barber-pole-stripes hidden lg:block" />
    </footer>
  );
};

export default Footer;
