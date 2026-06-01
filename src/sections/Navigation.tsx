import { useState, useEffect, useRef } from 'react';
import { Menu, X, Atom, ChevronDown, Binary, Landmark, Zap } from 'lucide-react';

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const categories = [
    {
      title: "Algebra & Calculus",
      icon: Binary,
      color: "text-[#E63946]",
      items: [
        { id: 'matrix-lab', label: 'I. Matrix Workbench' },
        { id: 'equation-solver', label: 'II. Equation Solver' },
        { id: 'chem-balancer', label: 'III. Chem Balancer' },
        { id: 'numerical-playground', label: 'IV. Numerical Plotter' },
        { id: 'stats-explorer', label: 'V. Statistics Explorer' },
        { id: 'symbolic-calculus-lab', label: 'XIV. Symbolic Calculus' },
        { id: 'bayesian-inference-lab', label: 'XVI. Bayesian Engine' }
      ]
    },
    {
      title: "Physics & Engineering",
      icon: Zap,
      color: "text-[#C5A059]",
      items: [
        { id: 'logic-gate-simulator', label: 'VI. Circuit Simulator' },
        { id: 'geometry-lab', label: 'VII. Geometry Lab' },
        { id: 'fourier-waveform-studio', label: 'VIII. Fourier Studio' },
        { id: 'graph-algorithm-visualizer', label: 'IX. Graph Visualizer' },
        { id: 'barnes-hut-simulator', label: 'XV. Gravity Simulator' }
      ]
    },
    {
      title: "Eco & Utility Estimators",
      icon: Landmark,
      color: "text-[#457B9D]",
      items: [
        { id: 'solar-roi-calculator', label: 'X. Solar ROI Calculator' },
        { id: 'pediatric-dose-helper', label: 'XI. Pediatric Dose Helper' },
        { id: 'leak-cost-calculator', label: 'XII. Leak Cost Estimator' },
        { id: 'carbon-travel-planner', label: 'XIII. Carbon Planner' }
      ]
    }
  ];

  const handleLinkClick = (id: string) => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    if (window.changeSTEMApparatus) {
      window.changeSTEMApparatus(id);
    }
  };

  const scrollToHome = () => {
    setIsMobileMenuOpen(false);
    if (window.goSTEMHome) {
      window.goSTEMHome();
    } else {
      const element = document.getElementById('home');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 pl-2.5 lg:pl-0 transition-all duration-500 ${
          isScrolled 
            ? 'bg-[#F5F1E8]/95 backdrop-blur-md shadow-lg border-b border-[#1D3557]/20 py-2' 
            : 'bg-transparent py-4'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-3 sm:px-4 md:px-8">
          <div className="flex items-center justify-between h-12 sm:h-16">
            
            {/* Logo */}
            <a 
              href="#home" 
              onClick={(e) => { e.preventDefault(); scrollToHome(); }}
              className="flex items-center gap-2 sm:gap-3 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#E63946] flex items-center justify-center group-hover:bg-[#1D3557] transition-colors duration-300">
                <Atom className="w-4 sm:w-5 h-4 sm:h-5 text-white animate-spin-slow" style={{ animationDuration: '8s' }} />
              </div>
              <div>
                <span className="font-display text-sm sm:text-lg md:text-xl text-[#1D3557]">STEM</span>
                <span className="font-display text-sm sm:text-lg md:text-xl text-[#E63946] ml-0.5 sm:ml-1">WORKSHOP</span>
              </div>
            </a>

            {/* Desktop Navigation & Central Spacious Layout */}
            <div className="hidden lg:flex items-center gap-6">
              <button
                onClick={scrollToHome}
                className="ticket-btn text-[10px] sm:text-xs py-1.5 px-3 sm:px-4 whitespace-nowrap select-none bg-[#1D3557] hover:bg-[#E63946] text-white"
              >
                🏠 Home Base
              </button>

              {/* The Dropdown Drawer Button */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="ticket-btn flex items-center gap-1.5 py-1.5 px-3 sm:px-4 text-[10px] sm:text-xs select-none bg-[#1D3557] hover:bg-[#E63946] text-white"
                >
                  <span className="hidden sm:inline">⚙️ APPARATUS VIEWPORT</span>
                  <span className="sm:hidden">⚙️ VIEW</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Paper Binder Menu */}
                {isDropdownOpen && (
                  <div 
                    className="absolute top-full right-1/2 translate-x-1/2 mt-3 sm:mt-4 w-[95vw] sm:w-[680px] max-w-md sm:max-w-none bg-[#FFFDF0] border-4 double border-[#1D3557] p-4 sm:p-6 shadow-2xl z-50 animate-fadeIn"
                    style={{ boxShadow: '6px 6px 0px #E63946' }}
                  >
                    {/* Header border stripe */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E63946] via-[#1D3557] to-[#C5A059]" />
                    
                    <div className="border-b border-dashed border-[#1D3557]/20 pb-3 mb-4 flex justify-between items-center">
                      <span className="font-display text-xs text-[#E63946] font-bold">★ CHASSIS LAB DRAWER SELECTOR ★</span>
                      <span className="font-body text-[10px] text-[#1D3557]/60 font-bold uppercase tracking-widest">Model 1956 Integrator</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                      {categories.map((cat, idx) => {
                        const Icon = cat.icon;
                        return (
                          <div key={idx} className="space-y-3">
                            <span className="font-display text-[10px] tracking-wider text-[#1D3557] border-b-2 border-dashed border-[#1D3557]/15 pb-1 flex items-center gap-1.5 font-bold">
                              <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                              {cat.title}
                            </span>
                            <div className="flex flex-col space-y-1.5">
                              {cat.items.map(item => (
                                <button
                                  key={item.id}
                                  onClick={() => handleLinkClick(item.id)}
                                  className="text-left font-body text-xs text-[#1D3557]/80 hover:text-[#E63946] hover:bg-[#E63946]/5 py-1 px-1.5 transition-all font-semibold rounded-sm"
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-5 pt-3 border-t border-dashed border-[#1D3557]/15 text-center">
                      <span className="font-body text-[9px] text-[#1D3557]/55 uppercase tracking-widest">
                        Designed, optimized & certified 100% free offline calculators
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick action compute data & Mobile Menu Toggle */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  if (window.openStudentManifesto) {
                    window.openStudentManifesto('about');
                  }
                }}
                className="hidden sm:inline-block ticket-btn text-[10px] sm:text-xs py-1.5 px-3 sm:px-4 whitespace-nowrap select-none"
              >
                📜 MANIFESTO
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-[#1D3557] hover:text-[#E63946] transition-colors"
                aria-label="Toggle Navigation Menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-[#F5F1E8] border-t-2 border-[#1D3557] shadow-xl max-h-[85vh] overflow-y-auto z-40 animate-slideIn">
            <div className="px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
              
              <button
                onClick={scrollToHome}
                className="w-full ticket-btn text-xs sm:text-sm py-2 bg-[#1D3557] hover:bg-[#E63946] text-white select-none"
              >
                🏠 Home Base
              </button>

              {/* Accordion Categories */}
              {categories.map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <div key={idx} className="space-y-3">
                    <span className="font-display text-xs text-[#E63946] tracking-wider flex items-center gap-2 border-b border-dashed border-[#1D3557]/10 pb-1">
                      <Icon className="w-4 h-4 text-[#1D3557]" />
                      {cat.title}
                    </span>
                    <div className="pl-4 flex flex-col space-y-3">
                      {cat.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleLinkClick(item.id)}
                          className="text-left font-body text-sm font-semibold text-[#1D3557]/80 hover:text-[#E63946] py-1 border-l-2 border-[#1D3557]/10 pl-3 transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (window.openStudentManifesto) {
                    window.openStudentManifesto('about');
                  }
                }}
                className="w-full ticket-btn text-xs py-2 mt-4"
              >
                📜 Read Solo Project Manifesto
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Retro border pole accent on mobile - Symmetrical Left & Right */}
      <div className="lg:hidden fixed left-0 top-0 bottom-0 w-2.5 barber-pole-stripes z-40" />
      <div className="lg:hidden fixed right-0 top-0 bottom-0 w-2.5 barber-pole-stripes z-40" />
    </>
  );
};

export default Navigation;
