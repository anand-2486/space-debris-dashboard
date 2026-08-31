import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import astraIcon from '../../assets/astra_icon.png';

export default function MissionNavigation({ activeTab, onTabChange }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current active navigation key
  const currentPath = location.pathname;
  let computedActive = activeTab || '';
  if (!computedActive) {
    if (currentPath === '/dashboard') computedActive = 'DASHBOARD';
    else if (currentPath.startsWith('/satellites')) computedActive = 'SATELLITES';
    else if (currentPath.startsWith('/conjunction')) computedActive = 'CONJUNCTIONS';
    else computedActive = '';
  }

  const navItems = [
    { label: 'DASHBOARD', key: 'DASHBOARD', path: '/dashboard' },
    { label: 'SATELLITES', key: 'SATELLITES', path: '/satellites' },
    { label: 'CONJUNCTIONS', key: 'CONJUNCTIONS', path: '/conjunctions' },
  ];

  const handleNavClick = (item) => {
    if (onTabChange) {
      onTabChange(item.key);
    } else {
      navigate(item.path);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#02040a]/80 backdrop-blur-md border-b border-cyan-500/10 px-6 sm:px-10 lg:px-16 h-16 flex items-center justify-between pointer-events-auto">
      {/* ─────────────────────────────────────────────────────────────
          LEFT: ASTRA-TRACK (HOME LINK WITH BRAND LOGO)
          ───────────────────────────────────────────────────────────── */}
      <Link to="/" className="flex items-center gap-3 group">
        <img
          src={astraIcon}
          alt="ASTRA-TRACK Logo"
          className="w-8 h-8 sm:w-9 sm:h-9 object-contain select-none transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]"
        />
        <span className="font-black tracking-widest text-base sm:text-lg text-white font-mono group-hover:text-cyan-400 transition-colors">
          ASTRA-TRACK
        </span>
      </Link>

      {/* ─────────────────────────────────────────────────────────────
          NAV LINKS: DASHBOARD | SATELLITES | CONJUNCTIONS
          ───────────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1 sm:gap-2">
        {navItems.map((item) => {
          const isActive = computedActive === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleNavClick(item)}
              className={`px-3.5 sm:px-4 py-1.5 rounded text-xs font-mono tracking-wider transition-all uppercase ${
                isActive
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/50 font-bold shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
