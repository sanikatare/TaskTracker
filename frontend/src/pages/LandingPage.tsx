import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const titleLetters = 'TaskTrack AI'.split('');

  const triggerEnterDashboard = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);

    setTimeout(() => {
      navigate('/dashboard');
    }, 360);
  }, [isExiting, navigate]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerEnterDashboard();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerEnterDashboard]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    setMouseOffset({ x: nx, y: ny });
  }

  return (
    <div
      onClick={triggerEnterDashboard}
      onMouseMove={handleMouseMove}
      role="button"
      tabIndex={0}
      aria-label="Enter TaskTrack AI"
      className={`relative min-h-screen w-full overflow-hidden bg-[#FAF8FC] text-black select-none cursor-pointer flex flex-col items-center justify-center p-6 sm:p-12 transition-all duration-400 ease-out ${
        isExiting ? 'opacity-0 scale-[1.03]' : 'opacity-100 scale-100'
      }`}
    >
      {/* Soft Purple Ambient Atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-300/20 blur-[130px] rounded-full"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 right-10 w-[500px] h-[500px] bg-purple-900/10 blur-[120px] rounded-full"
      />

      {/* Interactive Stacked Centerpiece */}
      <div
        style={{
          transform: `translate3d(${mouseOffset.x * -10}px, ${mouseOffset.y * -8}px, 0)`,
        }}
        className="relative w-full max-w-3xl transition-transform duration-300 ease-out"
      >
        {/* Bottom Black & Deep Purple Layer */}
        <div
          aria-hidden="true"
          className="absolute inset-0 translate-x-3.5 translate-y-3.5 -rotate-[1.8deg] rounded-3xl bg-[#140827] border border-purple-900/40 shadow-xl"
        />

        {/* Middle Soft Purple Layer */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -translate-x-2.5 translate-y-2 rotate-[1.3deg] rounded-3xl bg-purple-100 border border-purple-300/80 shadow-md"
        />

        {/* Primary Cover Sheet in Crisp White with Purple Accents */}
        <div className="relative rounded-3xl bg-white border border-purple-200/90 px-8 py-20 sm:px-16 sm:py-24 overflow-hidden shadow-[0_24px_60px_-15px_rgba(88,28,135,0.18)]">
          {/* Silk Bookmark Ribbon at Top Right (Purple to Black) */}
          <div
            aria-hidden="true"
            className="absolute top-0 right-12 sm:right-16 w-7 h-20 bg-gradient-to-b from-purple-700 via-purple-900 to-black shadow-md"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)',
            }}
          />

          {/* Minimal Purple Inset Frame */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-4 sm:inset-6 rounded-2xl border border-purple-200/70"
          />

          {/* Monumental Editorial Title */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            {/* AI Chip */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-xs font-semibold text-purple-900 mb-6 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              <span>Smart Study &amp; Task Workspace</span>
            </div>

            <h1
              aria-label="TaskTrack AI"
              className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-black flex items-center justify-center whitespace-nowrap"
            >
              {titleLetters.map((char, index) => (
                <span
                  key={index}
                  style={{ animationDelay: `${index * 40}ms` }}
                  className={`inline-block opacity-0 animate-fade-up ${
                    char === ' ' ? 'w-2.5 sm:w-4' : ''
                  } ${
                    index >= 10 ? 'text-purple-700' : 'text-black'
                  }`}
                >
                  {char}
                </span>
              ))}
            </h1>

            {/* Subtle Purple Flourish Rule */}
            <div
              aria-hidden="true"
              className="mt-6 flex items-center gap-3 opacity-90"
            >
              <span className="w-12 sm:w-20 h-px bg-gradient-to-r from-transparent to-purple-600/70" />
              <span className="w-2.5 h-2.5 rotate-45 border border-purple-700 bg-purple-100" />
              <span className="w-12 sm:w-20 h-px bg-gradient-to-l from-transparent to-purple-950/70" />
            </div>

            {/* Subtitle */}
            <p className="mt-5 text-sm sm:text-base text-purple-950/70 max-w-md font-medium">
              Calibrated academic scheduling, machine learning effort prediction, and intelligent focus planning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
